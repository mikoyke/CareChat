const { Pool } = require("pg");
require("dotenv").config();

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "carechat_dev",
  user: "miko",
});

module.exports = pool;
