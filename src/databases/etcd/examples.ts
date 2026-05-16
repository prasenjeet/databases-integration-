import { Etcd3 } from "etcd3";
import { getEtcd, closeEtcd } from "./client";

const KEY_PREFIX = "demo/";

// ── helpers ─────────────────────────────────────────────────────────────────

function log(label: string, msg: string, data?: unknown): void {
  const suffix = data !== undefined ? " " + JSON.stringify(data) : "";
  console.log(`[${label}] ${msg}${suffix}`);
}

async function cleanupPrefix(client: Etcd3, prefix: string): Promise<void> {
  await client.delete().prefix(prefix);
}

// ── 1. Basic key-value CRUD ──────────────────────────────────────────────────

async function demoKV(client: Etcd3, label: string): Promise<void> {
  console.log(`\n  -- KV CRUD --`);

  await client.put(`${KEY_PREFIX}config/app`).value("my-service");
  await client.put(`${KEY_PREFIX}config/version`).value("1.0.0");
  await client.put(`${KEY_PREFIX}config/debug`).value("false");

  const app = await client.get(`${KEY_PREFIX}config/app`).string();
  log(label, "GET config/app →", app);

  // Prefix scan — list all config keys
  const all = await client.getAll().prefix(`${KEY_PREFIX}config/`).strings();
  log(label, "Prefix scan config/* →", all);

  await client.delete().key(`${KEY_PREFIX}config/debug`);
  const afterDel = await client.getAll().prefix(`${KEY_PREFIX}config/`).strings();
  log(label, "After delete config/debug →", Object.keys(afterDel));
}

// ── 2. Leases — TTL-based ephemeral keys ────────────────────────────────────
//    Leases are kept alive via RAFT-replicated heartbeats; when the lease
//    holder dies the keys disappear automatically after the TTL expires.

async function demoLeases(client: Etcd3, label: string): Promise<void> {
  console.log(`\n  -- Leases (TTL-based ephemeral keys) --`);

  const lease = client.lease(4); // 4-second TTL

  lease.on("lost", (err) => log(label, "Lease lost:", err?.message));

  await lease.put(`${KEY_PREFIX}presence/node-A`).value(
    JSON.stringify({ host: "node-A", pid: process.pid, ts: Date.now() })
  );
  log(label, "Registered ephemeral presence key (TTL 4 s)");

  const presence = (await client.get(`${KEY_PREFIX}presence/node-A`).json()) as { host: string } | null;
  log(label, "Presence →", presence);

  // Revoke the lease early (simulates process exit)
  await lease.revoke();
  log(label, "Lease revoked — key will be gone");

  const after = await client.get(`${KEY_PREFIX}presence/node-A`).string();
  log(label, "Presence after revoke →", after ?? "(null ✓)");
}

// ── 3. Watch — RAFT-consistent change notifications ─────────────────────────

async function demoWatch(client: Etcd3, label: string): Promise<void> {
  console.log(`\n  -- Watch (consistent change notifications) --`);

  const watchKey = `${KEY_PREFIX}flags/feature-x`;
  const events: string[] = [];

  const watcher = await client.watch().key(watchKey).create();

  watcher.on("put", (kv) => events.push(`put:${kv.value.toString()}`));
  watcher.on("delete", () => events.push("delete"));

  // Trigger events
  await client.put(watchKey).value("enabled");
  await client.put(watchKey).value("disabled");
  await client.delete().key(watchKey);

  // Give the watch stream a moment to deliver all events
  await new Promise((r) => setTimeout(r, 300));
  await watcher.cancel();

  log(label, "Watch events received:", events);
}

// ── 4. Compare-and-Swap transactions (RAFT-atomic) ──────────────────────────
//    If-Then-Else is committed as a single RAFT log entry — either all
//    operations succeed or none do, with no partial writes.

async function demoTransactions(client: Etcd3, label: string): Promise<void> {
  console.log(`\n  -- Compare-and-Swap Transactions (RAFT-atomic) --`);

  const countKey = `${KEY_PREFIX}counter`;
  await client.put(countKey).value("10");

  // CAS: only increment if value equals "10"
  const txResult = await client
    .if(countKey, "Value", "==", "10")
    .then(client.put(countKey).value("11"))
    .else(client.get(countKey))
    .commit();

  log(label, "CAS succeeded:", txResult.succeeded);
  log(label, "Counter after CAS →", await client.get(countKey).string());

  // Re-run CAS — now value is "11" so the condition fails
  const txResult2 = await client
    .if(countKey, "Value", "==", "10")
    .then(client.put(countKey).value("12"))
    .else(client.get(countKey))
    .commit();

  log(label, `CAS (stale) succeeded: ${txResult2.succeeded} (expected false)`);
  log(label, "Counter unchanged →", await client.get(countKey).string());
}

