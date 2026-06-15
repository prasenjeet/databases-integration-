# Getting Started

## Prerequisites

| Tool | Minimum version | Purpose |
|---|---|---|
| Node.js | 18 LTS | Runtime |
| npm | 9 | Package manager |
| Docker + Compose | 24 / 2.x | Local database services |
| TypeScript | 5 (dev dep) | Type checking and compilation |

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/prasenjeet/databases-integration-.git
cd databases-integration-

# 2. Copy environment variables template
cp .env.example .env

# 3. Install dependencies
npm install
```

## Start local databases

All databases except Filecoin (which uses a public node) run locally via Docker Compose:

```bash
npm run docker:up
```

This starts:
- **PostgreSQL 16** on port `5432`
- **MySQL 8** on port `3306`
- **MongoDB 7** on port `27017`
- **Redis 7** on port `6379`
- **etcd 3.5** (3-node RAFT cluster) on ports `2379`, `2381`, `2383`

Wait ~10 seconds for all health checks to pass, then run the demos.

## Run all demos

```bash
npm run dev
```

Expected output — each database section prints its operations and results:

```
Multi-Database Integration Demo
================================

==================================================
  PostgreSQL Demo
==================================================
[PostgreSQL] Table ready
[PostgreSQL] Inserted: Alice Bob
...

==================================================
  etcd/RAFT Demo  (3-node RAFT cluster)
==================================================
[etcd/RAFT] GET config/app → "my-service"
...
```

## Run a single demo

```bash
npm run demo:postgresql
npm run demo:mysql
npm run demo:mongodb
npm run demo:redis
npm run demo:filecoin
npm run demo:etcd
```

## Build for production

```bash
npm run build     # tsc → dist/
npm start         # node dist/index.js
```

## Stop Docker services

```bash
npm run docker:down
```

## Next steps

- See [Configuration](Configuration.md) for all environment variables.
- See [Docker Setup](Docker-Setup.md) for advanced Docker options.
- Browse the individual database pages for API details and code walk-throughs.
