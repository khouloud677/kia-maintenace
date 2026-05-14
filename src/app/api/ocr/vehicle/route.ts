import { NextResponse } from "next/server";
import sharp from "sharp";
import { createWorker } from "tesseract.js";
import fs from "fs";
import path from "path";

type OcrPayload = {
  rawText: string;
  vin: string;
  matricule: string;
};

type CropRegion = {
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

type RegionOcrResult = {
  name: string;
  rawText: string;
  vin: string;
  matricule: string;
};

function formatUnknownError(error: unknown): string {
  if (error instanceof Error) return error.message;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function extractVin(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);

  let bestCandidate = "";
  let bestScore = 0;

  for (const line of lines) {
    const compact = line.replace(/[^A-Z0-9]/g, "");
    const match = compact.match(/[A-HJ-NPR-Z0-9]{17}/);

    if (!match) {
      continue;
    }

    let score = 10;

    if (/VIN|CHASSIS|SERIE|SERIAL|N°\s*CHASSIS|NUMERO\s*CHASSIS/.test(line)) score += 80;
    if (/\b[VF][A-Z0-9]{15,16}\b/.test(compact)) score += 10;
    if (/TUNIS|TUNISIE|REPUBLIQUE|CERTIFICAT|IMMATRICULATION/.test(line)) score -= 60;
    if (/^[A-HJ-NPR-Z0-9\s-]{17,}$/.test(line)) score += 5;

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = match[0];
    }
  }

  return bestCandidate;
}

function extractPlate(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  let bestCandidate = "";
  let bestScore = 0;

  for (const line of lines) {
    const upper = line.toUpperCase();
    if (/REPUBLIQUE|CERTIFICAT|IMMATRICULATION/.test(upper)) {
      continue;
    }

    const hasTunisiaMarker = /(?:\bTUNIS\b|\bTUNISIE\b|\bTN\b|تونس)/i.test(line);
    const normalized = upper
      .replace(/\b(?:TUNIS|TUNISIE|TN)\b/g, " ")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();
    const compact = normalized.replace(/\s+/g, "");
    const groups = normalized.split(/\s+/).filter(Boolean);

    if (compact.length < 4 || compact.length > 9 || !/\d/.test(compact)) {
      continue;
    }

    if (groups.length < 2 || groups.length > 3) {
      continue;
    }

    const digitGroupCount = groups.filter((group) => /^\d+$/.test(group)).length;
    const letterGroupCount = groups.filter((group) => /^[A-Z]+$/.test(group)).length;
    const mixedGroupCount = groups.filter((group) => /^[A-Z0-9]+$/.test(group) && !/^\d+$/.test(group) && !/^[A-Z]+$/.test(group)).length;

    if (digitGroupCount === 0 || (letterGroupCount + mixedGroupCount) === 0) {
      continue;
    }

    let score = 0;

    if (/^\d{1,4}\s+[A-Z]{1,3}\s*\d{0,4}$/.test(normalized)) score += 100;
    if (/^\d{1,4}[A-Z]{1,3}\d{0,4}$/.test(compact)) score += 80;
    if (/^\d{2,4}\s+[A-Z]{1,3}\s+\d{0,4}$/.test(normalized)) score += 70;
    if (/^\d{1,4}\s+[A-Z0-9]{2,4}$/.test(normalized)) score += 45;
    if (/^\d{1,4}[A-Z0-9]{2,4}$/.test(compact)) score += 35;
    if (/\d{3,4}/.test(compact)) score += 10;
    if (/[A-Z]/.test(compact)) score += 10;
    if (/^0+$/.test(compact)) score -= 50;
    if (/^[A-Z]{2,}\d+[A-Z]{2,}$/.test(compact)) score -= 60;
    if (hasTunisiaMarker) score += 25;

    if (score > bestScore) {
      bestScore = score;
      const plateBody = normalized.replace(/\b(?:TUNIS|TUNISIE|TN)\b/gi, " ").replace(/\s+/g, " ").trim();
      bestCandidate = hasTunisiaMarker
        ? `تونس ${plateBody}`.trim()
        : plateBody;
    }
  }

  return bestCandidate;
}

