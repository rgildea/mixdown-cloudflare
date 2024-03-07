import { useFetcher } from "@remix-run/react";

export function useFileUpload() {
  const fetcher = useFetcher();
  const submit = fetcher.submit;
  const data = fetcher.data as { files?: [File] };
  const state = fetcher.state;
  const formData = fetcher.formData;
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

  const allFiles = (data?.files ? data.files.map(file => {
    return { name: file.name, url: "" }
  }) : [])
    .concat(uploadingFiles ?? []);

  return {
    fetcher,
    submit(files: FileList | null) {
      if (!files || !files.length) return;
      const formData = new FormData();
      for (const file of files) formData.append("file", file);
      submit(formData, { method: "POST", encType: "multipart/form-data" });
    },
    isUploading,
    allFiles,
  };
}
