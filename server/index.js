const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/documents", require("./routes/documents"));

const { authenticate, authorize } = require("./middleware/auth");

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: " Carechat server is running" });
});

// RBAC 测试接口
app.get("/api/nurse-only", authenticate, authorize("nurse"), (req, res) => {
  res.json({ message: "Nurse content: medication guidelines", user: req.user });
});

app.get("/api/crc-only", authenticate, authorize("crc"), (req, res) => {
  res.json({ message: "CRC content: protocol interpretation", user: req.user });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