function regionWeight(regionName: string, kind: "vin" | "plate") {
  const isVinRegion = regionName.includes("vin") || regionName.includes("left-vertical-strip");
  const isPlateRegion = regionName.includes("plate") || regionName.includes("footer");

  if (kind === "vin") {
    if (regionName === "full") return 10;
    if (isVinRegion) return 60;
    if (isPlateRegion) return -20;
    return 0;
  }

  if (regionName === "full") return 10;
  if (isPlateRegion) return 60;
  if (isVinRegion) return -20;
  return 0;
}

function normalizeResult(payload: Partial<OcrPayload>): OcrPayload {
  const rawText = payload.rawText ?? "";
  const vin = payload.vin ? extractVin(payload.vin) : "";
  const matricule = payload.matricule?.trim() || "";

  return {
    rawText,
    vin,
    matricule,
  };
}

function scoreVinCandidate(text: string, vin: string) {
  if (!vin) return 0;

  let score = 100;
  const upperText = text.toUpperCase();

  if (upperText.includes("VIN") || upperText.includes("N° CHASSIS") || upperText.includes("NUMERO CHASSIS")) {
    score += 25;
  }

  if (upperText.includes("CHASSIS") || upperText.includes("SERIE") || upperText.includes("SERIAL")) {
    score += 15;
  }

  if (upperText.includes("TUNIS") || upperText.includes("TUNISIE") || upperText.includes("IMMATRICULATION")) {
    score -= 40;
  }

  if (vin === extractVin(text)) {
    score += 15;
  }

  return score;
}

function scorePlateCandidate(text: string, matricule: string) {
  if (!matricule) return 0;

  let score = 60;
  const upperText = text.toUpperCase();
  const compact = matricule.replace(/\s+/g, "");

  if (upperText.includes("MATRICULE") || upperText.includes("IMMATRICULATION") || upperText.includes("PLAQUE")) {
    score += 30;
  }

  if (upperText.includes("TUNIS") || upperText.includes("TUNISIE") || upperText.includes("REPUBLIQUE")) {
    score -= 80;
  }

  if (/^\d{1,4}\s+[A-Z]{1,3}\s*\d{0,4}$/.test(matricule)) {
    score += 30;
  }

  if (/^\d{1,4}[A-Z]{1,3}\d{0,4}$/.test(compact)) {
    score += 20;
  }

  if (/\d/.test(compact)) {
    score += 10;
  }

  if (/^[A-Z0-9\s]+$/.test(matricule)) {
    score += 5;
  }

  return score;
}

function buildTemplateRegions(width: number, height: number): CropRegion[] {
  const regions: CropRegion[] = [
    { name: "full", left: 0, top: 0, width, height },
    { name: "header", left: 0, top: 0, width, height: Math.round(height * 0.24) },
    {
      name: "left-vertical-strip",
      left: 0,
      top: Math.round(height * 0.12),
      width: Math.round(width * 0.18),
      height: Math.round(height * 0.82),
    },
    {
      name: "vin-strip",
      left: Math.round(width * 0.12),
      top: Math.round(height * 0.38),
      width: Math.round(width * 0.48),
      height: Math.round(height * 0.15),
    },
    {
      name: "model-strip",
      left: Math.round(width * 0.12),
      top: Math.round(height * 0.50),
      width: Math.round(width * 0.48),
      height: Math.round(height * 0.18),
    },
    {
      name: "owner-block",
      left: Math.round(width * 0.56),
      top: Math.round(height * 0.12),
      width: Math.round(width * 0.40),
      height: Math.round(height * 0.32),
    },
    {
      name: "plate-block",
      left: Math.round(width * 0.66),
      top: Math.round(height * 0.46),
      width: Math.round(width * 0.28),
      height: Math.round(height * 0.20),
    },
    {
      name: "footer",
      left: Math.round(width * 0.54),
      top: Math.round(height * 0.70),
      width: Math.round(width * 0.42),
      height: Math.round(height * 0.20),
    },
  ];

  return regions.filter((region) => region.width > 0 && region.height > 0);
}

async function preprocessDocument(bytes: Buffer) {
  const image = sharp(bytes, { limitInputPixels: false }).rotate().grayscale().normalize();
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (!width || !height) {
    throw new Error("Unable to read image dimensions");
  }

  const prepared = await image.png().toBuffer();
  return { prepared, width, height };
}

async function cropRegion(imageBuffer: Buffer, region: CropRegion) {
  const extraction = sharp(imageBuffer, { limitInputPixels: false }).extract({
    left: Math.max(0, region.left),
    top: Math.max(0, region.top),
    width: Math.max(1, region.width),
    height: Math.max(1, region.height),
  });

  return extraction
    .resize({ width: Math.min(1800, region.width * 2) })
    .sharpen()
    .png()
    .toBuffer();
}

