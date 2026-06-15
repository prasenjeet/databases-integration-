# Filecoin Integration

## Approach

Filecoin doesn't have an official Node.js SDK, so this integration talks directly to a **Lotus node** via its [JSON-RPC 2.0 API](https://lotus.filecoin.io/reference/lotus/). HTTP requests are made with `axios`.

The demo uses the **public Glif node** (`https://api.node.glif.io/rpc/v1`) — no local Lotus installation or auth token needed for read-only calls.

## Source files

| File | Purpose |
|---|---|
| `src/databases/filecoin/client.ts` | Axios-based Lotus JSON-RPC wrapper |
| `src/databases/filecoin/examples.ts` | Chain, actor, mempool, and gas demos |

## RPC client

`lotusCall<T>(method, params)` is a thin typed wrapper around the JSON-RPC protocol:

```typescript
export async function lotusCall<T>(method: string, params: unknown[] = []): Promise<T> {
  const body = { jsonrpc: "2.0", method, params, id: _reqId++ };
  const { data } = await client.post<LotusRpcResponse<T>>("", body);
  if (data.error) throw new Error(`Lotus RPC ${data.error.code}: ${data.error.message}`);
  return data.result;
}
```

Pass `FILECOIN_AUTH_TOKEN` to enable authenticated methods.

## API calls demonstrated

### 1. Chain head

```typescript
const head = await lotusCall<ChainHead>("Filecoin.ChainHead");
console.log(head.Height);   // current block height
console.log(head.Cids);     // tipset CIDs
```

### 2. Network name

```typescript
const network = await lotusCall<string>("Filecoin.StateNetworkName");
// → "mainnet" or "calibrationnet"
```

### 3. Actor state (balance)

```typescript
const actor = await lotusCall<ActorState>("Filecoin.StateGetActor", ["f099", null]);
// actor.Balance is in attoFIL (1 FIL = 1e18 attoFIL)
```

The demo converts attoFIL to human-readable FIL using `BigInt` arithmetic.

### 4. Mempool

```typescript
const pending = await lotusCall<MpoolPendingMsg[]>("Filecoin.MpoolPending", [null]);
// Returns pending unconfirmed messages
```

### 5. Gas estimation

```typescript
const gas = await lotusCall("Filecoin.GasEstimateMessageGas", [message, { MaxFee: "0" }, null]);
// Returns GasLimit, GasFeeCap, GasPremium
```

## Authentication

| Call type | Token required? |
|---|---|
| `Filecoin.ChainHead` | No |
| `Filecoin.StateNetworkName` | No |
| `Filecoin.StateGetActor` | No (public node) |
| `Filecoin.MpoolPending` | Sometimes (node-dependent) |
| `Filecoin.MpoolPush` (send tx) | Yes |

## Running

```bash
npm run demo:filecoin
```

No Docker service is needed — the demo connects to the Glif public node over HTTPS.

## Configuration

See [Configuration](Configuration.md#filecoin) for environment variables.

## Using a private node

Set these variables in `.env`:

```
FILECOIN_RPC_URL=http://your-lotus-node:1234/rpc/v1
FILECOIN_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens can be generated with `lotus auth create-token --perm admin` on your node.
