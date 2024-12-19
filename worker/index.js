const keys = require("./keys");
const redis = require("redis");

// Fibonacci sequence function
function fibonacci(index) {
  if (index < 2) return index;
  return fibonacci(index - 1) + fibonacci(index - 2);
}

// Create Redis client
const client = redis.createClient({
  socket: {
    host: keys.REDIS_HOST,
    port: keys.REDIS_PORT,
    reconnectStrategy: (retries) => {
      return Math.min(retries * 100, 20000); // Retry with an increasing delay, up to 20 seconds
    },
  },
});

// Create a duplicate for subscription
const sub = client.duplicate();

(async () => {
  try {
    // Connect both clients
    await client.connect();
    await sub.connect();
    console.log("Redis clients connected.");

    // Subscribe to the "insert" channel
    await sub.subscribe("insert", async (message) => {
      const index = parseInt(message, 10);
      console.log(`Received index: ${index}`);

      // Calculate Fibonacci and store in Redis
      const result = fibonacci(index);
      await client.hSet("values", index, result);
      console.log(`Stored Fibonacci(${index}) = ${result}`);
    });
  } catch (err) {
    console.error("Error:", err);
  }
})();
