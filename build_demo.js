const fs = require('fs');

const heroPoints = fs.readFileSync('hero-points.js', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const start = app.indexOf('/* ── Частицы на первом экране');
const next = app.indexOf('/* ──', start + 10);
const particleCode = app.substring(start, next);

const html = `<!DOCTYPE html>
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
` + heroPoints + `
  </script>
  <script>
` + particleCode + `
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
</html>`;

fs.writeFileSync('particle-animation-demo.html', html, 'utf8');
console.log('Successfully updated particle-animation-demo.html!');
