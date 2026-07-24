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
  { name: "icon-192.png",          size: 192, padding: 0   },
  { name: "icon-512.png",          size: 512, padding: 0   },
  { name: "apple-touch-icon.png",  size: 180, padding: 0   },
  // maskable: safe zone = central 80% → 10% padding on each side
  { name: "icon-maskable-512.png", size: 512, padding: 52  },
];

for (const { name, size, padding } of icons) {
  const iconSize = size - padding * 2;
  await sharp(svgBuffer)
    .resize(iconSize, iconSize)
    .flatten({ background: padding > 0 ? "#D16330" : { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: "#D16330",
    })
    .png()
    .toFile(join(outDir, name));

  console.log(`✓ ${name} (${size}x${size})`);
}

console.log("\n✅ Ícones PWA gerados em public/icons/");
