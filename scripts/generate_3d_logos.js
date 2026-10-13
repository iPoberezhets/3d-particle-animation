const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// PNG Decoder (pure JS + zlib)
function decodePNG(buf) {
  let offset = 8, width, height;
  const idats = [];
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.slice(offset + 4, offset + 8).toString('ascii');
    const data = buf.slice(offset + 8, offset + 8 + len);
    offset += 12 + len;
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
    } else if (type === 'IDAT') {
      idats.push(data);
    }
  }
  const decomp = zlib.inflateSync(Buffer.concat(idats));
  const bpp = 4, stride = width * bpp;
  const pixels = Buffer.alloc(width * height * 4);
  let srcPos = 0, prevRow = Buffer.alloc(stride);

  function paeth(a, b, c) {
    const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
  }

  for (let y = 0; y < height; y++) {
    const filter = decomp[srcPos++];
    const row = pixels.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const raw = decomp[srcPos++];
      const left = x >= bpp ? row[x - bpp] : 0, up = prevRow[x], upLeft = x >= bpp ? prevRow[x - bpp] : 0;
      let val = raw;
      if (filter === 1) val = (raw + left) & 0xff;
      else if (filter === 2) val = (raw + up) & 0xff;
      else if (filter === 3) val = (raw + Math.floor((left + up) / 2)) & 0xff;
      else if (filter === 4) val = (raw + paeth(left, up, upLeft)) & 0xff;
      row[x] = val;
    }
    prevRow = row;
  }
  return { width, height, data: pixels };
}

