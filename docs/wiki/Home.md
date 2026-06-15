# Databases Integration — Home

Welcome to the **databases-integration** project wiki.

This project is a TypeScript/Node.js sample that demonstrates how to connect to and operate six different databases from a single codebase with a clean, consistent structure.

## Databases covered

| Database | Type | Key features shown |
|---|---|---|
| [PostgreSQL](PostgreSQL-Integration.md) | Relational (SQL) | CRUD, parameterised queries, connection pool |
| [MySQL](MySQL-Integration.md) | Relational (SQL) | CRUD, promise-based pool, `mysql2` |
| [MongoDB](MongoDB-Integration.md) | Document (NoSQL) | Schema, CRUD, aggregation pipeline |
| [Redis](Redis-Integration.md) | In-memory key-value | String, Hash, List, Set, Sorted-Set, Pub/Sub |
| [Filecoin](Filecoin-Integration.md) | Decentralised storage | Lotus JSON-RPC, chain head, gas estimation |
| [etcd + RAFT](etcd-RAFT-Integration.md) | Distributed key-value | KV, Leases, Watch, CAS, Lock, Leader election, RAFT status |

## Quick navigation

- [Getting Started](Getting-Started.md) — install, configure, and run
- [Docker Setup](Docker-Setup.md) — spin up all databases with one command
- [Configuration](Configuration.md) — environment variables reference
- [PostgreSQL Integration](PostgreSQL-Integration.md)
- [MySQL Integration](MySQL-Integration.md)
- [MongoDB Integration](MongoDB-Integration.md)
- [Redis Integration](Redis-Integration.md)
- [Filecoin Integration](Filecoin-Integration.md)
- [etcd + RAFT Integration](etcd-RAFT-Integration.md)

## Project structure

```
src/
├── config/index.ts              # Centralised env-var config
├── index.ts                     # Runs all demos in sequence
└── databases/
    ├── postgresql/{client,examples}.ts
    ├── mysql/{client,examples}.ts
    ├── mongodb/{client,examples}.ts
    ├── redis/{client,examples}.ts
    ├── filecoin/{client,examples}.ts
    └── etcd/{client,examples}.ts
docker-compose.yml               # All database services
.env.example                     # Environment variable template
```

## Running the demos

```bash
# All six demos in sequence
npm run dev

# Individual demos
npm run demo:postgresql
npm run demo:mysql
npm run demo:mongodb
npm run demo:redis
npm run demo:filecoin
npm run demo:etcd
```
