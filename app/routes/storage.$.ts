import { servePublicPathFromStorage, deleteObject } from "app/utils/StorageUtils";

export async function loader({ params, context }) {
  const env = context.cloudflare.env;
  const path = getSanitizedPath(env, params["*"]);
  console.log("Path", path);

  return servePublicPathFromStorage(env, path);
}


export const action = async ({ params, request, context }) => {
  const env = context.cloudflare.env;
  const path = getSanitizedPath(env, params["*"]);
  console.log("Path", path);

  switch (request.method) {
    case "POST": {
      /* handle "POST" */
      return new Response("Not implemented", { status: 501 });
    }
    case "PUT": {
      /* handle "PUT" */
      return new Response("Not implemented", { status: 501 });
    }
    case "PATCH": {
      /* handle "PATCH" */
      return new Response("Not implemented", { status: 501 });
    }
    case "DELETE": {
      /* handle "DELETE" */
      return deleteObject(env, path);
    }
  }
};

function getSanitizedPath(env, filePath: string) {
  let path = (env.PATH_PREFIX || "") + filePath;
  if (path.startsWith("/")) {
    path = path.slice(1);
  }
  return path;
}
