import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, bgColor, drawLogo) {
  // Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw image data
  // scanlines: (width * 4 + 1) * height
  const rowLength = width * 4 + 1;
  const rawData = Buffer.alloc(rowLength * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.38;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default background color (e.g. #1e40af - deep blue)
      let r = bgColor[0];
      let g = bgColor[1];
      let b = bgColor[2];
      let a = 255;

      // Draw gear / car parts icon in the center
      if (drawLogo) {
        // Outer ring of gear
        const inGear = dist < radius && dist > radius * 0.55;
        // Teeth of gear (8 teeth)
        const angle = Math.atan2(dy, dx);
        const tooth = Math.cos(angle * 8) > 0.3;
        const inTooth = dist <= radius * 1.15 && dist >= radius * 0.8 && tooth;

        // Inner hub
        const inHub = dist < radius * 0.3;

        // Wrench or highlight
        if (inTooth || inGear || inHub) {
          // Bright white / cyan highlight
          r = 255;
          g = 255;
          b = 255;
        } else if (dist < radius * 0.55 && dist >= radius * 0.3) {
          // Accent inner ring
          r = 37;
          g = 99;
          b = 235; // #2563eb
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Standard CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate Icons
console.log('Generating PWA icons...');
const brandBlue = [30, 64, 175]; // #1e40af

const png192 = createPNG(192, 192, brandBlue, true);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

const png512 = createPNG(512, 512, brandBlue, true);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

const maskable512 = createPNG(512, 512, brandBlue, true);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), maskable512);

const appleTouch = createPNG(180, 180, brandBlue, true);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);

// Also generate SVG icon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="112" fill="#1e40af"/>
  <circle cx="256" cy="256" r="140" fill="none" stroke="#ffffff" stroke-width="32"/>
  <circle cx="256" cy="256" r="50" fill="#ffffff"/>
  <!-- Gear teeth -->
  <rect x="236" y="70" width="40" height="60" rx="10" fill="#ffffff"/>
  <rect x="236" y="382" width="40" height="60" rx="10" fill="#ffffff"/>
  <rect x="70" y="236" width="60" height="40" rx="10" fill="#ffffff"/>
  <rect x="382" y="236" width="60" height="40" rx="10" fill="#ffffff"/>
  <rect x="125" y="125" width="50" height="50" rx="10" fill="#ffffff" transform="rotate(45 150 150)"/>
  <rect x="337" y="125" width="50" height="50" rx="10" fill="#ffffff" transform="rotate(45 362 150)"/>
  <rect x="125" y="337" width="50" height="50" rx="10" fill="#ffffff" transform="rotate(45 150 362)"/>
  <rect x="337" y="337" width="50" height="50" rx="10" fill="#ffffff" transform="rotate(45 362 362)"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg);

console.log('PWA icons created successfully in public/');
