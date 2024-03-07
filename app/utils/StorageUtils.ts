export type R2Input = Parameters<R2Bucket["put"]>[1];
// import type { R2PutOptions } from "@cloudflare/workers-types";
export type BucketConfig = {
  bucketName: string;
  binding: R2Bucket;
}

const publicPath = "/storage";

// export type StorageBucketConfig = { default: BucketConfig } & Record<string, BucketConfig>;

// class Storage {
//   constructor(public bucket: BucketConfig) { }

//   async putRandom(input: R2Input, options: R2PutOptions & { extension: string | undefined; }) {
//     const key = crypto.randomUUID() + (options.extension ? `.${options.extension}` : "");
//     return this.put(key, input);
//   }

//   async put(...args: Parameters<R2Bucket["put"]>) {
//     return this.bucket.binding.put(...args);
//   }
// }

// export function storage(bucketName: string, config: StorageBucketConfig) {
//   const bucket = config[bucketName] || config.default;
//   return new Storage(bucket);
// }

export async function deleteObject(env, path: string) {
  console.log(env)
  const bucket = env.TEST_BUCKET1;
  const key = path
    .replace(publicPath, "")
    .replace(/^\//, "");

  console.log("DELETING", key);
  await bucket.delete(key);
  return new Response("Deleted {key}");
}

function hasBody(file: R2ObjectBody | null): file is R2ObjectBody {
  return file.body !== undefined;
}

export async function servePublicPathFromStorage(env, path: string) {
  const bucket = env.TEST_BUCKET1;
  const notFoundResponse = new Response("Not found", { status: 404 });
  const key = path
    .replace(publicPath, "")
    .replace(/^\//, "");

  const file = await bucket.get(key);

  if (!file) {
    console.log("Not found", key);
    return notFoundResponse;
  }

  console.log("Serving", key, file.size, "bytes")

  const response = new Response(hasBody(file) && file.size !== 0 ? file.body : null, {
    status: 200,
    headers: {
      "accept-ranges": "bytes",
      "access-control-allow-origin": env.ALLOWED_ORIGINS || "",
      etag: file.httpEtag,
      "cache-control": env.CACHE_CONTROL ?? file.httpMetadata?.cacheControl,
      expires: file.httpMetadata?.cacheExpiry?.toUTCString() ?? "",
      "last-modified": file.uploaded.toUTCString(),
      "content-encoding": file.httpMetadata?.contentEncoding ?? "",
      "content-type": file.httpMetadata?.contentType ?? "application/octet-stream",
      "content-language": file.httpMetadata?.contentLanguage ?? "",
      "content-disposition": file.httpMetadata?.contentDisposition ?? "",
      "content-length": (file.size).toString(),
    },
  });

  return response;
}