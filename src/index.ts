import "dotenv/config";
import { runPostgresqlDemo } from "./databases/postgresql/examples";
import { runMysqlDemo } from "./databases/mysql/examples";
import { runMongodbDemo } from "./databases/mongodb/examples";
import { runRedisDemo } from "./databases/redis/examples";
import { runFilecoinDemo } from "./databases/filecoin/examples";
import { runEtcdDemo } from "./databases/etcd/examples";
import { closePool as closePg } from "./databases/postgresql/client";
import { closePool as closeMysql } from "./databases/mysql/client";
import { disconnectMongo } from "./databases/mongodb/client";
import { closeRedis } from "./databases/redis/client";
import { closeEtcd } from "./databases/etcd/client";

async function main(): Promise<void> {
  console.log("Multi-Database Integration Demo");
  console.log("================================\n");

  // Run each demo sequentially so output stays readable.
  await runPostgresqlDemo();
  await runMysqlDemo();
  await runMongodbDemo();
  await runRedisDemo();
  await runFilecoinDemo();
  await runEtcdDemo();

  console.log("\n\nAll demos finished. Closing connections...");
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.allSettled([closePg(), closeMysql(), disconnectMongo(), closeRedis(), closeEtcd()]);
    console.log("Connections closed.");
  });
