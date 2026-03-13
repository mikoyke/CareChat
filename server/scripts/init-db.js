require("dotenv").config();
const pool = require("../db");

async function initDB() {
  const client = await pool.connect();
  try {
    console.log("Initializing database...");

    await client.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    console.log("✓ pgvector extension");

    await client.query(`
  DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('nurse', 'crc', 'admin');
  EXCEPTION WHEN duplicate_object THEN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
  END $$
`);
    console.log("✓ user_role type");

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role user_role NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✓ users table");

    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) DEFAULT 'New Conversation',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✓ conversations table");

    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        prompt_tokens INTEGER,
        completion_tokens INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✓ messages table");

    await client.query(`
      CREATE TABLE IF NOT EXISTS message_feedback (
        id SERIAL PRIMARY KEY,
        message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✓ message_feedback table");

    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        embedding vector(1536),
        metadata JSONB,
        role user_role NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✓ documents table");

    await client.query(`
      CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `);
    console.log("✓ vector index");

    console.log("\n✅ Database initialized successfully!");
  } catch (err) {
    console.error("Database initialization error:", err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

initDB();
