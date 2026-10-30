import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateIcons() {
  const sourceImage = 'C:/Users/pdivy/.gemini/antigravity/brain/e719afaf-2478-40ee-85b2-6b8c7654a2db/.user_uploaded/media_1793389547511_e374522a.jpg';

  if (!fs.existsSync(sourceImage)) {
    throw new Error('Source logo not found at: ' + sourceImage);
  }

  console.log('Reading source image from:', sourceImage);

  // Create a circular SVG mask of radius 493 centered at (511, 509)
  const maskSvg = Buffer.from(`
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <circle cx="511" cy="509" r="494" fill="#ffffff" />
    </svg>
  `);

  // Apply circular mask to create master transparent-corner PNG
  const circularMaster = await sharp(sourceImage)
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  if (!fs.existsSync('public')) {
    fs.mkdirSync('public', { recursive: true });
  }

  // Generate standard PNG sizes
  const icon512Buf = await sharp(circularMaster).resize(512, 512).png().toBuffer();
  const icon192Buf = await sharp(circularMaster).resize(192, 192).png().toBuffer();
  const appleTouchBuf = await sharp(circularMaster).resize(180, 180).png().toBuffer();
  const fav48Buf = await sharp(circularMaster).resize(48, 48).png().toBuffer();
  const fav32Buf = await sharp(circularMaster).resize(32, 32).png().toBuffer();
  const fav16Buf = await sharp(circularMaster).resize(16, 16).png().toBuffer();

  // Save to public directory
  fs.writeFileSync('public/icon-512.png', icon512Buf);
  fs.writeFileSync('public/icon-192.png', icon192Buf);
  fs.writeFileSync('public/apple-touch-icon.png', appleTouchBuf);
  fs.writeFileSync('public/favicon-48x48.png', fav48Buf);
  fs.writeFileSync('public/favicon-32x32.png', fav32Buf);
  fs.writeFileSync('public/favicon-16x16.png', fav16Buf);

  // Generate multi-resolution ICO file with 16, 32, 48
  const icoBuffers = [fav16Buf, fav32Buf, fav48Buf];
  const icoSizes = [16, 32, 48];
  const numImages = icoBuffers.length;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon type (1 = icon)
  header.writeUInt16LE(numImages, 4);

  const dirEntries = [];
  let offset = 6 + numImages * 16;

  for (let i = 0; i < numImages; i++) {
    const size = icoSizes[i];
    const buf = icoBuffers[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0); // width
    entry.writeUInt8(size, 1); // height
    entry.writeUInt8(0, 2);    // color count
    entry.writeUInt8(0, 3);    // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // size of image data
    entry.writeUInt32LE(offset, 12); // offset
    dirEntries.push(entry);
    offset += buf.length;
  }

  const icoFile = Buffer.concat([header, ...dirEntries, ...icoBuffers]);
  fs.writeFileSync('public/favicon.ico', icoFile);

  console.log('Successfully generated public/favicon.ico and PNG icons!');
}

generateIcons().catch((err) => {
  console.error('Failed generating icons:', err);
  process.exit(1);
});

