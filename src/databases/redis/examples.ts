import { getRedis, closeRedis } from "./client";

const KEY_PREFIX = "demo:";

export async function runRedisDemo(): Promise<void> {
  const label = "Redis";
  console.log(`\n${"=".repeat(50)}`);
  console.log(`  ${label} Demo`);
  console.log(`${"=".repeat(50)}`);

  const redis = getRedis();

  try {
    await redis.connect();
    console.log(`[${label}] Connected`);

    // Clean up previous demo keys
    const oldKeys = await redis.keys(`${KEY_PREFIX}*`);
    if (oldKeys.length) await redis.del(...oldKeys);

    // --- String: cache with TTL ---
    await redis.set(`${KEY_PREFIX}greeting`, "Hello, Redis!", "EX", 60);
    const greeting = await redis.get(`${KEY_PREFIX}greeting`);
    console.log(`[${label}] String GET:`, greeting);

    // --- Counter ---
    await redis.set(`${KEY_PREFIX}counter`, "0");
    await redis.incrby(`${KEY_PREFIX}counter`, 5);
    await redis.incrby(`${KEY_PREFIX}counter`, 3);
    const counter = await redis.get(`${KEY_PREFIX}counter`);
    console.log(`[${label}] Counter after +5+3:`, counter);

    // --- Hash: store a user session ---
    const sessionKey = `${KEY_PREFIX}session:user:42`;
    await redis.hset(sessionKey, {
      userId: "42",
      username: "alice",
      role: "admin",
      loginAt: new Date().toISOString(),
    });
    const session = await redis.hgetall(sessionKey);
    console.log(`[${label}] Hash session:`, session);

    // --- List: task queue ---
    const queueKey = `${KEY_PREFIX}task:queue`;
    await redis.rpush(queueKey, "task:1", "task:2", "task:3");
    const task = await redis.lpop(queueKey);
    const queueLen = await redis.llen(queueKey);
    console.log(`[${label}] Dequeued task: ${task}, remaining: ${queueLen}`);

    // --- Set: unique tags ---
    const tagsKey = `${KEY_PREFIX}tags`;
    await redis.sadd(tagsKey, "typescript", "nodejs", "redis", "nodejs"); // duplicate ignored
    const tags = await redis.smembers(tagsKey);
    console.log(`[${label}] Set members:`, tags.sort());

    // --- Sorted Set: leaderboard ---
    const lbKey = `${KEY_PREFIX}leaderboard`;
    await redis.zadd(lbKey, 1200, "alice", 850, "bob", 1500, "charlie", 950, "diana");
    const top3 = await redis.zrevrange(lbKey, 0, 2, "WITHSCORES");
    console.log(`[${label}] Top 3 leaderboard:`, top3);

    // --- Pub/Sub demo (fire-and-forget subscriber) ---
    const sub = redis.duplicate();
    await sub.connect();
    try {
      await sub.subscribe(`${KEY_PREFIX}channel`, (err) => {
        if (err) console.error(`[${label}] Subscribe error:`, err.message);
      });
      sub.on("message", (_channel, message) => {
        console.log(`[${label}] PubSub received:`, message);
      });

      await redis.publish(`${KEY_PREFIX}channel`, JSON.stringify({ event: "demo", ts: Date.now() }));
      // Give the subscriber time to receive before we close.
      await new Promise((r) => setTimeout(r, 200));
    } finally {
      await sub.quit();
    }

    // TTL check
    const ttl = await redis.ttl(`${KEY_PREFIX}greeting`);
    console.log(`[${label}] TTL on greeting key: ${ttl}s`);
  } catch (err) {
    console.error(`[${label}] Error:`, (err as Error).message);
  }
}

if (require.main === module) {
  runRedisDemo().finally(closeRedis);
}
