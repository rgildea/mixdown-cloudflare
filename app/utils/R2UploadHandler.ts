import { AppLoadContext } from "@remix-run/cloudflare";
import type { UploadHandler, UploadHandlerPart } from "@remix-run/cloudflare";



export type R2Input = Parameters<R2Bucket["put"]>[1];

export type CreateUploadHandlerParams = {
  context: AppLoadContext;
  filter?: (file: {
    filename?: string;
    contentType: string;
    name: string;
  }) => Promise<boolean>;
  maxPartSize?: number;
};


export function createR2UploadHandler({ context, filter }: CreateUploadHandlerParams): UploadHandler {
  return async ({ name, filename, contentType, data }: UploadHandlerPart) => {

    if (filter && !(await filter({ filename, contentType, name }))) {
      return undefined;
    }

    if (!filename) {
      return undefined;
    }


    const stream = new ReadableStream({
      async pull(controller) {
        for await (const chunk of data) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });

    stream.getReader()


    const r2Object = await context.cloudflare.env.TEST_BUCKET1.put(filename, new Blob(data, { type: contentType }));
    if (r2Object == null || r2Object.key === undefined) {
      throw new Error(`Failed to upload file {$filename}`);
    }

    return r2Object.key;
  }
}