// scripts/link-core.js
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const { symlinkSync, rmSync, existsSync, mkdirsSync, cpSync, pathExists, removeSync } = fs;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// adjust source paths (where YOUR custom files live)
const SRC_TIMER = path.resolve(__dirname, "js/TimerControl.vue");
const SRC_GLOBAL = path.resolve(__dirname, "js/globals.js");

// target inside frappe core
const DEST_TIMER = path.resolve(
  __dirname,
  "../frappe/frappe/public/js/form_builder/components/controls/TimerControl.vue"
);
const DEST_GLOBAL = path.resolve(
  __dirname,
  "../frappe/frappe/public/js/form_builder/globals.js"
);

function updateAssets(src, dest) {
  if (pathExists(dest)) {
    removeSync(dest, { force: true });
  }
  mkdirsSync(path.dirname(dest));
  cpSync(src, dest);
  console.log(`✔ Copied ${dest} -> ${src}`);
}

updateAssets(SRC_TIMER, DEST_TIMER);
updateAssets(SRC_GLOBAL, DEST_GLOBAL);
