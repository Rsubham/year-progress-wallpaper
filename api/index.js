const { createCanvas } = require('@napi-rs/canvas');

export default function handler(req, res) {
  // 1. Setup Dimensions (iPhone 16 Pro)
  const width = parseInt(req.query.w) || 1206;
  const height = parseInt(req.query.h) || 2622;
  
  // 2. Configuration (Refined for bold look)
  const conf = {
    bg: "#18181b",          // Zinc-900
    past: "#ffffff",        // White
    today: "#f97316",       // Orange-500
    future: "#27272a",      // Zinc-800
    cols: 13,               // Fixed 13 columns
    dotSize: 46,            // LARGE dots
    gap: 26                 // Tighter gap
  };

  // 3. Date Math
  const now = new Date();
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

  // Draw Background
  ctx.fillStyle = conf.bg;
  ctx.fillRect(0, 0, width, height);

  // 5. Calculate Grid Dimensions for Centering
  const totalRows = Math.ceil(totalDays / conf.cols);
  const gridWidth = (conf.cols * conf.dotSize) + ((conf.cols - 1) * conf.gap);
  const gridHeight = (totalRows * conf.dotSize) + ((totalRows - 1) * conf.gap);
  
  // Center Position
  let startX = (width - gridWidth) / 2;
  let startY = (height - gridHeight) / 2;

  // Shift up slightly to make room for text at bottom
  startY = startY - 40; 

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

  // 7. Draw Text (Bold & Large)
  const textY = startY + gridHeight + 160; // Space below grid
  ctx.font = '65px sans-serif'; // Much larger font
  
  // Measure Text for centering
  const text1 = `${daysLeft}d left`;
  const text2 = ` • ${percent}%`;
  
  // We need total width to center the group
  ctx.textAlign = 'left';
  const w1 = ctx.measureText(text1).width;
  const w2 = ctx.measureText(text2).width;
  const totalTextW = w1 + w2;
  
  let textStart = (width - totalTextW) / 2;
  
  // Draw Orange Part
  ctx.fillStyle = conf.today; 
  ctx.fillText(text1, textStart, textY);
  
  // Draw Grey Part
  ctx.fillStyle = "#71717a"; 
  ctx.fillText(text2, textStart + w1, textY);

  // 8. Return Image
  const buffer = canvas.toBuffer('image/png');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=3600'); 
  res.send(buffer);
}
