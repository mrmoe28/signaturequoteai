// scripts/verify-images.ts
import fs from "node:fs";
import path from "node:path";
import { getProducts } from "../lib/db/queries";
import type { Product } from "../lib/types";

function normalize(p?: string | null) {
  if (!p) return null;
  return "/" + p.replace(/^public\//, "").replace(/^\/+/, "");
}

async function main() {
  console.log("🔍 Verifying product images...\n");

  try {
    // Fetch all products from database
    const result = await getProducts({}, 1, 10000); // Get all products
    const products: Product[] = result.items;

    console.log(`📦 Found ${products.length} products\n`);

    const root = process.cwd();
    let missing = 0;
    let checked = 0;
    const missingFiles: { id: string; name: string; path: string }[] = [];

    for (const p of products) {
      // Check primary image from images array
      const primaryLocal =
        p.images?.find(i => i.isPrimary)?.localPath ??
        p.images?.[0]?.localPath ??
        null;

      const normalized = normalize(primaryLocal);
      if (!normalized) continue;

      checked++;
      const disk = path.join(root, "public", normalized);

      if (!fs.existsSync(disk)) {
        missingFiles.push({
          id: p.id,
          name: p.name,
          path: normalized
        });
        missing++;
      }

      // Also check additional images
      if (p.images && p.images.length > 1) {
        for (let i = 1; i < p.images.length; i++) {
          const img = p.images[i];
          const imgPath = normalize(img.localPath);
          if (!imgPath) continue;

          checked++;
          const imgDisk = path.join(root, "public", imgPath);

          if (!fs.existsSync(imgDisk)) {
            missingFiles.push({
              id: p.id,
              name: `${p.name} (image ${i + 1})`,
              path: imgPath
            });
            missing++;
          }
        }
      }
    }

    console.log(`✅ Checked ${checked} image references\n`);

    if (missing === 0) {
      console.log("✅ All referenced localPath files exist under /public");
      process.exit(0);
    } else {
      console.error(`❌ Missing ${missing} image file(s):\n`);

      // Show first 20 missing files
      const displayFiles = missingFiles.slice(0, 20);
      for (const file of displayFiles) {
        console.error(`   • ${file.id} - "${file.name}"`);
        console.error(`     Missing: ${file.path}\n`);
      }

      if (missingFiles.length > 20) {
        console.error(`   ... and ${missingFiles.length - 20} more`);
      }

      console.error(`\n💡 Ensure files exist under /public and paths start with "/".`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error verifying images:", error);
    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
