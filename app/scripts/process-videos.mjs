// Re-encoda el catálogo de demostraciones a un tamaño apto para offline.
// Fuente: "Video ejercicios/" (378 clips originales, ~1 GB, bitrate desproporcionado).
// Salida: app/public/demos/<slug>.mp4 + app/src/data/video-catalog.json
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readdir, mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const run = promisify(execFile);

const SRC_DIR = path.resolve(import.meta.dirname, "..", "..", "Video ejercicios");
const OUT_DIR = path.resolve(import.meta.dirname, "..", "public", "demos");
const MANIFEST_OUT = path.resolve(import.meta.dirname, "..", "src", "data", "video-catalog.json");

function slugify(name) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\.mp4$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const files = (await readdir(SRC_DIR)).filter((f) => f.toLowerCase().endsWith(".mp4"));
  const manifest = [];
  let done = 0;
  for (const file of files) {
    const originalName = file.replace(/\.mp4$/i, "");
    const slug = slugify(file);
    const srcPath = path.join(SRC_DIR, file);
    const outPath = path.join(OUT_DIR, `${slug}.mp4`);
    await run("ffmpeg", [
      "-y", "-v", "error",
      "-i", srcPath,
      "-an",
      "-vf", "scale=720:-2",
      "-c:v", "libx264",
      "-crf", "26",
      "-preset", "slow",
      "-profile:v", "high",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      outPath,
    ]);
    const { size } = await stat(outPath);
    manifest.push({ originalName, slug, file: `demos/${slug}.mp4`, sizeBytes: size });
    done++;
    if (done % 50 === 0) console.log(`${done}/${files.length}`);
  }
  manifest.sort((a, b) => a.originalName.localeCompare(b.originalName));
  await writeFile(MANIFEST_OUT, JSON.stringify(manifest, null, 2) + "\n");
  const totalBytes = manifest.reduce((s, m) => s + m.sizeBytes, 0);
  console.log(`Listo: ${manifest.length} videos, ${(totalBytes / 1024 / 1024).toFixed(2)} MB totales.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
