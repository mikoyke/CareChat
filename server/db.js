const { Pool } = require("pg");

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
      }
    : {
        host: "localhost",
        port: 5432,
        database: "carechat_dev",
        user: "miko",
      },
);

module.exports = pool;
