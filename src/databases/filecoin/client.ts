import axios, { AxiosInstance } from "axios";
import { config } from "../../config";

export interface LotusRpcResponse<T> {
  jsonrpc: string;
  id: number;
  result: T;
  error?: { code: number; message: string };
}

export interface ChainHead {
  Height: number;
  Cids: Array<{ "/": string }>;
}

export interface ActorState {
  Balance: string;
  Code: { "/": string };
  Head: { "/": string };
}

export interface MpoolPendingMsg {
  Message: {
    From: string;
    To: string;
    Value: string;
    GasLimit: number;
    GasFeeCap: string;
    GasPremium: string;
    Method: number;
    Nonce: number;
  };
  Signature: { Type: number; Data: string };
  CID: { "/": string };
}

let _client: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  if (!_client) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (config.filecoin.authToken) {
      headers["Authorization"] = `Bearer ${config.filecoin.authToken}`;
    }
    _client = axios.create({ baseURL: config.filecoin.rpcUrl, headers });
  }
  return _client;
}

let _reqId = 1;

export async function lotusCall<T>(method: string, params: unknown[] = []): Promise<T> {
  const client = getClient();
  const body = {
    jsonrpc: "2.0",
    method,
    params,
    id: _reqId++,
  };
  const { data } = await client.post<LotusRpcResponse<T>>("", body);
  if (data.error) {
    throw new Error(`Lotus RPC error ${data.error.code}: ${data.error.message}`);
  }
  return data.result;
}
