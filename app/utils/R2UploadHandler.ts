import type { UploadHandler, UploadHandlerPart } from "@remix-run/cloudflare";


export type R2Input = Parameters<R2Bucket["put"]>[1];

export type R2UploadHandlerFilterArgs = {
  filename: string;
  contentType: string;
  name: string;
};

export type CreateUploadHandlerParams = {
  bucket: R2Bucket;
  filter?: (args: R2UploadHandlerFilterArgs) => boolean | Promise<boolean>;
  maxPartSize?: number;
};

export async function uploadStreamtoR2(r2Bucket: R2Bucket, data: AsyncIterable<Uint8Array>, filename: string, contentType: string) {

  const dataArray = [];
  for await (const chunk of data) {
    dataArray.push(chunk);
  }


  const accumulatedData = new Uint8Array(dataArray.reduce((acc, chunk) => acc + chunk.length, 0));
  let offset = 0;
  for (const chunk of dataArray) {
    accumulatedData.set(chunk, offset);
    offset += chunk.length;
  }


  const r2Object = await r2Bucket.put(filename, accumulatedData.buffer, { httpMetadata: { contentType } });

  if (r2Object == null || r2Object.key === undefined) {
    throw new Error(`Failed to upload file ${filename}`);
  }

  console.log("Size is", r2Object.size);
  return r2Object.key;
}


export function createR2UploadHandler({ bucket, filter }: CreateUploadHandlerParams): UploadHandler {
  return async ({ name, filename, contentType, data }: UploadHandlerPart) => {
    if (!filename) {
      return undefined;
    }

    if (filter && !(await filter({ filename, contentType, name }))) {
      return undefined;
    }
    const uploadedFileLocation = await uploadStreamtoR2(bucket, data, filename!, contentType);
    return uploadedFileLocation;
  }
}