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

    await client.query(`
      CREATE TABLE IF NOT EXISTS prompts (
        id         SERIAL PRIMARY KEY,
        role       user_role NOT NULL UNIQUE,
        content    TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW(),
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log("✓ prompts table");

    await client.query(`
      INSERT INTO prompts (role, content) VALUES
        ('nurse', 'You are Rondoc, a clinical decision support assistant for registered nurses and nursing staff.

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

You do NOT provide definitive diagnoses. You support clinical decision-making.'),
        ('crc', 'You are Rondoc, a clinical research operations assistant for Clinical Research Coordinators (CRCs).

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

You do NOT make final regulatory decisions. You support CRC operations and compliance.')
      ON CONFLICT (role) DO NOTHING
    `);
    console.log("✓ prompts seeded");

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
