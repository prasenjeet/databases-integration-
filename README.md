# Databases Integration Sample

A TypeScript/Node.js project demonstrating integration with five different databases:

| Database | Driver | Use-case shown |
|---|---|---|
| **PostgreSQL** | `pg` | Users table — CRUD with parameterised queries |
| **MySQL** | `mysql2/promise` | Products table — CRUD with connection pooling |
| **MongoDB** | `mongoose` | Blog posts — schema, CRUD, aggregation pipeline |
| **Redis** | `ioredis` | String, Hash, List, Set, Sorted-Set, Pub/Sub |
| **Filecoin** | Lotus JSON-RPC (HTTP) | Chain head, actor state, mempool, gas estimate |

---

## Project structure

```
src/
├── config/index.ts              # Centralised env-var config
├── databases/
│   ├── postgresql/
│   │   ├── client.ts            # pg Pool factory
│   │   └── examples.ts          # CRUD demo
│   ├── mysql/
│   │   ├── client.ts            # mysql2 Pool factory
│   │   └── examples.ts          # CRUD demo
│   ├── mongodb/
│   │   ├── client.ts            # Mongoose connect/disconnect
│   │   └── examples.ts          # Schema + aggregation demo
│   ├── redis/
│   │   ├── client.ts            # ioredis singleton
│   │   └── examples.ts          # Data-structure + Pub/Sub demo
│   └── filecoin/
│       ├── client.ts            # Lotus JSON-RPC wrapper
│       └── examples.ts          # Chain/mempool/gas demo
└── index.ts                     # Runs all five demos in sequence
```

---

## Quick start

### 1 — Clone and install

```bash
git clone <repo-url>
cd databases-integration-
cp .env.example .env
npm install
```

### 2 — Start local databases with Docker

```bash
npm run docker:up
```

Spins up PostgreSQL 16, MySQL 8, MongoDB 7, and Redis 7 on their default ports.

### 3 — Run all demos

```bash
npm run dev          # ts-node src/index.ts (all five)
```

Or run each database individually:

```bash
npm run demo:postgresql
npm run demo:mysql
npm run demo:mongodb
npm run demo:redis
npm run demo:filecoin
```

### 4 — Build for production

```bash
npm run build        # tsc → dist/
npm start            # node dist/index.js
```

---

## Environment variables

Copy `.env.example` to `.env` and adjust values for your environment.

| Variable | Default | Notes |
|---|---|---|
| `POSTGRESQL_HOST` | `localhost` | |
| `POSTGRESQL_PORT` | `5432` | |
| `POSTGRESQL_USER` | `postgres` | |
| `POSTGRESQL_PASSWORD` | `postgres` | |
| `POSTGRESQL_DB` | `sampledb` | |
| `MYSQL_HOST` | `localhost` | |
| `MYSQL_PORT` | `3306` | |
| `MYSQL_USER` | `mysql` | |
| `MYSQL_PASSWORD` | `mysql` | |
| `MYSQL_DB` | `sampledb` | |
| `MONGODB_URI` | `mongodb://localhost:27017/sampledb` | |
| `REDIS_HOST` | `localhost` | |
| `REDIS_PORT` | `6379` | |
| `REDIS_PASSWORD` | _(empty)_ | Leave blank for no auth |
| `FILECOIN_RPC_URL` | `https://api.node.glif.io/rpc/v1` | Public Glif node |
| `FILECOIN_AUTH_TOKEN` | _(empty)_ | Required for write/private endpoints |

---

## Filecoin notes

The Filecoin demo connects to the **Glif public Lotus node** — no local node or token
required for read-only calls (chain head, network name). Set `FILECOIN_AUTH_TOKEN`
if you have a dedicated node or need to send transactions.

---

## Stopping Docker services

```bash
npm run docker:down
```
