import {
  ActionFunction,
  json,
  type LoaderFunction,
  type MetaFunction,
  type ActionFunctionArgs,
  unstable_parseMultipartFormData,
} from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { createR2UploadHandler } from "app/utils/R2UploadHandler";
import { useState } from "react";
import UploadForm from "app/components/UploadForm";
import FileList from "app/components/FileList";
import 'react-h5-audio-player/lib/styles.css';
import "app/styles/global.css";
import MixdownPlayer from "~/components/MixdownPlayer";

const acceptedContentTypes = [
  "audio/x-aiff",
  "audio/aiff",
  "audio/LPCM",
  "audio/mpeg",
  "audio/wav",
];

export const loader: LoaderFunction = async ({ context }) => {
  const bucket = context.cloudflare.env.STORAGE_BUCKET;
  const listOptions: R2ListOptions = {
    include: ["customMetadata"]
  };

  const objects: R2Objects = await bucket.list(listOptions);
  objects.objects.forEach((object: R2Object) => {
    console.log(`${object.key} 
      ${object.size} 
      ${object.customMetadata.filename}`)
  });

  // files.objects.forEach(async (file) => {
  //   await bucket.delete(file.key);
  // });

  if (!objects) {
    return json({ status: 500, body: { error: "Failed to list files" } });
  }

  return json({ files: objects.objects });
};

export const action: ActionFunction = async ({ context, request }: ActionFunctionArgs) => {
  const storage = context.cloudflare.env.STORAGE_BUCKET;
  const formData = await unstable_parseMultipartFormData(request, createR2UploadHandler({
    bucket: storage,
    filter: ({ contentType }) => acceptedContentTypes.includes(contentType)
  }));
  return json({ status: 200, key: formData.get("file") });
}


export const meta: MetaFunction = () => {
  return [
    { title: "Mixdown Music Player Demo" },
    {
      name: "description",
      content: "Welcome to Mixdown Music Player Demo!",
    },
  ];
};

export default function Index() {
  const loader = useLoaderData<typeof loader>();
  const [currentFileURL, setCurrentFileURL] = useState<string>();

  return (
    <div className="container">
      <h1>Welcome to Mixdown!</h1>
      <h2 >Files</h2>
      <FileList files={loader.files} setURL={setCurrentFileURL} />
      <UploadForm />
      <MixdownPlayer url={currentFileURL} />
    </div>
  );
}