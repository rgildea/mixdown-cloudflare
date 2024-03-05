import { useFetcher } from "@remix-run/react";
import { action } from "~/routes/_index";

export function useFileUpload() {
  const useFetcherResult = useFetcher<typeof action>();
  const submit = useFetcherResult.submit;
  const data = useFetcherResult.data as { files?: [File] };
  const state = useFetcherResult.state;
  const formData = useFetcherResult.formData;
  const isUploading = state !== "idle";

  const uploadingFiles = formData
    ?.getAll("file")
    ?.filter((value: unknown): value is File => value instanceof File)
    .map((file) => {
      const name = file.name;
      // This line is important; it will create an Object URL, which is a `blob:` URL string
      // We'll need this to render the image in the browser as it's being uploaded
      const url = URL.createObjectURL(file);
      return { name, url };
    });

  const allFiles = data?.files || [];
  uploadingFiles;

  return {
    submit(files: FileList | null) {
      if (!files) return;
      const formData = new FormData();
      for (const file of files) formData.append("file", file);
      submit(formData, { method: "POST", encType: "multipart/form-data" });
    },
    isUploading,
    allFiles,
  };
}
