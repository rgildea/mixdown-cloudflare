import { useFetcher } from '@remix-run/react';

interface FileListProps {
  files: R2Object[];
  setURL: (url: string) => void;
}

function FileList({ files, setURL }: FileListProps) {
  const fetcher = useFetcher({ key: "delete" });

  return (
    <div>
      {files.map((file, index) => (
        <div
          onClick={() => setURL(`/storage/${file.key}`)}
          key={file.key}
          style={{ display: "flex", justifyContent: "space-around" }}
          role="button"
          onKeyDown={() => setURL(`/storage/${file.key}`)}
          tabIndex={index}
        >
          {file.key} - {file.size}
          <fetcher.Form method="DELETE" action={`/storage/${file.key}`}>
            <button type="submit" className="btn">Delete</button>
          </fetcher.Form>
        </div>
      ))}
    </div >
  );
}

export default FileList;