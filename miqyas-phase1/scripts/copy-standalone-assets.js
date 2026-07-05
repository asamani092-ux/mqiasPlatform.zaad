#!/usr/bin/env node
/**
 * نسخ static/public/storage لـ Next.js standalone — بدونها CSS لا يُحمّل في الإنتاج.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");

if (!fs.existsSync(standalone)) {
  console.log("postbuild: no standalone output — skip");
  process.exit(0);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

copyDir(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"));
copyDir(path.join(root, "public"), path.join(standalone, "public"));

const storageSrc = path.join(root, "storage");
const storageDest = path.join(standalone, "storage");
if (fs.existsSync(storageSrc)) {
  try {
    if (fs.existsSync(storageDest)) fs.rmSync(storageDest, { recursive: true, force: true });
    fs.symlinkSync(storageSrc, storageDest, "dir");
  } catch {
    copyDir(storageSrc, storageDest);
  }
}

console.log("postbuild: standalone assets copied");
