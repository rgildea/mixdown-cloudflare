
export type R2Input = Parameters<R2Bucket["put"]>[1];
import type { R2PutOptions } from "@cloudflare/workers-types";
export type BucketConfig = {
  bucketName: string;
  binding: R2Bucket;
}


export type StorageBucketConfig = { default: BucketConfig } & Record<string, BucketConfig>;

class Storage {
  constructor(public bucket: BucketConfig) { }

  async putRandom(input: R2Input, options: R2PutOptions & { extension: string | undefined; }) {
    const key = crypto.randomUUID() + (options.extension ? `.${options.extension}` : "");
    return this.put(key, input);
  }

  async put(...args: Parameters<R2Bucket["put"]>) {
    return this.bucket.binding.put(...args);
  }
}

export function storage(bucketName: string, config: StorageBucketConfig) {
  const bucket = config[bucketName] || config.default;
  return new Storage(bucket);
}