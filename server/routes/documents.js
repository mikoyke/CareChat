const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const pool = require("../db");
const { authenticate, authorize } = require("../middleware/auth");
const {
  embeddings,
  searchDocuments,
  toPgVectorLiteral,
} = require("../services/ragService");
const router = express.Router();

// 配置文件上传，存在内存里不写磁盘
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "text/plain"];
    if (!allowed.includes(file.mimetype)) {
      return cb(
        new multer.MulterError(
          "LIMIT_UNEXPECTED_FILE",
          "Only PDF and TXT supported",
        ),
      );
    }
    cb(null, true);
  },
});

// Helper: normalize extracted text
function normalizeText(text) {
  return (text || "").replace(/\u0000/g, "").trim();
}

// 上传并处理文档
router.post(
  "/upload",
  authenticate,
  authorize("nurse", "crc"),
  upload.single("file"),
  async (req, res) => {
    const client = await pool.connect();
    try {
      const role = req.user.role;
      const file = req.file;

      if (!file) return res.status(400).json({ error: "No file uploaded" });

      // 1. 提取文本
      let text = "";
      if (file.mimetype === "application/pdf") {
        const pdfData = await pdfParse(file.buffer);
        text = pdfData.text;
      } else if (file.mimetype === "text/plain") {
        text = file.buffer.toString("utf-8");
      } else {
        return res
          .status(400)
          .json({ error: "Only PDF and TXT files supported" });
      }

      text = normalizeText(text);
      if (!text) {
        return res
          .status(400)
          .json({ error: "No readable text extracted from file" });
      }
      // 2. 切块（Chunking）
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const chunks = await splitter.createDocuments([text]);
      if (!chunks.length) {
        return res
          .status(400)
          .json({ error: "Failed to split document into chunks" });
      }

      // 3. 生成 Embedding 并存入数据库
      await client.query("BEGIN");

      let stored = 0;
      const uploaderId = req.user?.id ?? null;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const content = normalizeText(chunk.pageContent);
        // Skip empty chunks
        if (!content) continue;

        // Generate embedding (Vectorization)
        const embeddingArr = await embeddings.embedQuery(content);
        // Convert to pgvector literal
        const embeddingLiteral = toPgVectorLiteral(embeddingArr);
        // Metadata (JSONB)
        const metadata = {
          source: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          chunkIndex: i,
          totalChunks: chunks.length,
          uploadedAt: new Date().toISOString(),
          uploaderId,
        };
        // pgvector:
        await client.query(
          "INSERT INTO documents (content,embedding, metadata,role) VALUES ($1,$2,$3, $4)",
          [content, embeddingLiteral, JSON.stringify(metadata), role],
        );
        stored++;
      }

      await client.query("COMMIT");
      res.json({
        message: `Successfully processed ${stored} chunks from ${file.originalname}`,
        file: {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        },
        chunks: stored,
      });
    } catch (err) {
      // Rollback transaction if needed
      try {
        await client.query("ROLLBACK");
      } catch (rollbackErr) {
        // ignore rollback error but log it
        console.error("ROLLBACK error:", rollbackErr);
      }

      // Multer errors (File Upload errors)
      if (err instanceof multer.MulterError) {
        // File too large or fileFilter rejection
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({ error: "File too large. Max 10MB." });
        }
        return res.status(400).json({ error: err.message });
      }

      console.error("Upload processing error:", err);
      return res.status(500).json({
        error: "Server error while processing document",
        details:
          process.env.NODE_ENV === "development" ? String(err) : undefined,
      });
    } finally {
      client.release();
    }
  },
);

// 列出当前角色的所有文档（按文件名聚合）
router.get("/", authenticate, async (req, res) => {
  const { role } = req.user;
  try {
    const result = await pool.query(
      `SELECT
        metadata->>'source'               AS source,
        metadata->>'mimetype'             AS mimetype,
        MAX((metadata->>'size')::integer) AS size,
        MIN(metadata->>'uploadedAt')      AS uploaded_at,
        COUNT(*)::integer                 AS chunk_count
      FROM documents
      WHERE role = $1
      GROUP BY metadata->>'source', metadata->>'mimetype'
      ORDER BY MIN(metadata->>'uploadedAt') DESC`,
      [role],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("List documents error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 删除某个文档的所有 chunks
router.delete("/", authenticate, authorize("nurse", "crc"), async (req, res) => {
  const { source } = req.query;
  const { role } = req.user;

  if (!source) {
    return res.status(400).json({ error: "source query param is required" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM documents WHERE metadata->>'source' = $1 AND role = $2",
      [source, role],
    );
    res.json({ deleted: result.rowCount });
  } catch (err) {
    console.error("Delete document error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 搜索相关文档
router.post("/search", authenticate, async (req, res) => {
  const { query, limit = 5 } = req.body;
  const { role } = req.user;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    const results = await searchDocuments(query, role, limit);
    res.json(results);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router;
