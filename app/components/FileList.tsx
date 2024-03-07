import { NavLink, useFetcher } from '@remix-run/react';

interface FileListProps {
  files: R2Object[];
}

function FileList({ files }: FileListProps) {
  const fetcher = useFetcher({ key: "delete" });

  return (
    <div>
      {files.map(file => (
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
              type="submit"
              className="btn">Delete</button>
          </fetcher.Form>
        </div>
      ))}
    </div>
  );
}

export default FileList;