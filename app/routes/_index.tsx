import {
  ActionFunction,
  json,
  type LoaderFunction,
  type MetaFunction,
  type ActionFunctionArgs,
  unstable_parseMultipartFormData,
} from "@remix-run/cloudflare";
import {
  NavLink,
  useActionData,
  useFetcher,
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
  if (!files) {
    return json({ status: 500, body: { error: "Failed to list files" } });
  }

  return json({ objects: files.objects });

  // return json({ status: 200, body: { files: files.objects.map(file => [file.key, file.size]) } });
};

export const action: ActionFunction = async ({ context, request }: ActionFunctionArgs) => {
  const storage = context.cloudflare.env.TEST_BUCKET1;
  const formData = await unstable_parseMultipartFormData(request, createR2UploadHandler({
    context,
    filter: ({ contentType }) => acceptedContentTypes.includes(contentType)
  }));

  let object: R2Object | undefined;

  try {
    object = await storage.put("test.txt", formData.get("file"));
  } catch (e) {
    console.error(e);
    return json({ status: 500, body: { error: "Failed to upload file" } });
  }


  return json({ status: 200, body: object.key });
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
  const loader = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher();

  const objects: R2Object[] = loader.objects;

  return (

    <div className="container" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <h1>Welcome to Mixdown!</h1>
      <div style={{ flex: 1, display: "flex", flexDirection: "row" }}></div>
      {objects.map(file => (
        <div key={file.key} style={{ display: "flex", justifyContent: "space-around" }}>
          <NavLink
            to={`/storage/${file.key}`}
            reloadDocument
            className="link"
          >
            {file.key} - {file.size}
          </NavLink>
          &nbsp;
          <fetcher.Form
            method="DELETE"
            action={`/storage/${file.key}`}
          >
            <button
              name="intent"
              value="delete"
              type="submit"
              className="btn">Delete</button>
          </fetcher.Form>
        </div>
      ))}



      <pre>
        <code>{JSON.stringify(actionData, null, 2)}</code>
      </pre>

      <div>
        <div className="container">
          <h1 className="text-center">Drag and Drop Test</h1>
          <fetcher.Form method="post" encType="multipart/form-data">
            <UploadForm />
          </fetcher.Form>
        </div>
      </div>
    </div >
  );
}
