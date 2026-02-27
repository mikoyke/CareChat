const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { authenticate } = require("../middleware/auth");
const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!["nurse", "crc"].includes(role)) {
    return res.status(400).json({ error: "Role must be nurse or crc" });
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    console.log("hash created:", hash);

    const result = await pool.query(
      "INSERT INTO users (email, password_hash, name, role) VALUES ($1,$2,$3,$4) RETURNING id, email, name, role",
      [email, hash, name, role],
    );
    console.log("query result:", result.rows);

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error("Register error:", err);
    if (err.code === "23505")
      return res.status(409).json({ error: "Email already exists" });

    res.status(500).json({ error: "Server error" });
  }
});

//Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

//UserInfo
router.get("/me", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, name, role, created_at FROM users WHERE id = $1",
      [req.user.id],
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
