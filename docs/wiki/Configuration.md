# Configuration

All configuration is driven by environment variables. Copy `.env.example` to `.env` and edit as needed.

## PostgreSQL

| Variable | Default | Description |
|---|---|---|
| `POSTGRESQL_HOST` | `localhost` | Database host |
| `POSTGRESQL_PORT` | `5432` | Database port |
| `POSTGRESQL_USER` | `postgres` | Username |
| `POSTGRESQL_PASSWORD` | `postgres` | Password |
| `POSTGRESQL_DB` | `sampledb` | Database name |

## MySQL

| Variable | Default | Description |
|---|---|---|
| `MYSQL_HOST` | `localhost` | Database host |
| `MYSQL_PORT` | `3306` | Database port |
| `MYSQL_USER` | `mysql` | Username |
| `MYSQL_PASSWORD` | `mysql` | Password |
| `MYSQL_DB` | `sampledb` | Database name |

## MongoDB

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017/sampledb` | Full connection URI |

## Redis

| Variable | Default | Description |
|---|---|---|
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | _(empty)_ | Password — leave blank for no auth |

## Filecoin

| Variable | Default | Description |
|---|---|---|
| `FILECOIN_RPC_URL` | `https://api.node.glif.io/rpc/v1` | Lotus JSON-RPC endpoint |
| `FILECOIN_AUTH_TOKEN` | _(empty)_ | Bearer token — optional for read-only calls |

The default Glif public node supports unauthenticated read-only methods (chain head, network name). Set a token for private nodes or write operations.

## etcd

| Variable | Default | Description |
|---|---|---|
| `ETCD_HOSTS` | `localhost:2379,localhost:2381,localhost:2383` | Comma-separated list of all RAFT peer client endpoints |
| `ETCD_DIAL_TIMEOUT_MS` | `5000` | gRPC dial timeout in milliseconds |

Providing all three peer addresses enables the `etcd3` client to automatically load-balance and fail over across RAFT members.

## How config is loaded

`src/config/index.ts` calls `dotenv.config()` at import time and exports a typed `config` object. All modules import from there — no module reads `process.env` directly.

```typescript
import { config } from "../../config";

const pool = new Pool(config.postgresql);  // typed, defaulted
```
