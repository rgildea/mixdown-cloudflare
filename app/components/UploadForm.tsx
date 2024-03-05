// import { useDropzone } from "react-dropzone";
import { useFileUpload } from "app/hooks/useFileUpload";

function UploadForm() {
  const { submit, isUploading, allFiles } = useFileUpload();

  return (
    <main>
      <h1>Upload a file</h1>

      <label>
        {/* Here we use our boolean to change the label text */}
        {isUploading ? <p>Uploading...</p> : <p>Select a file</p>}

        <input
          name="file"
          type="file"
          // We hide the input so we can use our own label as a trigger
          // style={{ display: "none" }}
          onChange={(event) => submit(event.currentTarget.files)}
        />
      </label>

      <ul>
        {/* We map over our files and display them */}
        {allFiles.map((file) => (
          <li key={file.name}>
            <p>{file.name}</p>
          </li>
        ))}


      </ul>
    </main>
  );
}


// const {
//   getRootProps,
//   getInputProps,
//   acceptedFiles,
//   fileRejections,
//   open,
//   isDragActive
// } = useDropzone({
//   accept: {
//     "audio/x-aiff": [".aif", ".aiff"],
//     // "audio/LPCM": [".wav"],
//     "audio/mpeg": [".mp3"],
//     "audio/wav": [".wav"],
//   },
//   maxFiles: 1
// });

// const files = acceptedFiles.map((file) => (
//   <li key={file.path}>
//     {file.path} - {file.type} - {file.size} bytes
//   </li>
// ));

// const rejectedFiles = fileRejections.map(({ file, errors }) => {
//   return (
//     <li key={file.webkitRelativePath}>
//       {file.webkitRelativePath} - {file.type} - {file.size} bytes
//       <ul>
//         {errors.map(e => (
//           <li key={e.code}>{e.message}</li>
//         ))}
//       </ul>
//     </li>
//   );
// });

// return (
//   <div {...getRootProps({ className: "dropzone" })}>
//     <input name="files" className="input-zone" {...getInputProps()} />
//     <div className="text-center">
//       {isDragActive ? (
//         <p className="dropzone-content">
//           Release to drop files here ...
//         </p>
//       ) : (
//         <p className="dropzone-content">
//           Drag’n’drop some files here, or click to select files
//         </p>
//       )}

//       <aside>
//         <h4>Files</h4>
//         <ul>{files}</ul>
//       </aside>
//       <aside>
//         <h4>Rejected Files</h4>
//         <ul>{rejectedFiles}</ul>
//       </aside>
//       <button onClick={open} className="btn">
//         Open File Dialog
//       </button>
//     </div>
//   </div>
// );
// }

export default UploadForm;