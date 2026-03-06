const { openAIEmbeddings, OpenAIEmbeddings } = require("@langchain/openai");
const pool = require("../db");

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: "text-embedding-3-small",
});

function toPgVectorLiteral(vec) {
  const safe = vec.map((n) => (Number.isFinite(n) ? n : 0));
  return `[${safe.join(",")}]`;
}

async function searchDocuments(query, role, limit, threshold = 0.7) {
  try {
    const EmbeddingArr = await embeddings.embedQuery(query);

    const embeddingLiteral = toPgVectorLiteral(EmbeddingArr);

    const result = await pool.query(
      `SELECT content, 1-(embedding <=> $1::vector) as similarity FROM documents WHERE role = $2 AND 1-(embedding <=> $1::vector) > $3 ORDER BY embedding <=> $1::vector LIMIT $4`,
      [embeddingLiteral, role, threshold, limit],
    );

    return result.rows;
  } catch (err) {
    console.error("RAG search error: ", err);
    return [];
  }
}

async function buildRagContext(query, role) {
  const docs = await searchDocuments(query, role);
  if (docs.length === 0) return "";

  return (
    `\n\nRelevent clinical reference documents:\n` +
    docs
      .map(
        (r, i) =>
          `[Documents ${i + 1}](similarity:${r.similarity.toFixed(2)})\n${r.content}`,
      )
      .join("\n\n")
  );
}

module.exports = {
  searchDocuments,
  buildRagContext,
  embeddings,
  toPgVectorLiteral,
};
