const express = require("express");
const OpenAI = require("openai");
const pool = require("../db");
const { authenticate } = require("../middleware/auth");
const { buildRagContext } = require("../services/ragService");
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 从数据库读取系统提示词
async function getSystemPrompt(role) {
  const result = await pool.query(
    "SELECT content FROM prompts WHERE role = $1",
    [role],
  );
  return result.rows[0]?.content || "";
}

// 发送消息，流式输出
router.post("/message", authenticate, async (req, res) => {
  const { conversationId, content } = req.body;
  const { role: userRole } = req.user;

  try {
    //1.取出这次对话的历史消息
    const historyResult = await pool.query(
      `SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [conversationId],
    );

    const history = historyResult.rows;
    const [systemPrompt, { context: ragContext, sources }] = await Promise.all([
      getSystemPrompt(userRole),
      buildRagContext(content, userRole),
    ]);

    // 2. 构建发给 OpenAI 的消息数组
    const messages = [
      { role: "system", content: systemPrompt + ragContext },
      ...history,
      { role: "user", content },
    ];

    // 3. 把用户消息存入数据库
    await pool.query(
      `INSERT INTO messages(conversation_id,role,content) VALUES($1,$2,$3)`,
      [conversationId, "user", content],
    );

    // 4. 设置流式输出的响应头
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // 5. 调用 OpenAI，开启流式输出
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      stream: true,
    });

    //6.逐块把 AI 回答发给前端
    let fullResponse = "";

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    //7. 把完整的 AI 回答存入数据库，拿到真实 id
    const saved = await pool.query(
      `INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3) RETURNING id`,
      [conversationId, "assistant", fullResponse],
    );
    const messageId = saved.rows[0].id;

    // 8. 流结束，把 messageId 一起发给前端
    res.write(`data: ${JSON.stringify({ done: true, messageId, sources })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Chat error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Chat error" });
    }
  }
});

// 创建新对话
router.post("/conversations", authenticate, async (req, res) => {
  const { title } = req.body;
  const { id: userId } = req.user;

  try {
    const result = await pool.query(
      `INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING *`,
      [userId, title || "New Conversation"],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// 获取用户所有对话
router.get("/conversations", authenticate, async (req, res) => {
  const { id: userId } = req.user;

  try {
    const result = await pool.query(
      `SELECT * FROM conversations WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 获取某个对话的所有消息
router.get("/conversations/:id/messages", authenticate, async (req, res) => {
  const { id: conversationId } = req.params;

  try {
    const ownerCheck = await pool.query(
      "SELECT id FROM conversations WHERE id = $1 AND user_id = $2",
      [conversationId, req.user.id],
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const result = await pool.query(
      `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [conversationId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

//更新对话标题
router.patch("/conversations/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "title is required" });
  }

  try {
    const result = await pool.query(
      "UPDATE conversations SET title = $1 WHERE id = $2 AND user_id = $3 RETURNING * ",
      [title, id, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

//DELETE
router.delete("/conversations/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      "DELETE FROM conversations WHERE id = $1 AND user_id = $2",
      [id, req.user.id],
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// 提交消息反馈（👍 / 👎）
router.post("/messages/:id/feedback", authenticate, async (req, res) => {
  const { id: messageId } = req.params;
  const { rating } = req.body;

  if (rating !== 1 && rating !== -1) {
    return res.status(400).json({ error: "rating must be 1 or -1" });
  }

  try {
    // 确认该消息属于当前用户的对话
    const ownerCheck = await pool.query(
      `SELECT m.id FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       WHERE m.id = $1 AND c.user_id = $2`,
      [messageId, req.user.id],
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }

    // 替换已有的反馈（先删后插）
    await pool.query("DELETE FROM message_feedback WHERE message_id = $1", [
      messageId,
    ]);
    await pool.query(
      "INSERT INTO message_feedback (message_id, rating) VALUES ($1, $2)",
      [messageId, rating],
    );

    res.json({ success: true, rating });
  } catch (err) {
    console.error("Feedback error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
