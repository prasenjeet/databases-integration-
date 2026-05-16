import { lotusCall, ChainHead, ActorState, MpoolPendingMsg } from "./client";

// Convert attoFIL (1e-18 FIL) string to human-readable FIL.
function attoToFil(atto: string): string {
  const n = BigInt(atto);
  const whole = n / BigInt(1e18);
  const frac = n % BigInt(1e18);
  return `${whole}.${frac.toString().padStart(18, "0").slice(0, 6)} FIL`;
}

export async function runFilecoinDemo(): Promise<void> {
  const label = "Filecoin";
  console.log(`\n${"=".repeat(50)}`);
  console.log(`  ${label} Demo  (Lotus JSON-RPC → Glif public node)`);
  console.log(`${"=".repeat(50)}`);

  try {
    // 1. Chain head — current block height
    const head = await lotusCall<ChainHead>("Filecoin.ChainHead");
    console.log(`[${label}] Chain head height: ${head.Height}`);
    console.log(
      `[${label}] Latest tipset CIDs:`,
      head.Cids.slice(0, 2).map((c) => c["/"])
    );

    // 2. Network name
    const network = await lotusCall<string>("Filecoin.StateNetworkName");
    console.log(`[${label}] Network: ${network}`);

    // 3. Well-known actors: Filecoin burn address
    const BURN_ADDRESS = "f099";
    try {
      const actor = await lotusCall<ActorState>("Filecoin.StateGetActor", [
        BURN_ADDRESS,
        null, // null = latest tipset
      ]);
      console.log(`[${label}] Burn address (${BURN_ADDRESS}) balance: ${attoToFil(actor.Balance)}`);
    } catch (e) {
      console.log(`[${label}] Could not fetch actor (may need auth token):`, (e as Error).message);
    }

    // 4. Mempool — peek at pending messages (up to 3)
    try {
      const pending = await lotusCall<MpoolPendingMsg[]>("Filecoin.MpoolPending", [null]);
      const sample = pending.slice(0, 3);
      console.log(`[${label}] Mempool pending: ${pending.length} msgs. Sample:`);
      sample.forEach((m) =>
        console.log(
          `  from=${m.Message.From.slice(0, 12)}… to=${m.Message.To.slice(0, 12)}… value=${attoToFil(m.Message.Value)}`
        )
      );
    } catch (e) {
      console.log(`[${label}] Mempool read skipped (may require auth):`, (e as Error).message);
    }

    // 5. Gas estimate for a trivial transfer
    try {
      const gasEstimate = await lotusCall<{ GasLimit: number; GasFeeCap: string; GasPremium: string }>(
        "Filecoin.GasEstimateMessageGas",
        [
          {
            From: "f01",      // genesis miner — just for estimation
            To: "f099",       // burn address
            Value: "1000000", // 1 µattoFIL
            GasLimit: 0,
            GasFeeCap: "0",
            GasPremium: "0",
            Method: 0,
            Params: "",
            Nonce: 0,
          },
          { MaxFee: "0" },
          null,
        ]
      );
      console.log(`[${label}] Gas estimate → limit=${gasEstimate.GasLimit} feeCap=${gasEstimate.GasFeeCap}`);
    } catch (e) {
      console.log(`[${label}] Gas estimate skipped:`, (e as Error).message);
    }

    console.log(`[${label}] Demo complete`);
  } catch (err) {
    console.error(`[${label}] Error:`, (err as Error).message);
    console.log(
      `[${label}] Tip: set FILECOIN_RPC_URL and optionally FILECOIN_AUTH_TOKEN in .env`
    );
  }
}

if (require.main === module) {
  runFilecoinDemo();
}
