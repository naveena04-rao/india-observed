import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const outputDirectory = resolve(process.argv[2] ?? ".media-preview-output");
const inputDirectory = process.argv[3] ? resolve(process.argv[3]) : null;

const previews = [
  {
    mediaId: "14000000-0000-4000-8000-000000000001",
    slug: "jamia-yuva-kumbh-campus-protest",
    sourcePage:
      "https://www.ndtv.com/education/jamia-students-protest-rss-yuva-kumbh-event-on-campus-heavy-police-deployed-11419540",
    imageUrl: "https://drop.ndtv.com/video/images/vod/medium/2026-04/1091649_maxresdefault.jpg",
    altText:
      "Students gathered at Jamia Millia Islamia during the protest over the Yuva Kumbh event.",
    publisher: "NDTV",
    sourceKind: "official publisher video frame",
    inputFile: "jamia-yuva-kumbh-campus-protest.png",
  },
  {
    mediaId: "14000000-0000-4000-8000-000000000004",
    slug: "dasiya-villagers-ethanol-plant",
    sourcePage: "https://www.facebook.com/LiveTimesNewsChannel/videos/2065530604339052/",
    imageUrl: null,
    altText:
      "Villagers gathered during the movement opposing the proposed ethanol plant in Dasiya.",
    publisher: "Live Times",
    sourceKind: "official social-video thumbnail",
    inputFile: "dasiya-villagers-ethanol-plant.png",
  },
  {
    mediaId: "14000000-0000-4000-8000-000000000005",
    slug: "indore-dewas-ring-road-compensation",
    sourcePage:
      "https://mpcg.ndtv.in/madhya-pradesh-news/indore-farmers-protest-mp-farmers-west-ring-road-project-land-acquisition-compensation-tractor-rally-mohan-yadav-11795930",
    imageUrl:
      "https://c.ndtvimg.com/2026-07/iap7in28_indore-farmers-protest-mp-farmers-west-ring-road-project-land-_625x300_20_July_26.jpg?im=FitAndFill,algorithm=dnn,width=773,height=435",
    altText:
      "Farmers and tractors assembled during the Indore–Dewas ring-road compensation protest.",
    publisher: "NDTV MPCG",
    sourceKind: "official publisher exact-event thumbnail",
    inputFile: "indore-dewas-ring-road-compensation.source",
  },
  {
    mediaId: "15000000-0000-4000-8000-000000000001",
    slug: "bidadi-farmers-land-acquisition",
    sourcePage:
      "https://www.ndtv.com/video/protests-in-karnataka-s-bidadi-after-government-proposes-to-cut-trees-for-ai-city-project-1120270",
    imageUrl:
      "https://c.ndtvimg.com/2026-06/t9gf8cms_bidadi_160x120_30_June_26.png?downsize=1600:900",
    altText:
      "Farmers gathered in Bidadi during opposition to land acquisition for the township project.",
    publisher: "NDTV",
    sourceKind: "official publisher exact-event thumbnail",
    inputFile: "bidadi-farmers-land-acquisition.png",
  },
];

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function fetchBuffer(url, sourcePage) {
  const response = await fetch(url, {
    headers: {
      accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      referer: sourcePage,
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0 Safari/537.36",
    },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`Media fetch failed with HTTP ${response.status}.`);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Expected an image response, received ${contentType || "unknown"}.`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function findOpenGraphImage(sourcePage) {
  const response = await fetch(sourcePage, {
    headers: { "user-agent": "IndiaObservedMediaReview/1.0" },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`Source-page fetch failed with HTTP ${response.status}.`);
  const html = await response.text();
  const match =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i);
  if (!match) throw new Error("The official source did not expose an Open Graph image.");
  return match[1].replaceAll("&amp;", "&");
}

await mkdir(outputDirectory, { recursive: true });
const manifest = [];

for (const preview of previews) {
  const originalUrl =
    preview.imageUrl ??
    (inputDirectory ? preview.sourcePage : await findOpenGraphImage(preview.sourcePage));
  let original = null;
  if (inputDirectory) {
    const inputPath = resolve(inputDirectory, preview.inputFile);
    await access(inputPath);
    original = await readFile(inputPath);
  } else {
    original = await fetchBuffer(originalUrl, preview.sourcePage);
  }
  const derivative = await sharp(original)
    .rotate()
    .resize(960, 540, { fit: "cover", position: "centre", withoutEnlargement: false })
    .webp({ quality: 76, effort: 6 })
    .toBuffer();
  const fileName = `${preview.slug}.webp`;
  await writeFile(resolve(outputDirectory, fileName), derivative);
  manifest.push({
    ...preview,
    originalUrl,
    originalSha256: sha256(original),
    previewSha256: sha256(derivative),
    storagePath: `${preview.slug}/${preview.mediaId}/preview.webp`,
    fileName,
    width: 960,
    height: 540,
  });
}

await writeFile(
  resolve(outputDirectory, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(`Prepared ${manifest.length} reviewed archive previews in ${outputDirectory}.`);
