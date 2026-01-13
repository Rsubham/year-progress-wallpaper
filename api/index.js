const { createCanvas } = require('@napi-rs/canvas');

export default function handler(req, res) {
  // 1. Get dimensions
  const width = parseInt(req.query.w) || 1206;
  const height = parseInt(req.query.h) || 2622;
  
  // 2. Configuration
  const conf = {
    bg: "#1c1c1e",
    past: "#ffffff",
    today: "#ff6f00",
    future: "#2c2c2e",
    cols: 15,
    dotSize: 32,
    gap: 20,
    marginTop: 600
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

  // Background
  ctx.fillStyle = conf.bg;
  ctx.fillRect(0, 0, width, height);

  // 5. Draw Grid
  const totalW = (conf.cols * conf.dotSize) + ((conf.cols - 1) * conf.gap);
  const startX = (width - totalW) / 2;
  let x = startX;
  let y = conf.marginTop;

  for (let i = 1; i <= totalDays; i++) {
    if (i < dayOfYear) ctx.fillStyle = conf.past;
    else if (i === dayOfYear) ctx.fillStyle = conf.today;
    else ctx.fillStyle = conf.future;

    ctx.beginPath();
    // @napi-rs/canvas works slightly differently with arcs, but this is standard 2D API
    ctx.arc(x + conf.dotSize/2, y + conf.dotSize/2, conf.dotSize/2, 0, Math.PI * 2);
    ctx.fill();

    x += conf.dotSize + conf.gap;
    if (i % conf.cols === 0) {
      x = startX;
      y += conf.dotSize + conf.gap;
    }
  }

  // 6. Draw Text
  y += 100;
  ctx.fillStyle = conf.today;
  // Font loading is tricky in serverless, but simple generic fonts often work
  ctx.font = '40px sans-serif'; 
  ctx.textAlign = 'center';
  ctx.fillText(`${daysLeft}d left • ${percent}%`, width / 2, y);

  // 7. Return Image
  const buffer = canvas.toBuffer('image/png');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=3600'); 
  res.send(buffer);
}
