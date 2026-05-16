import Redis from "ioredis";
import { config } from "../../config";

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

    client.on("error", (err) => {
      console.error("[Redis] Connection error:", err.message);
    });
  }
  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
