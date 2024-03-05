import {
  ActionFunction,
  json,
  unstable_parseMultipartFormData,
  type LoaderFunction,
  type MetaFunction,
} from "@remix-run/cloudflare";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import UploadForm from "app/components/UploadForm";
import "app/styles/global.css";

import { createR2UploadHandler } from "app/utils/R2UploadHandler";

const acceptedContentTypes = [
  "audio/x-aiff",
  "audio/LPCM",
  "audio/mpeg",
  "audio/wav",
];



export const loader: LoaderFunction = async ({ context }) => {
  const files = await context.cloudflare.env.TEST_BUCKET1.list();
  return json({ status: 200, body: { files } });
};

export const action: ActionFunction = async ({ request, context }) => {
  const uploadHandler = createR2UploadHandler({
    context,
    filter: async (file) => {
      return new Promise((resolve) => {
        console.log("checking file", file.contentType, file.name, file.filename)
        if (acceptedContentTypes.includes(file.contentType)) {
          resolve(true);
        } else {
          console.log("rejected file", file)
          resolve(false);
        }
      });
    }
  });

  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );

  console.log(formData);

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
