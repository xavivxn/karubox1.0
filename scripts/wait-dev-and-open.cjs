/**
 * Espera a que Next.js responda en localhost (3000–3003) y abre el navegador por defecto.
 * Evita depender de `open` (ESM) y cubre el caso en que el puerto 3000 esté ocupado.
 */
const http = require("http");
const { exec } = require("child_process");

const PORTS = [3000, 3001, 3002, 3003];
const INTERVAL_MS = 400;
const MAX_MS = 120_000;

function isNextResponse(res) {
  const powered = res.headers["x-powered-by"];
  return (
    typeof powered === "string" && powered.toLowerCase().includes("next.js")
  );
}

function probePort(port) {
  return new Promise((resolve) => {
    const req = http.get(
      { hostname: "127.0.0.1", port, path: "/", timeout: 2000 },
      (res) => {
        const ok = isNextResponse(res);
        res.resume();
        resolve(ok ? port : null);
      }
    );
    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
  });
}

async function findListeningPort() {
  const deadline = Date.now() + MAX_MS;
  while (Date.now() < deadline) {
    for (const port of PORTS) {
      const ok = await probePort(port);
      if (ok) return ok;
    }
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
  return null;
}

function openBrowser(url) {
  const platform = process.platform;
  let cmd;
  if (platform === "win32") {
    cmd = `start "" "${url}"`;
  } else if (platform === "darwin") {
    cmd = `open "${url}"`;
  } else {
    cmd = `xdg-open "${url}"`;
  }
  exec(cmd, { shell: true }, () => {});
}

findListeningPort().then((port) => {
  if (!port) {
    process.stderr.write(
      "[dev-browser] No se detectó Next.js en 3000–3003 en 120s. Abrí la URL manualmente.\n"
    );
    process.exit(0);
    return;
  }
  const url = `http://localhost:${port}`;
  process.stdout.write(`[dev-browser] Abriendo ${url}\n`);
  openBrowser(url);
});
