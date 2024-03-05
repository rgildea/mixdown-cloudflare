
export type R2Input = Parameters<R2Bucket["put"]>[1];
import type { R2PutOptions } from "@cloudflare/workers-types";
export type BucketConfig = {
  bucketName: string;
  binding: R2Bucket;
}

const publicPath = "/public";


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




export async function servePublicPathFromStorage(bucket: R2Bucket, path: string) {
  const notFoundResponse = new Response("Not found", { status: 404 });


  const key = path
    .replace(publicPath, "")
    .replace(/^\//, "");

  const object = await bucket.get(key);

  if (!object) {
    return notFoundResponse;
  }

  return new Response(object.body, {
    headers: {
      // TODO: Infer content type from file extension
      // 'Content-Type': file.type,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}