async function rotateVerticalCrop(crop: Buffer) {
  return sharp(crop, { limitInputPixels: false })
    .rotate(90)
    .resize({ width: 1800 })
    .sharpen()
    .png()
    .toBuffer();
}

async function runTesseractOcr(bytes: Buffer): Promise<OcrPayload> {
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "tesseract.js",
    "src",
    "worker-script",
    "node",
    "index.js"
  );

  if (!fs.existsSync(workerPath)) {
    throw new Error(`Tesseract worker script not found at ${workerPath}`);
  }

  const { prepared, width, height } = await preprocessDocument(bytes);
  const regions = buildTemplateRegions(width, height);
  const worker = await createWorker("eng+fra", 1, {
    workerPath,
  });

  try {
    const results: RegionOcrResult[] = [];

    for (const region of regions) {
      const crop = region.name === "full" ? prepared : await cropRegion(prepared, region);
      const isPlateRegion = region.name.includes("plate") || region.name.includes("footer");
      const isVinRegion = region.name.includes("vin") || region.name.includes("left-vertical-strip");

      if (isPlateRegion) {
        await worker.setParameters({
          tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        });
      } else if (isVinRegion) {
        await worker.setParameters({
          tessedit_char_whitelist: "0123456789ABCDEFGHJKLMNPRSTUVWXYZ",
        });
      } else {
        await worker.setParameters({
          tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
        });
      }

      const variants =
        region.name === "left-vertical-strip"
          ? [crop, await rotateVerticalCrop(crop)]
          : [crop];

      for (let index = 0; index < variants.length; index += 1) {
        const result = await worker.recognize(variants[index]);
        const rawText = result.data.text || "";
        const vin = extractVin(rawText);
        const matricule = extractPlate(rawText);

        results.push({
          name: `${region.name}${index > 0 ? "-rotated" : ""}`,
          rawText,
          vin,
          matricule,
        });
      }
    }

    function weightedScoreForVin(item: RegionOcrResult) {
      return scoreVinCandidate(item.rawText, item.vin) + regionWeight(item.name, "vin");
    }

    function weightedScoreForPlate(item: RegionOcrResult) {
      return scorePlateCandidate(item.rawText, item.matricule) + regionWeight(item.name, "plate");
    }

    const bestVinCandidate = results
      .map((item) => ({ item, score: weightedScoreForVin(item) }))
      .sort((left, right) => right.score - left.score)[0]?.item;

    const bestPlateCandidate = results
      .map((item) => ({ item, score: weightedScoreForPlate(item) }))
      .sort((left, right) => right.score - left.score)[0]?.item;

    const rawText = results
      .map((item) => `[${item.name}]\n${item.rawText}`)
      .join("\n\n")
      .trim();

    return normalizeResult({
      rawText,
      vin: bestVinCandidate?.vin,
      matricule: bestPlateCandidate?.matricule,
    });
  } catch (error) {
    throw new Error(`Template OCR failed: ${formatUnknownError(error)}`);
  } finally {
    await worker.terminate();
  }
}

export async function POST(request: Request) {
  const form = await request.formData();
  const image = form.get("image");
  const maxImageBytes = 8 * 1024 * 1024;

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "image file is required" }, { status: 400 });
  }

  if (!image.type.startsWith("image/")) {
    return NextResponse.json({ error: "uploaded file must be an image" }, { status: 400 });
  }

  const supportedMimeTypes = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ]);

  if (!supportedMimeTypes.has(image.type)) {
    return NextResponse.json(
      {
        error:
          "Unsupported image format. Please upload JPG, PNG, WEBP, or GIF.",
      },
      { status: 400 }
    );
  }

  if (image.size > maxImageBytes) {
    return NextResponse.json({ error: "image is too large (max 8MB)" }, { status: 400 });
  }

  try {
    const bytes = Buffer.from(await image.arrayBuffer());
    const ocrPayload = await runTesseractOcr(bytes);

    return NextResponse.json({
      rawText: ocrPayload.rawText,
      vin: ocrPayload.vin,
      matricule: ocrPayload.matricule,
      requiresManualValidation: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown OCR error";
    console.error("OCR route failure:", errorMessage);

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? errorMessage
            : "Unable to scan the document right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
