import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve("dist"),
  port = Number(process.env.LITTLE_ISLAND_PORT || 43821);
const mime = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".ttf": "font/ttf",
  ".ico": "image/x-icon",
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    let path = resolve(root, "." + decodeURIComponent(url.pathname));
    if (path !== root && !path.startsWith(root + sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    try {
      if ((await stat(path)).isDirectory()) path = resolve(path, "index.html");
    } catch {
      if (!extname(path)) path = resolve(root, "index.html");
    }
    res.setHeader("Content-Type", mime[extname(path)] || "application/octet-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.end(await readFile(path));
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
server.listen(port, "127.0.0.1", () => console.log(`Little Island: http://127.0.0.1:${port}`));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
