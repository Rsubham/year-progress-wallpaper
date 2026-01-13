const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');

export default function handler(req, res) {
  // ---------------------------------------------------------
  // 1. ROBUST FONT LOADING (The Fix)
  // ---------------------------------------------------------
  // We try to find the font in __dirname (standard) first.
  // If that fails, we look in process.cwd() (Vercel root).
  let fontLoaded = false;
  
  try {
    const possiblePaths = [
      path.join(__dirname, 'font.ttf'),             // Standard local path
      path.join(process.cwd(), 'api', 'font.ttf'),  // Vercel Serverless root
      path.join(process.cwd(), 'font.ttf')          // Root fallback
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        GlobalFonts.register(fs.readFileSync(p), 'MyFont');
        fontLoaded = true;
        break;
      }
    }
  } catch (e) {
    console.error("Font load failed:", e);
  }

  // ---------------------------------------------------------
  // 2. SETUP & ARGS
  // ---------------------------------------------------------
  const width = parseInt(req.query.w) || 1206;
  const height = parseInt(req.query.h) || 2622;
  const name = req.query.name || "R Subham";

  const conf = {
    bg: "#000000",          // Pure Black
    past: "#ffffff",        // White
    today: "#f97316",       // Orange
    future: "#27272a",      // Dark Grey
    cols: 15,
    dotSize: 40,
    gap: 24
  };

  // ---------------------------------------------------------
  // 3. DATE MATH (IST)
  // ---------------------------------------------------------
  const nowUtc = new Date();
  const utcOffset = nowUtc.getTime() + (nowUtc.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 60 * 60 * 1000; 
  const now = new Date(utcOffset + istOffset);

  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const oneDay = 1000 * 60 * 60 * 24;
  
  const dayOfYear = Math.floor((now - start) / oneDay) + 1;
  const totalDays = Math.floor((end - start) / oneDay);
  const daysLeft = totalDays - dayOfYear;
  const percent = Math.round((dayOfYear / totalDays) * 100);

  // ---------------------------------------------------------
  // 4. DRAWING
  // ---------------------------------------------------------
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = conf.bg;
  ctx.fillRect(0, 0, width, height);

  // Grid Stats
  const totalRows = Math.ceil(totalDays / conf.cols);
  const gridWidth = (conf.cols * conf.dotSize) + ((conf.cols - 1) * conf.gap);
  const gridHeight = (totalRows * conf.dotSize) + ((totalRows - 1) * conf.gap);
  
  let startX = (width - gridWidth) / 2;
  // Offset set to 190px as requested
  let startY = ((height - gridHeight) / 2) + 190;

  let x = startX;
  let y = startY;

  for (let i = 1; i <= totalDays; i++) {
    if (i < dayOfYear) ctx.fillStyle = conf.past;
    else if (i === dayOfYear) ctx.fillStyle = conf.today;
    else ctx.fillStyle = conf.future;

    ctx.beginPath();
    ctx.arc(x + conf.dotSize/2, y + conf.dotSize/2, conf.dotSize/2, 0, Math.PI * 2);
    ctx.fill();

    x += conf.dotSize + conf.gap;
    if (i % conf.cols === 0) {
      x = startX;
      y += conf.dotSize + conf.gap;
    }
  }

  // ---------------------------------------------------------
  // 5. DRAW TEXT (Safe Mode)
  // ---------------------------------------------------------
  const textStartY = startY + gridHeight + 110;
  
  // If font loaded, use 'MyFont'. If not, fallback to 'sans-serif' so it doesn't crash.
  const fontName = fontLoaded ? 'MyFont' : 'sans-serif';
  const fontSize = 36;
  ctx.font = `${fontSize}px ${fontName}`;
  ctx.textAlign = 'center'; 

  // Helper function for colored text
  function drawColoredLine(textSegments, yPos) {
    let totalWidth = 0;
    textSegments.forEach(seg => {
      totalWidth += ctx.measureText(seg.text).width;
    });

    let currentX = (width - totalWidth) / 2;

    textSegments.forEach(seg => {
      ctx.fillStyle = seg.color;
      ctx.textAlign = 'left'; 
      ctx.fillText(seg.text, currentX, yPos);
      currentX += ctx.measureText(seg.text).width;
    });
  }

  // LINE 1: "Name, 4% of 2026 has been completed."
  const line1 = [
    { text: `${name}, `, color: "#d4d4d8" },      // Grey
    { text: `${percent}%`, color: conf.today },   // Orange
    { text: ` of `, color: "#d4d4d8" },           // Grey
    { text: `${year}`, color: conf.today },       // Orange
    { text: ` has been completed.`, color: "#d4d4d8" } // Grey
  ];
  drawColoredLine(line1, textStartY);

  // LINE 2: "351 days left"
  const line2 = [
    { text: `${daysLeft}`, color: conf.today },   // Orange
    { text: ` days left`, color: "#d4d4d8" }      // Grey
  ];
  drawColoredLine(line2, textStartY + 50); 

  // Output
  const buffer = canvas.toBuffer('image/png');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=60'); 
  res.send(buffer);
}
