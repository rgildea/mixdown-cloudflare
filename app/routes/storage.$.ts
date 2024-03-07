import { servePublicPathFromStorage, deleteObject } from "app/utils/StorageUtils";

export async function loader({ params, context }) {
  const env = context.cloudflare.env;
  const path = getFullPath(context.cloudflare.env.PATH_PREFIX, params["*"]);
  return servePublicPathFromStorage(env, path);
}

export const action = async ({ params, request, context }) => {
  const env = context.cloudflare.env;
  let path;
  if (params["*"]) {
    path = getFullPath(env.PATH_PREFIX, params["*"]);
  }
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

function getFullPath(prefix, filePath: string) {
  let path = (prefix || "") + filePath;
  if (path.startsWith("/")) {
    path = path.slice(1);
  }
  return path;
}