// Sample 2600 points from image using Furthest Point Sampling (FPS)
function samplePointsFromPNG(pngPath, targetCount = 2600) {
  console.log(`Processing ${pngPath}...`);
  const img = decodePNG(fs.readFileSync(pngPath));
  
  // Adaptive step for high-resolution images
  const step = (img.width > 800 || img.height > 800) ? 2 : 1;
  const candidatesX = [];
  const candidatesY = [];
  let minX = img.width, maxX = 0, minY = img.height, maxY = 0;

  for (let y = 0; y < img.height; y += step) {
    for (let x = 0; x < img.width; x += step) {
      const idx = (y * img.width + x) * 4;
      const alpha = img.data[idx + 3];
      if (alpha > 45) {
        candidatesX.push(x);
        candidatesY.push(y);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const numCandidates = candidatesX.length;
  console.log(`  Found ${numCandidates} candidate pixels (alpha > 45, step ${step})`);
  console.log(`  Bounds: [${minX}..${maxX}], [${minY}..${maxY}]`);

  // Furthest Point Sampling
  const selectedIndices = new Int32Array(targetCount);
  const minDist = new Float32Array(numCandidates);
  minDist.fill(1e9);

  // Pick start point at center of mass
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  let firstIdx = 0, minCenterDist = 1e9;
  for (let j = 0; j < numCandidates; j++) {
    const d = (candidatesX[j] - midX)**2 + (candidatesY[j] - midY)**2;
    if (d < minCenterDist) {
      minCenterDist = d;
      firstIdx = j;
    }
  }

  selectedIndices[0] = firstIdx;
  let lastChosen = firstIdx;

  for (let i = 1; i < targetCount; i++) {
    const lx = candidatesX[lastChosen];
    const ly = candidatesY[lastChosen];
    let maxDist = -1;
    let nextChosen = 0;

    for (let j = 0; j < numCandidates; j++) {
      const dx = candidatesX[j] - lx;
      const dy = candidatesY[j] - ly;
      const d2 = dx * dx + dy * dy;
      if (d2 < minDist[j]) minDist[j] = d2;
      if (minDist[j] > maxDist) {
        maxDist = minDist[j];
        nextChosen = j;
      }
    }

    selectedIndices[i] = nextChosen;
    lastChosen = nextChosen;
  }

  // Scale and center into 0..255 byte coords
  const maxDim = Math.max(maxX - minX + 1, maxY - minY + 1);
  const scale = 208; // scale within ~24..232 out of 255 (consistent with other logos)

  const rawBytes = Buffer.alloc(targetCount * 3);
  for (let i = 0; i < targetCount; i++) {
    const idx = selectedIndices[i];
    const x = candidatesX[idx];
    const y = candidatesY[idx];

    const normX = (x - midX) / maxDim;
    const normY = (y - midY) / maxDim;

    const bx = Math.max(0, Math.min(255, Math.round(128 + normX * scale)));
    const by = Math.max(0, Math.min(255, Math.round(128 + normY * scale)));

    rawBytes[i * 3] = bx;
    rawBytes[i * 3 + 1] = by;
    rawBytes[i * 3 + 2] = 0; // color index 0
  }

  const base64 = rawBytes.toString('base64');
  console.log(`  Sampled ${targetCount} points, base64 length: ${base64.length}`);
  return {
    p: base64,
    c: [[0, 0, 0]]
  };
}

// 1. Generate points for logo1 and logo2
const logo1Data = samplePointsFromPNG('logo1.png', 2600);
const logo2Data = samplePointsFromPNG('logo2.png', 2600);

// 2. Update hero-points.js
const heroPointsContent = fs.readFileSync('hero-points.js', 'utf8');
const lines = heroPointsContent.split('\n');
const line3 = lines[2].trim();
if (!line3.startsWith('var D=')) {
  throw new Error('Unexpected line 3 format in hero-points.js');
}
const D = JSON.parse(line3.slice(6, -1));

D['logo1'] = logo1Data;
D['logo2'] = logo2Data;
D['Logo 1'] = logo1Data;
D['Logo 2'] = logo2Data;

lines[2] = 'var D=' + JSON.stringify(D) + ';';
fs.writeFileSync('hero-points.js', lines.join('\n'), 'utf8');
console.log('Updated hero-points.js successfully with logo1 and logo2!');

// 3. Update app.js
let appContent = fs.readFileSync('app.js', 'utf8');

// Update order array
if (appContent.includes('var order=["AI Native","OpenAI"')) {
  appContent = appContent.replace(
    'var order=["AI Native","OpenAI","Claude","Cursor","Grok","Алиса","GigaChat"];',
    'var order=["AI Native","logo1","logo2","OpenAI","Claude","Cursor","Grok","Алиса","GigaChat"];'
  );
} else if (!appContent.includes('"logo1"')) {
  appContent = appContent.replace(/var order=\[.*?\];/, 'var order=["AI Native","logo1","logo2","OpenAI","Claude","Cursor","Grok","Алиса","GigaChat"];');
}

// Update click and notification listeners
if (!appContent.includes('cv.addEventListener(\'click\'')) {
  appContent = appContent.replace(
    'if(!(window.matchMedia&&matchMedia(\'(max-width:680px)\').matches))window.addEventListener(\'pointermove\',onMove,{passive:true});',
    'if(!(window.matchMedia&&matchMedia(\'(max-width:680px)\').matches))window.addEventListener(\'pointermove\',onMove,{passive:true});\n  cv.addEventListener(\'click\',function(){ hold=0; idx=(idx+1)%order.length; assign(order[idx]); if(window.__onLogoChange) window.__onLogoChange(order[idx]); });\n  window.addEventListener(\'switchLogo\',function(e){ var i=order.indexOf(e.detail); if(i!==-1){ idx=i; hold=0; assign(order[idx]); if(window.__onLogoChange) window.__onLogoChange(order[idx]); } });'
  );
}

// Remove automatic timer switching
appContent = appContent.replace(
  /if\s*\(!reduce\)\s*\{\s*hold\+\+;[\s\S]*?requestAnimationFrame\(frame\);\s*\}\s*\}/,
  'if(!reduce){ requestAnimationFrame(frame); } }'
);

fs.writeFileSync('app.js', appContent, 'utf8');
console.log('Updated app.js successfully!');

// 4. Update build_demo.js to enhance particle-animation-demo.html
const demoBuilder = `const fs = require('fs');

const heroPoints = fs.readFileSync('hero-points.js', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const start = app.indexOf('/* ── Частицы на первом экране');
const next = app.indexOf('/* ──', start + 10);
const particleCode = app.substring(start, next);

const html = \`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Native Conf - 3D Анимация логотипов</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(80% 70% at 90% 2%, rgba(255, 107, 69, 0.04), transparent 40%),
                  radial-gradient(130% 120% at 28% 42%, #0f0f12 0%, transparent 62%),
                  #070709;
      color: #ece7dc;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
      font-family: system-ui, -apple-system, sans-serif;
      user-select: none;
    }
    #pcv {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
      cursor: pointer;
    }
    .top-bar {
      position: fixed;
      top: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 6px;
      z-index: 20;
      background: rgba(18, 18, 24, 0.75);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      padding: 6px 10px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      max-width: 90vw;
    }
    .logo-btn {
      background: transparent;
      border: none;
      color: rgba(236, 231, 220, 0.65);
      padding: 6px 14px;
      font-size: 13px;
      font-weight: 500;
      border-radius: 999px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .logo-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }
    .logo-btn.active {
      color: #070709;
      background: #ece7dc;
      font-weight: 600;
      box-shadow: 0 2px 10px rgba(255, 255, 255, 0.2);
    }
    .logo-btn.highlight {
      border: 1px solid rgba(255, 107, 69, 0.4);
    }
    .logo-btn.highlight.active {
      background: #ff6b45;
      color: #fff;
    }
    .hint {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      color: rgba(236, 231, 220, 0.45);
      font-size: 13px;
      pointer-events: none;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      z-index: 10;
      text-align: center;
      text-shadow: 0 2px 8px rgba(0,0,0,0.8);
    }
  </style>
</head>
<body>
  <div class="top-bar" id="logoBar"></div>
  <canvas id="pcv"></canvas>
  <div class="hint">Вращайте курсором в 3D • Кликните по холсту или кнопкам для переключения</div>

  <script>
\` + heroPoints + \`
  </script>
  <script>
\` + particleCode + \`
  </script>
  <script>
    (function(){
      var bar = document.getElementById('logoBar');
      var order = ["AI Native","logo1","logo2","OpenAI","Claude","Cursor","Grok","Алиса","GigaChat"];
      var buttons = {};
      order.forEach(function(name){
        var btn = document.createElement('button');
        btn.className = 'logo-btn' + (name.startsWith('logo') ? ' highlight' : '');
        btn.textContent = name;
        btn.onclick = function(){
          window.dispatchEvent(new CustomEvent('switchLogo', { detail: name }));
        };
        bar.appendChild(btn);
        buttons[name] = btn;
      });

      function updateActive(name) {
        order.forEach(function(n){
          if(buttons[n]) {
            if(n === name) buttons[n].classList.add('active');
            else buttons[n].classList.remove('active');
          }
        });
      }

      window.__onLogoChange = function(name){ updateActive(name); };
      updateActive("AI Native");
    })();
  </script>
</body>
</html>\`;

fs.writeFileSync('particle-animation-demo.html', html, 'utf8');
console.log('Successfully updated particle-animation-demo.html!');
`;

fs.writeFileSync('build_demo.js', demoBuilder, 'utf8');

// 5. Run build_demo.js
require('../build_demo.js');

// 6. Ensure js/ and css/ directories exist for ainative_index.html
if (!fs.existsSync('js')) fs.mkdirSync('js');
if (!fs.existsSync('css')) fs.mkdirSync('css');

fs.copyFileSync('app.js', path.join('js', 'app.js'));
fs.copyFileSync('hero-points.js', path.join('js', 'hero-points.js'));
fs.copyFileSync('style.css', path.join('css', 'style.css'));
console.log('Synced js/app.js, js/hero-points.js, and css/style.css!');
