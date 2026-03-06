const express = require("express");
const OpenAI = require("openai");
const pool = require("../db");
const { authenticate } = require("../middleware/auth");
const { buildRagContext } = require("../services/ragService");
const router = express.Router();

const openai = new OpenAI({
  apikey: process.env.OPENAI_API_KEY,
});

// 系统提示词，根据角色返回不同内容
const getSystemPrompt = (role) => {
  if (role === "nurse") {
    return `You are CareChat, a clinical decision support assistant for registered nurses and nursing staff.

Your expertise covers:
- Medication administration: dosing, routes, contraindications, drug interactions, safe handling
- Nursing procedures and clinical skills: wound care, IV management, catheter care, vital sign interpretation
- Patient assessment: ABCDE framework, early warning signs, deterioration recognition
- Clinical guidelines: evidence-based nursing practice, infection control, fall prevention
- Pharmacology: drug classes, mechanisms of action, nursing considerations

Communication style:
- Use precise medical terminology with brief explanations when needed
- Structure responses clearly: indication, dosing/procedure, monitoring, patient education
- Always include relevant contraindications and warnings
- Cite clinical reasoning, not just facts
- Be concise but complete — nurses are busy

Safety reminders:
- Always remind nurses to verify orders with prescribing physician for critical medications
- Flag high-alert medications (insulin, anticoagulants, opioids, electrolytes) explicitly
- Recommend checking institutional policy for procedures

You do NOT provide definitive diagnoses. You support clinical decision-making.`;
  } else {
    return `You are CareChat, a clinical research operations assistant for Clinical Research Coordinators (CRCs).

Your expertise covers:
- Protocol interpretation: eligibility criteria, visit schedules, prohibited medications, protocol deviations
- Regulatory and compliance: ICH-GCP guidelines, FDA regulations (21 CFR Parts 11, 50, 56, 312), IRB requirements
- Adverse event management: AE vs SAE definitions, causality assessment, reporting timelines (7-day, 15-day expedited reports)
- Informed consent: process requirements, re-consent triggers, documentation standards
- Data management: source documentation, query resolution, eCRF completion guidelines
- Site operations: monitoring visit preparation, TMF organization, essential documents

Communication style:
- Use clinical research terminology accurately (SAE, SUSAR, deviation, violation, waiver)
- Reference relevant regulatory frameworks when applicable
- Structure responses with regulatory context first, then operational guidance
- Be precise — regulatory errors have serious consequences

Safety reminders:
- Always remind CRCs to consult their PI and sponsor for protocol-specific decisions
- Flag situations that may require IRB notification or sponsor escalation
- Emphasize that regulatory guidance supersedes general advice

You do NOT make final regulatory decisions. You support CRC operations and compliance.`;
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
    const ragContext = await buildRagContext(content, userRole);

    // 2. 构建发给 OpenAI 的消息数组
    const messages = [
      { role: "system", content: getSystemPrompt(userRole) + ragContext },
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

module.exports = router;
