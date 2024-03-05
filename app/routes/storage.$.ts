// app/routes/storage.$.ts

import { servePublicPathFromStorage } from "app/utils/StorageUtils";

export async function loader({ request, context }) {
  const { pathname } = new URL(request.url);
  return servePublicPathFromStorage(context.env.TEST_BUCKET1, [pathname, request.params.id].join('/'));
}

