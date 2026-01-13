const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');

export default function handler(req, res) {
  // ---------------------------------------------------------
  // 1. LOAD FONT (CRITICAL FIX)
  // ---------------------------------------------------------
  // We register the font file you uploaded so Vercel can see it
  const fontPath = path.join(__dirname, 'font.ttf');
  GlobalFonts.registerFromPath(fontPath, 'MyFont');

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
    cols: 15,               // 15 Columns
    dotSize: 40,            // Dot Size
    gap: 24                 // Gap
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

  // Background
  ctx.fillStyle = conf.bg;
  ctx.fillRect(0, 0, width, height);

  // Grid Stats
  const totalRows = Math.ceil(totalDays / conf.cols);
  const gridWidth = (conf.cols * conf.dotSize) + ((conf.cols - 1) * conf.gap);
  const gridHeight = (totalRows * conf.dotSize) + ((totalRows - 1) * conf.gap);
  
  // Positioning (210px Offset)
  let startX = (width - gridWidth) / 2;
  let startY = ((height - gridHeight) / 2) + 210;

  // Draw Dots
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
  // 5. DRAW TEXT (Now using 'MyFont')
  // ---------------------------------------------------------
  const textY = startY + gridHeight + 110; 
  
  // CRITICAL: Use the font name we registered above
  ctx.font = '50px MyFont'; 
  
  const text1 = `${daysLeft}d left`;
  const text2 = ` • ${percent}%`;
  
  ctx.textAlign = 'left';
  const w1 = ctx.measureText(text1).width;
  const w2 = ctx.measureText(text2).width;
  const totalW = w1 + w2;
  
  let tx = (width - totalW) / 2;
  
  // Draw Part 1 (Orange)
  ctx.fillStyle = conf.today; 
  ctx.fillText(text1, tx, textY);
  
  // Draw Part 2 (Grey)
  ctx.fillStyle = "#71717a"; 
  ctx.fillText(text2, tx + w1, textY);

  // Draw Personalized Text
  const subText = `${name} you have completed ${percent}% of ${year}. ${daysLeft} days left`;
  
  ctx.font = '32px MyFont'; // Use custom font here too
  ctx.fillStyle = "#d4d4d8"; // Light Grey
  ctx.textAlign = 'center';
  
  ctx.fillText(subText, width / 2, textY + 50);

  // Output
  const buffer = canvas.toBuffer('image/png');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=60'); 
  res.send(buffer);
}
