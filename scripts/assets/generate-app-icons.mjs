import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..', '..');
const generatedIconDirectory = path.join(repositoryRoot, 'assets', 'icons', 'generated');
const pngSizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const icnsTypesBySize = new Map([
  [16, 'icp4'],
  [32, 'icp5'],
  [64, 'icp6'],
  [128, 'ic07'],
  [256, 'ic08'],
  [512, 'ic09'],
  [1024, 'ic10'],
]);

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let crc = index;

  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }

  return crc >>> 0;
});

const crc32 = (buffer) => {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
};

const pngChunk = (type, data) => {
  const typeBuffer = Buffer.from(type, 'ascii');
  const chunk = Buffer.alloc(8 + data.length + 4);
  chunk.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);

  return chunk;
};

const createPng = ({ width, height, pixels }) => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.writeUInt8(8, 8);
  header.writeUInt8(6, 9);
  header.writeUInt8(0, 10);
  header.writeUInt8(0, 11);
  header.writeUInt8(0, 12);

  const scanlineLength = width * 4 + 1;
  const raw = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * scanlineLength;
    raw.writeUInt8(0, rowOffset);
    pixels.copy(raw, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
};

const hexToRgb = (hex) => ({
  red: Number.parseInt(hex.slice(1, 3), 16),
  green: Number.parseInt(hex.slice(3, 5), 16),
  blue: Number.parseInt(hex.slice(5, 7), 16),
});

const mix = (start, end, amount) => Math.round(start + (end - start) * amount);

const colorMix = (startHex, endHex, amount) => {
  const start = hexToRgb(startHex);
  const end = hexToRgb(endHex);

  return {
    red: mix(start.red, end.red, amount),
    green: mix(start.green, end.green, amount),
    blue: mix(start.blue, end.blue, amount),
    alpha: 255,
  };
};

const isInsideRoundedRect = (x, y, left, top, width, height, radius) => {
  const right = left + width;
  const bottom = top + height;

  if (x < left || x > right || y < top || y > bottom) {
    return false;
  }

  const cornerX = x < left + radius ? left + radius : x > right - radius ? right - radius : x;
  const cornerY = y < top + radius ? top + radius : y > bottom - radius ? bottom - radius : y;
  const distanceX = x - cornerX;
  const distanceY = y - cornerY;

  return distanceX * distanceX + distanceY * distanceY <= radius * radius;
};

const isInsideCircle = (x, y, centerX, centerY, radius) => {
  const distanceX = x - centerX;
  const distanceY = y - centerY;

  return distanceX * distanceX + distanceY * distanceY <= radius * radius;
};

const isInsideRect = (x, y, left, top, width, height) =>
  x >= left && x <= left + width && y >= top && y <= top + height;

const distanceToSegmentSquared = (x, y, start, end) => {
  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;
  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;

  if (segmentLengthSquared === 0) {
    const distanceX = x - start.x;
    const distanceY = y - start.y;
    return distanceX * distanceX + distanceY * distanceY;
  }

  const amount = Math.max(
    0,
    Math.min(1, ((x - start.x) * segmentX + (y - start.y) * segmentY) / segmentLengthSquared),
  );
  const projectionX = start.x + amount * segmentX;
  const projectionY = start.y + amount * segmentY;
  const distanceX = x - projectionX;
  const distanceY = y - projectionY;

  return distanceX * distanceX + distanceY * distanceY;
};

const isInsidePolylineStroke = (x, y, points, radius) =>
  points.some((point, index) => {
    if (index === points.length - 1) {
      return false;
    }

    return distanceToSegmentSquared(x, y, point, points[index + 1]) <= radius * radius;
  });

