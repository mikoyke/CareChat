const express = require("express");
const OpenAI = require("openai");
const pool = require("../db");
const { authenticate } = require("../middleware/auth");
const router = express.Router();

const openai = new OpenAI({
  apikey: process.env.OPENAI_API_KEY,
});

// 系统提示词，根据角色返回不同内容
const getSystemPrompt = (role) => {
  if (role === "nurse") {
    return `You are CareChat, an AI assistant for nurses and clinical staff. You help with medication queries, nursing procedures, and clinical questions. Always remind users to verify critical information with their institution's protocols. Be concise, accurate and professional.`;
  } else {
    return `You are CareChat, an AI assistant for Clinical Research Coordinators (CRCs).
    You help with clinical trial protocol interpretation, IRB processes, adverse event reporting, and eligibility criteria screening.
    Always remind users to follow their specific protocol and consult their PI for critical decisions.
    Be concise, accurate, and professional.`;
  }
};

// 发送消息，流式输出
router.post("/message", authenticate, async (req, res) => {
  const { conversationId, content } = req.body;
  const { id: userId, role: userRole } = req.user;

  try {
    //1.取出这次对话的历史消息
    const historyResult = await pool.query(
      `SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [conversationId],
    );

    const history = historyResult.rows;

    // 2. 构建发给 OpenAI 的消息数组
    const messages = [
      { role: "system", content: getSystemPrompt(userRole) },
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

    // 7. 流结束，发送结束信号
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

    //8.把完整的 AI 回答存入数据库
    await pool.query(
      `INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)`,
      [conversationId, "assistant", fullResponse],
    );
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
    const result = await pool.query(
      ` SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [conversationId],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
