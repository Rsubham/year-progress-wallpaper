const { createCanvas } = require('@napi-rs/canvas');

export default function handler(req, res) {
  // 1. Setup Dimensions (iPhone 16 Pro default)
  const width = parseInt(req.query.w) || 1206;
  const height = parseInt(req.query.h) || 2622;
  
  // 2. Configuration (Matched to your reference image)
  const conf = {
    bg: "#18181b",          // Slightly lighter dark grey (Zinc-900)
    past: "#ffffff",        // White
    today: "#f97316",       // Orange (Orange-500)
    future: "#27272a",      // Dark Grey (Zinc-800)
    cols: 13,               // Reference image has exactly 13 columns
    dotSize: 34,            // Slightly larger dots
    gap: 38                 // Wider gap for the airy look
  };

  // 3. Date Math
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const oneDay = 1000 * 60 * 60 * 24;
  
  const dayOfYear = Math.floor((now - start) / oneDay) + 1;
  const totalDays = Math.floor((end - start) / oneDay); // 365 or 366
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
  
  // Calculate Start Positions (Center the grid)
  let startX = (width - gridWidth) / 2;
  let startY = (height - gridHeight) / 2;

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

    // Move to next position
    x += conf.dotSize + conf.gap;
    if (i % conf.cols === 0) {
      x = startX;
      y += conf.dotSize + conf.gap;
    }
  }

  // 7. Draw Text (Split Colors)
  const textY = startY + gridHeight + 120; // 120px below the grid
  ctx.font = '40px sans-serif';
  ctx.textAlign = 'center';

  // We need to measure text to center two different colors
  const text1 = `${daysLeft}d left`;
  const text2 = ` • ${percent}%`;
  const totalTextWidth = ctx.measureText(text1 + text2).width;
  
  // Draw Part 1 (Orange)
  ctx.textAlign = 'left';
  let textStart = (width - totalTextWidth) / 2;
  
  ctx.fillStyle = conf.today; // Orange
  ctx.fillText(text1, textStart, textY);
  
  // Draw Part 2 (Grey)
  const part1Width = ctx.measureText(text1).width;
  ctx.fillStyle = "#71717a"; // Light Grey
  ctx.fillText(text2, textStart + part1Width, textY);

  // 8. Return Image
  const buffer = canvas.toBuffer('image/png');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=3600'); 
  res.send(buffer);
}
