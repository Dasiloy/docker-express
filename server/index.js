const express = require("express");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: "localhost:3000",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const keys = require("./keys");

const redis = require("redis");
const client = redis.createClient({
  socket: {
    host: keys.REDIS_HOST,
    port: keys.REDIS_PORT,
    reconnectStrategy: (retries) => {
      console.log(`Trying to reconnect to Redis... Attempt ${retries}`);
      return Math.min(1000, 5000 * 2 ** retries); // Exponential backoff strategy
    },
  },
});

const sub = client.duplicate();

(async () => {
  await client.connect();
  await sub.connect();
  console.log("Connected to Redis.");
})();

const Pool = require("pg").Pool;
const pgClient = new Pool({
  user: keys.DB_USERNAME,
  host: keys.DB_HOST,
  database: keys.DB_NAME,
  password: keys.DB_PASSWORD,
  port: keys.DB_PORT,
  ssl:
    process.env.NODE_ENV !== "production"
      ? false
      : { rejectUnauthorized: false },
});

pgClient.on("connect", (client) => {
  client
    .query("CREATE TABLE IF NOT EXISTS values (number INT)")
    .catch((err) => console.error(err));
});

app.get("/", async (req, res) => {
  return res.json({ message: "Fibonacci API is running!" });
});

app.post("/index", async (req, res) => {
  const { index } = req.body;

  if (isNaN(index) || index < 0) {
    return res
      .status(400)
      .json({ error: "Invalid index. Index must be a non-negative integer." });
  }

  if (parseInt(index) > 40) {
    return res
      .status(422)
      .json({ error: "Index is too large. Maximum allowed index is 40." });
  }

  await client.hSet("values", index, "Nothing yet");
  await sub.publish("insert", index);
  await pgClient.query("INSERT INTO values (number) VALUES ($1)", [index]);

  res.json({ message: "Index inserted successfully." });
});

app.get("/indices", async (req, res) => {
  const index = await pgClient.query("SELECT * FROM values");
  res.json(index.rows);
});

app.get("/values", async (req, res) => {
  try {
    const values = await client.hgetall("values");
    res.json(
      Object.entries(values).map(([key, value]) => ({
        indx: parseInt(key),
        value: parseInt(value),
      }))
    );
  } catch (error) {}
});

app.listen(process.env.PORT || 8000, () => {
  console.log("Server is running on port 8000.");
});
