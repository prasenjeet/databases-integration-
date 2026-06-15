# Docker Setup

All local databases are orchestrated with Docker Compose (`docker-compose.yml` in the project root).

## Services

| Service | Image | Host port | Container port | Volume |
|---|---|---|---|---|
| `db_postgresql` | `postgres:16-alpine` | 5432 | 5432 | `pg_data` |
| `db_mysql` | `mysql:8.4` | 3306 | 3306 | `mysql_data` |
| `db_mongodb` | `mongo:7` | 27017 | 27017 | `mongo_data` |
| `db_redis` | `redis:7-alpine` | 6379 | 6379 | `redis_data` |
| `db_etcd1` | `bitnami/etcd:3.5` | 2379 | 2379 | `etcd1_data` |
| `db_etcd2` | `bitnami/etcd:3.5` | 2381 | 2379 | `etcd2_data` |
| `db_etcd3` | `bitnami/etcd:3.5` | 2383 | 2379 | `etcd3_data` |

## etcd RAFT cluster topology

The three etcd nodes form a single RAFT cluster:

```
┌──────────────┐    RAFT peer    ┌──────────────┐
│    etcd1     │◄───────────────►│    etcd2     │
│  client:2379 │                 │  client:2381 │
└──────┬───────┘                 └──────┬───────┘
       │              RAFT              │
       └──────────────┬────────────────┘
                      ▼
               ┌──────────────┐
               │    etcd3     │
               │  client:2383 │
               └──────────────┘
```

All three share the cluster token `etcd-raft-demo` and the initial cluster list so they can discover each other automatically on first boot.

## Commands

```bash
# Start all services in the background
npm run docker:up

# Stop all services (keeps volumes)
npm run docker:down

# Stop and delete all volumes (full reset)
docker-compose down -v

# View running services
docker-compose ps

# Tail logs for a specific service
docker-compose logs -f db_etcd1

# Connect to PostgreSQL interactively
docker exec -it db_postgresql psql -U postgres sampledb

# Connect to MySQL interactively
docker exec -it db_mysql mysql -u mysql -pmysql sampledb

# Connect to MongoDB shell
docker exec -it db_mongodb mongosh sampledb

# Connect to Redis CLI
docker exec -it db_redis redis-cli

# Query etcd from node 1
docker exec -it db_etcd1 etcdctl get "" --prefix
```

## Health checks

PostgreSQL, MySQL, MongoDB, and etcd1 have health checks configured. Wait until they report **healthy** before running demos:

```bash
docker-compose ps   # check STATUS column
```

## Volumes

Named Docker volumes persist data between `docker:up` / `docker:down` cycles. To start completely fresh:

```bash
docker-compose down -v
npm run docker:up
```
