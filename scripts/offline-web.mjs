import { readFile, writeFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
async function files(dir) {
  let list = [];
  for (const f of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) list.push(...(await files(p)));
    else if (!["sw.js", "manifest.webmanifest"].includes(f.name)) list.push("/" + p.replace(/^dist\//, ""));
  }
  return list;
}
const assets = await files("dist"),
  htmlPath = "dist/index.html";
const version = createHash("sha256")
  .update(await readFile(htmlPath))
  .update(assets.join(","))
  .digest("hex")
  .slice(0, 12);
await writeFile(
  "dist/manifest.webmanifest",
  JSON.stringify({
    name: "Little Island",
    short_name: "Little Island",
    start_url: "/",
    display: "standalone",
    background_color: "#FCFAF4",
    theme_color: "#246858",
    icons: [{ src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" }],
  })
);
let html = await readFile(htmlPath, "utf8");
html = html.replace(
  "</head>",
  '<meta name="theme-color" content="#FCFAF4"><link rel="manifest" href="/manifest.webmanifest"><style>body{background:#FCFAF4}button:focus-visible,[role="button"]:focus-visible{outline:3px solid #386C9A;outline-offset:2px}button,[role="button"]{touch-action:manipulation;-webkit-tap-highlight-color:transparent}input{font-size:18px}</style></head>'
);
html = html.replace(
  "</body>",
  `<script>if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').then(reg=>{if(reg.waiting)reg.waiting.postMessage('ACTIVATE')}).catch(()=>{})}</script></body>`
);
await writeFile(htmlPath, html);
await writeFile(
  "dist/sw.js",
  `const CACHE='little-island-${version}';const FILES=${JSON.stringify([...assets, "/", "/manifest.webmanifest"])};self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));self.addEventListener('message',event=>{if(event.data==='ACTIVATE')self.skipWaiting()});self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('little-island-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith(fetch(event.request).catch(()=>caches.match(event.request).then(found=>found||(event.request.mode==='navigate'?caches.match('/'):Response.error()))))});`
);
console.log(`Offline shell ${version}: ${assets.length} bundled resources.`);
