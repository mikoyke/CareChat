const express = require("express");
const pool = require("../db");
const { authenticate, authorize } = require("../middleware/auth");
const router = express.Router();

// 获取所有角色的 prompt（仅 admin）
router.get("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, role, content, updated_at FROM prompts ORDER BY role",
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get prompts error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 更新指定角色的 prompt（仅 admin）
router.put("/:role", authenticate, authorize("admin"), async (req, res) => {
  const { role } = req.params;
  const { content } = req.body;

  if (!["nurse", "crc"].includes(role)) {
    return res.status(400).json({ error: "role must be nurse or crc" });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ error: "content is required" });
  }

  try {
    const result = await pool.query(
      `UPDATE prompts
       SET content = $1, updated_at = NOW(), updated_by = $2
       WHERE role = $3
       RETURNING id, role, content, updated_at`,
      [content.trim(), req.user.id, role],
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update prompt error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
