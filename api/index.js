const { createCanvas } = require('@napi-rs/canvas');

export default function handler(req, res) {
  // 1. Dimensions (iPhone 16 Pro)
  const width = parseInt(req.query.w) || 1206;
  const height = parseInt(req.query.h) || 2622;
  
  // 2. Visual Config
  const conf = {
    bg: "#000000",          // PURE BLACK
    past: "#ffffff",        // White
    today: "#f97316",       // Orange-500
    future: "#27272a",      // Zinc-800
    cols: 15,               // 15 Columns
    dotSize: 40,            // Increased slightly (was 38)
    gap: 24                 // Gap kept tight
  };

  // 3. Date Math (Indian Standard Time)
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

  // 4. Setup Canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = conf.bg;
  ctx.fillRect(0, 0, width, height);

  // 5. Grid Calculations
  const totalRows = Math.ceil(totalDays / conf.cols);
  const gridWidth = (conf.cols * conf.dotSize) + ((conf.cols - 1) * conf.gap);
  const gridHeight = (totalRows * conf.dotSize) + ((totalRows - 1) * conf.gap);
  
  // Center Horizontally
  let startX = (width - gridWidth) / 2;
  
  // Vertically: Center it, then push it DOWN by 240px to clear the clock
  let startY = ((height - gridHeight) / 2) + 240;

  let x = startX;
  let y = startY;

  // 6. Draw Grid
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

  // 7. Draw Text
  const textY = startY + gridHeight + 140; 
  ctx.font = '50px sans-serif'; 
  
  const text1 = `${daysLeft}d left`;
  const text2 = ` • ${percent}%`;
  
  ctx.textAlign = 'left';
  const w1 = ctx.measureText(text1).width;
  const w2 = ctx.measureText(text2).width;
  const totalW = w1 + w2;
  
  let tx = (width - totalW) / 2;
  
  // Orange Part
  ctx.fillStyle = conf.today; 
  ctx.fillText(text1, tx, textY);
  
  // Grey Part
  ctx.fillStyle = "#71717a"; 
  ctx.fillText(text2, tx + w1, textY);

  // 8. Return Image
  const buffer = canvas.toBuffer('image/png');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=60'); 
  res.send(buffer);
}
