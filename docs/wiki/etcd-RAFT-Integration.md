# etcd + RAFT Integration

## What is RAFT?

**RAFT** is a consensus algorithm that allows a cluster of nodes to agree on a shared state even when some nodes fail. etcd uses RAFT to replicate every key-value write to a quorum of members before acknowledging success. Key properties:

- **Leader election** — one node is always the elected leader; all writes go through it
- **Log replication** — the leader appends writes to a log and replicates to followers
- **Quorum** — a write succeeds when `⌊N/2⌋ + 1` members confirm it (3 nodes → 2 needed)
- **Safety** — no two leaders can exist in the same RAFT term

## Driver

[`etcd3`](https://github.com/microsoft/etcd3) — Microsoft's TypeScript-first etcd v3 client, with gRPC transport, lock, election, and watch APIs.

## Source files

| File | Purpose |
|---|---|
| `src/databases/etcd/client.ts` | `Etcd3` singleton pointing at all three peers |
| `src/databases/etcd/examples.ts` | Seven RAFT-powered feature demos |

## 3-Node cluster

The docker-compose spins up `etcd1`, `etcd2`, `etcd3` with a shared cluster token. The `Etcd3` client is configured with all three endpoints so the driver handles leader failover automatically:

```typescript
const client = new Etcd3({
  hosts: ["localhost:2379", "localhost:2381", "localhost:2383"],
  dialTimeout: 5000,
});
```

## Feature demos

### 1. KV CRUD

```typescript
await client.put("config/app").value("my-service");
const val = await client.get("config/app").string();

// Prefix scan
const all = await client.getAll().prefix("config/").strings();

await client.delete().key("config/debug");
```

Every `put` is a RAFT log entry replicated to a quorum before returning.

### 2. Leases — TTL-based ephemeral keys

```typescript
const lease = client.lease(4);  // 4-second TTL
await lease.put("presence/node-A").value(JSON.stringify({ host: "node-A" }));

// etcd renews the lease via RAFT-replicated heartbeats.
// Revoking simulates process exit:
await lease.revoke();
```

When a process crashes without revoking, etcd's RAFT state machine removes the key after the TTL expires, regardless of which node is leader.

### 3. Watch — RAFT-consistent notifications

```typescript
const watcher = await client.watch().key("flags/feature-x").create();
watcher.on("put",    (kv) => console.log("put:", kv.value.toString()));
watcher.on("delete", ()   => console.log("deleted"));
```

Watch events are delivered in RAFT revision order — a client always sees a consistent, monotonic stream of changes.

### 4. Compare-and-Swap transactions

```typescript
const tx = await client
  .if("counter", "Value", "==", "10")
  .then(client.put("counter").value("11"))
  .else(client.get("counter"))
  .commit();

console.log(tx.succeeded);  // true if CAS succeeded
```

The entire if/then/else is submitted as a single RAFT log entry. Either all operations apply or none do.

### 5. Distributed lock

```typescript
const lock = client.lock("locks/critical-resource").ttl(10);
await lock.acquire();    // blocks until the lock is granted by RAFT
// ... critical section ...
await lock.release();
```

Internally, `etcd3` creates a lease-bound key under the lock prefix. RAFT ensures only one holder exists across all nodes at any time.

### 6. Leader election

```typescript
const election = client.election("elections/coordinator");
const candidate = election.campaign("node-1");
await candidate.wait();   // resolves when RAFT elects this candidate
console.log("node-1 is leader");

// Observe the current leader from another client:
const observer = await election.observe();
console.log(observer.leader());   // "node-1"
observer.cancel();

await candidate.resign();
```

### 7. RAFT cluster status

```typescript
// Query each peer individually for its RAFT state
for (const ep of ["localhost:2379", "localhost:2381", "localhost:2383"]) {
  const peer = new Etcd3({ hosts: [ep], dialTimeout: 2000 });
  const status = await peer.maintenance.status();
  console.log(`${ep} → leader=${status.leader} term=${status.raftTerm} index=${status.raftIndex}`);
  peer.close();
}
```

`raftTerm` increments on each new election; `raftIndex` is the last committed log index. The node whose `ID === leader` is the current RAFT leader.

## RAFT quorum arithmetic

| Cluster size | Quorum needed | Fault tolerance |
|---|---|---|
| 1 node | 1 | 0 failures |
| 3 nodes | 2 | 1 failure |
| 5 nodes | 3 | 2 failures |

The project uses **3 nodes** — the minimum for meaningful fault tolerance.

## Running

```bash
npm run docker:up      # start the 3-node RAFT cluster
npm run demo:etcd
```

## Configuration

See [Configuration](Configuration.md#etcd) for environment variables.
