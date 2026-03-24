/**
 * Borra el archivo `trace` de Next antes de `next dev` para evitar EPERM por bloqueo
 * (otro dev/build, OneDrive, antivirus). Si no existe o está en uso, se ignora.
 */
const fs = require("fs");
const path = require("path");
const os = require("os");

const root = process.cwd();

const candidates = [
  path.join(root, ".next", "trace"),
  path.join(root, "node_modules", ".cache", "karubox-next", "trace"),
  path.join(os.homedir(), "AppData", "Local", "KaruboxNext", "next-cache", "trace"),
];

for (const file of candidates) {
  try {
    fs.unlinkSync(file);
  } catch {
    // ENOENT / EPERM: seguimos; Next intentará crear de nuevo
  }
}
