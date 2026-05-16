import { Etcd3, IOptions } from "etcd3";
import { config } from "../../config";

let _client: Etcd3 | null = null;

export function getEtcd(): Etcd3 {
  if (!_client) {
    const opts: IOptions = {
      hosts: config.etcd.hosts,
      dialTimeout: config.etcd.dialTimeout,
    };
    _client = new Etcd3(opts);
  }
  return _client;
}

export async function closeEtcd(): Promise<void> {
  if (_client) {
    _client.close();
    _client = null;
  }
}
