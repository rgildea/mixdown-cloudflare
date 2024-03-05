import {
  ActionFunction,
  json,
  type LoaderFunction,
  type MetaFunction,
  type ActionFunctionArgs,
  unstable_parseMultipartFormData,
} from "@remix-run/cloudflare";
import {
  Form,
  useActionData,
  useLoaderData,
}
  from "@remix-run/react";
import { createR2UploadHandler } from "app/utils/R2UploadHandler";

import UploadForm from "app/components/UploadForm";
import "app/styles/global.css";

const acceptedContentTypes = [
  "audio/x-aiff",
  "audio/aiff",
  "audio/LPCM",
  "audio/mpeg",
  "audio/wav",
];




export const loader: LoaderFunction = async ({ context }) => {
  const files: R2Objects = await context.cloudflare.env.TEST_BUCKET1.list();
  const file = files.objects[0];
  const realFile = context.cloudflare.env.TEST_BUCKET1.get(file.key);
  return json({ status: 200, body: { realFile }, headers: { "content-type": "application/json" } });
};

export const action: ActionFunction = async ({ context, request }: ActionFunctionArgs) => {
  const formData = await unstable_parseMultipartFormData(request, createR2UploadHandler({
    context,
    filter: ({ contentType }) => acceptedContentTypes.includes(contentType)
  }));

  console.log("Made it!");
  console.log(formData);

  const r2Bucket = context.cloudflare.env.TEST_BUCKET1.put("test.txt", formData.get("file"));
  console.log(r2Bucket)
  return json({ status: 200, body: { formData } });
}


export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    {
      name: "description",
      content: "Welcome to Remix! Using Vite and Cloudflare!",
    },
  ];
};

export default function Index() {
  const data = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Welcome to Remix!</h1>
      <pre>
        <code>{JSON.stringify(data, null, 2)}</code>
      </pre>
      <pre>
        <code>{JSON.stringify(actionData, null, 2)}</code>
      </pre>

      <div>
        <div className="container">
          <h1 className="text-center">Drag and Drop Test</h1>
          <Form method="post" encType="multipart/form-data">
            <UploadForm />
            <input type="hidden" name="thing" value="stuff" />
            <button name="intent" value="upload" type="submit" className="btn">Submit</button>
          </Form>
        </div>
      </div>

    </div >
  );
}
