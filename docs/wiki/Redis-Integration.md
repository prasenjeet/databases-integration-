# Redis Integration

## Driver

[`ioredis`](https://github.com/redis/ioredis) — a full-featured Redis client for Node.js with TypeScript support, cluster mode, Lua scripting, and a clean promise-based API.

## Source files

| File | Purpose |
|---|---|
| `src/databases/redis/client.ts` | ioredis singleton with lazy connect |
| `src/databases/redis/examples.ts` | Data structure demos + Pub/Sub |

## Connection

The client is created with `lazyConnect: true` so it doesn't attempt to connect until `redis.connect()` is explicitly called:

```typescript
client = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});
```

## Data structure demos

### String (with TTL)

```typescript
await redis.set(`demo:greeting`, "Hello, Redis!", "EX", 60);  // expires in 60 s
const val = await redis.get(`demo:greeting`);
const ttl = await redis.ttl(`demo:greeting`);  // remaining seconds
```

### Counter (atomic increment)

```typescript
await redis.set(`demo:counter`, "0");
await redis.incrby(`demo:counter`, 5);
await redis.incrby(`demo:counter`, 3);
// → "8"
```

### Hash (structured object)

```typescript
await redis.hset(`demo:session:user:42`, {
  userId: "42", username: "alice", role: "admin",
});
const session = await redis.hgetall(`demo:session:user:42`);
```

### List (queue)

```typescript
await redis.rpush(`demo:task:queue`, "task:1", "task:2", "task:3");
const task = await redis.lpop(`demo:task:queue`);  // dequeue FIFO
const len  = await redis.llen(`demo:task:queue`);
```

### Set (unique values)

```typescript
await redis.sadd(`demo:tags`, "typescript", "nodejs", "redis", "nodejs");  // duplicate ignored
const tags = await redis.smembers(`demo:tags`);
// → ["typescript", "nodejs", "redis"]
```

### Sorted Set (leaderboard)

```typescript
await redis.zadd(`demo:leaderboard`,
  1200, "alice", 850, "bob", 1500, "charlie", 950, "diana");
const top3 = await redis.zrevrange(`demo:leaderboard`, 0, 2, "WITHSCORES");
// → ["charlie", "1500", "alice", "1200", "diana", "950"]
```

### Pub/Sub

```typescript
// Subscriber (on a duplicated connection)
const sub = redis.duplicate();
await sub.connect();
sub.subscribe("demo:channel");
sub.on("message", (_ch, msg) => console.log("received:", msg));

// Publisher
await redis.publish("demo:channel", JSON.stringify({ event: "demo" }));
```

## Demo walkthrough

`runRedisDemo()` runs all seven patterns in sequence, cleaning up `demo:*` keys before starting.

## Running

```bash
npm run demo:redis
```

## Configuration

See [Configuration](Configuration.md#redis) for environment variables.
