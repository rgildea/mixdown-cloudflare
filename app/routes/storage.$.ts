import { servePublicPathFromStorage } from "app/utils/StorageUtils";

export async function loader({ params, context }) {
  const env = context.cloudflare.env;
  const filePath = params["*"];

  let path = (env.PATH_PREFIX || "") + filePath;
  if (path.startsWith("/")) {
    path = path.slice(1);
  }
  console.log("Path", path);
  return servePublicPathFromStorage(env, path);
}
