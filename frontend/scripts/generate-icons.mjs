// Script para gerar os ícones PWA a partir do apple-icon.svg
// Requer: sharp  (já vem como dependência do Next.js)
// Rodar: node scripts/generate-icons.mjs

import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, mkdirSync } from "fs";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "src", "app", "apple-icon.svg");
const outDir = join(root, "public", "icons");

mkdirSync(outDir, { recursive: true });

const svgBuffer = readFileSync(svgPath);

const icons = [
  { name: "icon-192.png",          size: 192 },
  { name: "icon-512.png",          size: 512 },
  { name: "apple-touch-icon.png",  size: 180 },
];

for (const { name, size } of icons) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(outDir, name));

  console.log(`✓ ${name} (${size}x${size})`);
}

// Maskable PWA icon gerado a partir do maskable-icon.svg (com safe-zone e fundo 100% preenchido)
const maskableSvgBuffer = readFileSync(join(root, "public", "maskable-icon.svg"));
await sharp(maskableSvgBuffer)
  .resize(512, 512)
  .png()
  .toFile(join(outDir, "icon-maskable-512.png"));
console.log(`✓ icon-maskable-512.png (512x512 maskable)`);

console.log("\n✅ Ícones PWA gerados em public/icons/");
