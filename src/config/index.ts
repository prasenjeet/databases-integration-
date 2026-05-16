import dotenv from "dotenv";
dotenv.config();

export const config = {
  postgresql: {
    host: process.env.POSTGRESQL_HOST ?? "localhost",
    port: parseInt(process.env.POSTGRESQL_PORT ?? "5432"),
    user: process.env.POSTGRESQL_USER ?? "postgres",
    password: process.env.POSTGRESQL_PASSWORD ?? "postgres",
    database: process.env.POSTGRESQL_DB ?? "sampledb",
  },
  mysql: {
    host: process.env.MYSQL_HOST ?? "localhost",
    port: parseInt(process.env.MYSQL_PORT ?? "3306"),
    user: process.env.MYSQL_USER ?? "mysql",
    password: process.env.MYSQL_PASSWORD ?? "mysql",
    database: process.env.MYSQL_DB ?? "sampledb",
  },
  mongodb: {
    uri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/sampledb",
  },
  redis: {
    host: process.env.REDIS_HOST ?? "localhost",
    port: parseInt(process.env.REDIS_PORT ?? "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  filecoin: {
    rpcUrl: process.env.FILECOIN_RPC_URL ?? "https://api.node.glif.io/rpc/v1",
    authToken: process.env.FILECOIN_AUTH_TOKEN ?? "",
  },
};
