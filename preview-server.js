const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const mime = {
  ".html": "text/html; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2"
};

http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || "/").split("?")[0]);
  if (u === "/") u = "/preview.html";
  const f = path.join(root, u);
  if (!f.startsWith(root)) {
    res.statusCode = 403;
    res.end();
    return;
  }
  fs.readFile(f, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.end("not found");
      return;
    }
    res.setHeader("Content-Type", mime[path.extname(f).toLowerCase()] || "application/octet-stream");
    res.end(data);
  });
}).listen(8765, "127.0.0.1", () => {
  console.log("preview http://127.0.0.1:8765/preview.html");
});