const isInsidePolygon = (x, y, points) => {
  let inside = false;

  for (let index = 0, previous = points.length - 1; index < points.length; previous = index, index += 1) {
    const currentPoint = points[index];
    const previousPoint = points[previous];
    const intersects =
      currentPoint.y > y !== previousPoint.y > y &&
      x <
        ((previousPoint.x - currentPoint.x) * (y - currentPoint.y)) /
          (previousPoint.y - currentPoint.y) +
          currentPoint.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
};

const iconColorAt = (x, y) => {
  if (!isInsideRoundedRect(x, y, 0, 0, 1024, 1024, 224)) {
    return { red: 0, green: 0, blue: 0, alpha: 0 };
  }

  let color = colorMix('#2f625d', '#1f3f3d', (x * 0.35 + y * 0.65) / 1024);

  if (
    isInsidePolygon(x, y, [
      { x: 122, y: 644 },
      { x: 188, y: 698 },
      { x: 326, y: 806 },
      { x: 554, y: 882 },
      { x: 800, y: 902 },
      { x: 902, y: 690 },
      { x: 902, y: 902 },
      { x: 122, y: 902 },
    ])
  ) {
    color = colorMix('#244f4a', '#1a3432', 0.28);
  }

  const shadow = isInsideRoundedRect(x, y, 206, 328, 612, 450, 94);

  if (shadow) {
    color = colorMix(colorToHex(color), '#112624', 0.12);
  }

  if (isInsideRoundedRect(x, y, 238, 192, 566, 296, 84)) {
    color = colorMix('#d7cdbc', '#bfb3a0', y / 1024);
  }

  if (isInsideRoundedRect(x, y, 206, 304, 612, 448, 94)) {
    color = colorMix('#fffefa', '#e6ded0', (x * 0.25 + y * 0.75) / 1024);
  }

  if (isInsideRoundedRect(x, y, 256, 356, 512, 54, 34)) {
    color = { red: 244, green: 242, blue: 236, alpha: 255 };
  }

  if (isInsidePolylineStroke(x, y, [
    { x: 650, y: 445 },
    { x: 405, y: 445 },
    { x: 350, y: 500 },
    { x: 405, y: 555 },
    { x: 620, y: 555 },
    { x: 675, y: 610 },
    { x: 620, y: 665 },
    { x: 365, y: 665 },
  ], 29)) {
    color = hexToRgba('#2f625d');
  }

  if (isInsideCircle(x, y, 704, 318, 72)) {
    color = hexToRgba('#c99534');
  }

  if (
    isInsidePolygon(x, y, [
      { x: 704, y: 270 },
      { x: 720, y: 302 },
      { x: 752, y: 318 },
      { x: 720, y: 334 },
      { x: 704, y: 366 },
      { x: 688, y: 334 },
      { x: 656, y: 318 },
      { x: 688, y: 302 },
    ])
  ) {
    color = hexToRgba('#fffefa');
  }

  return color;
};

const colorToHex = ({ red, green, blue }) =>
  `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue
    .toString(16)
    .padStart(2, '0')}`;

const hexToRgba = (hex) => ({
  ...hexToRgb(hex),
  alpha: 255,
});

const renderIconPng = (size) => {
  const samplesPerAxis = size <= 64 ? 4 : 2;
  const sampleCount = samplesPerAxis * samplesPerAxis;
  const pixels = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let red = 0;
      let green = 0;
      let blue = 0;
      let alpha = 0;

      for (let sampleY = 0; sampleY < samplesPerAxis; sampleY += 1) {
        for (let sampleX = 0; sampleX < samplesPerAxis; sampleX += 1) {
          const sourceX = ((x + (sampleX + 0.5) / samplesPerAxis) / size) * 1024;
          const sourceY = ((y + (sampleY + 0.5) / samplesPerAxis) / size) * 1024;
          const color = iconColorAt(sourceX, sourceY);
          red += color.red * color.alpha;
          green += color.green * color.alpha;
          blue += color.blue * color.alpha;
          alpha += color.alpha;
        }
      }

      const pixelOffset = (y * size + x) * 4;
      const averagedAlpha = Math.round(alpha / sampleCount);
      // Supersampling keeps the same vector-like source geometry crisp at tray
      // sizes without adding a raster or SVG dependency to the build.
      pixels[pixelOffset] = averagedAlpha === 0 ? 0 : Math.round(red / alpha);
      pixels[pixelOffset + 1] = averagedAlpha === 0 ? 0 : Math.round(green / alpha);
      pixels[pixelOffset + 2] = averagedAlpha === 0 ? 0 : Math.round(blue / alpha);
      pixels[pixelOffset + 3] = averagedAlpha;
    }
  }

  return createPng({ width: size, height: size, pixels });
};

const createIco = (entries) => {
  const headerLength = 6;
  const directoryEntryLength = 16;
  const directoryLength = entries.length * directoryEntryLength;
  let imageOffset = headerLength + directoryLength;

  const header = Buffer.alloc(headerLength);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  const directoryEntries = entries.map(({ size, png }) => {
    const entry = Buffer.alloc(directoryEntryLength);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(imageOffset, 12);
    imageOffset += png.length;
    return entry;
  });

  return Buffer.concat([header, ...directoryEntries, ...entries.map(({ png }) => png)]);
};

const createIcns = (entries) => {
  const iconElements = entries.map(({ size, png }) => {
    const type = icnsTypesBySize.get(size);

    if (!type) {
      throw new Error(`No ICNS type configured for ${size}px.`);
    }

    const elementHeader = Buffer.alloc(8);
    elementHeader.write(type, 0, 4, 'ascii');
    elementHeader.writeUInt32BE(png.length + elementHeader.length, 4);

    return Buffer.concat([elementHeader, png]);
  });

  const totalLength = 8 + iconElements.reduce((sum, element) => sum + element.length, 0);
  const header = Buffer.alloc(8);
  header.write('icns', 0, 4, 'ascii');
  header.writeUInt32BE(totalLength, 4);

  return Buffer.concat([header, ...iconElements]);
};

await mkdir(generatedIconDirectory, { recursive: true });

const pngEntries = pngSizes.map((size) => ({
  size,
  png: renderIconPng(size),
}));

for (const { size, png } of pngEntries) {
  await writeFile(path.join(generatedIconDirectory, `sidekick-icon-${size}.png`), png);
}

const primaryPng = pngEntries.find(({ size }) => size === 512)?.png;

if (!primaryPng) {
  throw new Error('Missing 512px PNG for the primary Linux/window icon.');
}

await writeFile(path.join(generatedIconDirectory, 'sidekick-icon.png'), primaryPng);
await writeFile(
  path.join(generatedIconDirectory, 'sidekick-icon.ico'),
  createIco(pngEntries.filter(({ size }) => icoSizes.includes(size))),
);
await writeFile(
  path.join(generatedIconDirectory, 'sidekick-icon.icns'),
  createIcns(pngEntries.filter(({ size }) => icnsTypesBySize.has(size))),
);
