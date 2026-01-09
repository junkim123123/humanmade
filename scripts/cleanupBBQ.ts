import * as fs from "fs";
import * as path from "path";

const PRODUCT_PHOTOS_DIR = path.join(process.cwd(), "public", "product-photos");
const source = path.join(PRODUCT_PHOTOS_DIR, "바베큐 마시멜로우"); // Korean folder name to consolidate (BBQ Marshmallow)
const dest = path.join(PRODUCT_PHOTOS_DIR, "BBQ Marshmallow");

if (fs.existsSync(source)) {
  const files = fs.readdirSync(source);
  files.forEach(file => {
    const oldPath = path.join(source, file);
    const newPath = path.join(dest, file);
    fs.renameSync(oldPath, newPath);
    console.log(`Moved ${file} to ${dest}`);
  });
  fs.rmdirSync(source);
  console.log(`Deleted ${source}`);
}