// ── 5. Distributed lock (mutex via RAFT + lease) ─────────────────────────────
//    etcd serialises lock acquisition through RAFT; only one holder at a time.

async function demoDistributedLock(client: Etcd3, label: string): Promise<void> {
  console.log(`\n  -- Distributed Lock (mutex via RAFT + lease) --`);

  const lockName = `${KEY_PREFIX}locks/critical-resource`;

  const lock = client.lock(lockName).ttl(10);
  await lock.acquire();
  log(label, "Lock acquired");

  // Simulate critical section
  await new Promise((r) => setTimeout(r, 100));
  log(label, "Critical section done");

  await lock.release();
  log(label, "Lock released");

  // Demonstrate that a second acquire succeeds after release
  const lock2 = client.lock(lockName).ttl(10);
  await lock2.acquire();
  log(label, "Second lock acquired after release ✓");
  await lock2.release();
}

// ── 6. Leader election (consensus-based, built on RAFT) ─────────────────────
//    Multiple candidates campaign; only the RAFT-elected leader wins.

async function demoElection(client: Etcd3, label: string): Promise<void> {
  console.log(`\n  -- Leader Election (RAFT consensus) --`);

  const electionName = `${KEY_PREFIX}elections/coordinator`;

  const election = client.election(electionName);

  // Campaign as "node-1"
  const candidate = election.campaign("node-1");
  log(label, "Campaigning as node-1...");
  await candidate.wait(); // blocks until this candidate is elected leader
  log(label, "node-1 is now the leader ✓");

  // Observe current leader
  const observer = await election.observe();
  const currentLeader = observer.leader();
  log(label, "Observed leader value:", currentLeader);
  observer.cancel();

  // Resign so the election is clean for re-runs
  await candidate.resign();
  log(label, "node-1 resigned from leadership");
}

// ── 7. RAFT cluster status ───────────────────────────────────────────────────
//    Queries each etcd peer for its RAFT term, commit index, and whether it
//    is the current leader — all derived from the RAFT state machine.

async function demoRaftStatus(client: Etcd3, label: string): Promise<void> {
  console.log(`\n  -- RAFT Cluster Status --`);

  try {
    const memberResp = await client.cluster.memberList({});
    log(label, `Cluster members: ${memberResp.members.length}`);
    memberResp.members.forEach((m) => {
      log(label, `  member id=${m.ID} name="${m.name}" peerURLs=${m.peerURLs?.join(",")}`);
    });
  } catch (e) {
    log(label, "memberList skipped:", (e as Error).message);
  }

  // Per-endpoint status — shows raftTerm, raftIndex, leader ID.
  // Each peer is queried via its own short-lived Etcd3 instance.
  const endpoints = ["localhost:2379", "localhost:2381", "localhost:2383"];
  for (const ep of endpoints) {
    try {
      const peer = new Etcd3({ hosts: [ep], dialTimeout: 2000 });
      const status = await peer.maintenance.status();
      peer.close();
      log(
        label,
        `  ${ep} → leader=${status.leader} raftTerm=${status.raftTerm} raftIndex=${status.raftIndex} dbSize=${status.dbSize}`
      );
    } catch {
      log(label, `  ${ep} → unreachable (start cluster with npm run docker:up)`);
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

export async function runEtcdDemo(): Promise<void> {
  const label = "etcd/RAFT";
  console.log(`\n${"=".repeat(50)}`);
  console.log(`  etcd Demo  (3-node RAFT cluster)`);
  console.log(`${"=".repeat(50)}`);

  const client = getEtcd();

  try {
    await cleanupPrefix(client, KEY_PREFIX);

    await demoKV(client, label);
    await demoLeases(client, label);
    await demoWatch(client, label);
    await demoTransactions(client, label);
    await demoDistributedLock(client, label);
    await demoElection(client, label);
    await demoRaftStatus(client, label);

    console.log(`\n[${label}] Demo complete`);
  } catch (err) {
    console.error(`[${label}] Error:`, (err as Error).message);
    console.log(`[${label}] Tip: run "npm run docker:up" to start the 3-node etcd cluster`);
  } finally {
    await cleanupPrefix(client, KEY_PREFIX);
  }
}

if (require.main === module) {
  runEtcdDemo().finally(closeEtcd);
}
