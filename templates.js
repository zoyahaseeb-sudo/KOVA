/*
 * Kova's blueprint library. No AI, no network calls, no third party of any
 * kind - every app below is hand-written code that ships as-is. matchRecipe()
 * does simple keyword scoring against the viewer's description and picks the
 * best-fitting blueprint; recipes may read a number or word out of the
 * description to personalize themselves (timer length, dice sides, etc).
 */

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function firstNumber(text, fallback) {
  const m = text.match(/\d+/);
  return m ? parseInt(m[0], 10) : fallback;
}

const RECIPES = [
  {
    id: "pomodoro",
    name: "Focus timer",
    blurb: "a pomodoro-style countdown with a progress ring",
    keywords: ["pomodoro", "focus timer", "timer", "countdown", "study timer", "work timer"],
    build(promptText) {
      const minutes = Math.min(180, Math.max(1, firstNumber(promptText, 25)));
      const totalSeconds = minutes * 60;
      return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Focus Timer</title>
<style>
  :root { --accent:#d9601b; --bg:#1c1712; --surface:#28211a; --text:#f4ece0; --dim:#a8987e; }
  * { box-sizing:border-box; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
    background:var(--bg); color:var(--text); font-family:-apple-system,Segoe UI,sans-serif; }
  .card { text-align:center; padding:36px; }
  h1 { font-size:14px; text-transform:uppercase; letter-spacing:.14em; color:var(--dim); margin:0 0 22px; font-weight:600; }
  .ring-wrap { position:relative; width:260px; height:260px; margin:0 auto 26px; }
  svg { transform:rotate(-90deg); }
  circle.track { fill:none; stroke:var(--surface); stroke-width:12; }
  circle.prog { fill:none; stroke:var(--accent); stroke-width:12; stroke-linecap:round;
    transition: stroke-dashoffset 1s linear; }
  .time { position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    font-size:52px; font-variant-numeric:tabular-nums; font-weight:600; }
  .controls { display:flex; gap:10px; justify-content:center; }
  button { font:inherit; font-weight:600; font-size:14px; padding:11px 22px; border-radius:8px;
    border:1px solid var(--surface); background:var(--surface); color:var(--text); cursor:pointer; }
  button.primary { background:var(--accent); border-color:var(--accent); color:#1a0f04; }
  button:active { transform:translateY(1px); }
  .mode { margin-top:16px; font-size:12px; color:var(--dim); letter-spacing:.05em; }
</style>
</head>
<body>
  <div class="card">
    <h1>Focus Session</h1>
    <div class="ring-wrap">
      <svg width="260" height="260">
        <circle class="track" cx="130" cy="130" r="114"></circle>
        <circle class="prog" id="ring" cx="130" cy="130" r="114"></circle>
      </svg>
      <div class="time" id="time">${String(minutes).padStart(2, "0")}:00</div>
    </div>
    <div class="controls">
      <button class="primary" id="toggle">Start</button>
      <button id="reset">Reset</button>
    </div>
    <div class="mode" id="mode">${minutes} minute session</div>
  </div>
<script>
  const total = ${totalSeconds};
  const ring = document.getElementById('ring');
  const timeEl = document.getElementById('time');
  const toggleBtn = document.getElementById('toggle');
  const resetBtn = document.getElementById('reset');
  const modeEl = document.getElementById('mode');
  const circumference = 2 * Math.PI * 114;
  ring.style.strokeDasharray = circumference;
  ring.style.strokeDashoffset = 0;

  let remaining = total;
  let running = false;
  let timer = null;
  let onBreak = false;

  function render() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    timeEl.textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
    const frac = remaining / (onBreak ? 300 : total);
    ring.style.strokeDashoffset = circumference * (1 - frac);
  }

  function tick() {
    remaining--;
    if (remaining < 0) {
      onBreak = !onBreak;
      remaining = onBreak ? 300 : total;
      modeEl.textContent = onBreak ? 'Break — 5 minutes' : '${minutes} minute session';
      if ('vibrate' in navigator) navigator.vibrate(200);
    }
    render();
  }

  toggleBtn.addEventListener('click', () => {
    running = !running;
    toggleBtn.textContent = running ? 'Pause' : 'Start';
    if (running) { timer = setInterval(tick, 1000); }
    else { clearInterval(timer); }
  });

  resetBtn.addEventListener('click', () => {
    clearInterval(timer);
    running = false; onBreak = false; remaining = total;
    toggleBtn.textContent = 'Start';
    modeEl.textContent = '${minutes} minute session';
    render();
  });

  render();
</script>
</body>
</html>`;
    },
  },

  {
    id: "stopwatch",
    name: "Stopwatch",
    blurb: "a stopwatch with lap times",
    keywords: ["stopwatch", "lap timer", "lap times", "chronometer"],
    build() {
      return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Stopwatch</title>
<style>
  :root { --accent:#d9601b; --bg:#1c1712; --surface:#28211a; --text:#f4ece0; --dim:#a8987e; }
  * { box-sizing:border-box; }
  body { margin:0; min-height:100vh; background:var(--bg); color:var(--text);
    font-family:-apple-system,Segoe UI,sans-serif; display:flex; flex-direction:column; align-items:center; padding:40px 20px; }
  .display { font-size:56px; font-variant-numeric:tabular-nums; font-weight:700; margin:20px 0 26px; }
  .display .ms { font-size:28px; color:var(--dim); }
  .controls { display:flex; gap:10px; margin-bottom:28px; }
  button { font:inherit; font-weight:600; font-size:14px; padding:11px 22px; border-radius:8px;
    border:1px solid var(--surface); background:var(--surface); color:var(--text); cursor:pointer; }
  button.primary { background:var(--accent); border-color:var(--accent); color:#1a0f04; }
  ol { list-style:none; margin:0; padding:0; width:100%; max-width:320px; }
  li { display:flex; justify-content:space-between; padding:10px 4px; border-bottom:1px solid var(--surface);
    font-variant-numeric:tabular-nums; font-size:14px; color:var(--dim); }
  li span:first-child { color:var(--text); }
</style>
</head>
<body>
  <div class="display" id="display">00:00<span class="ms">.00</span></div>
  <div class="controls">
    <button class="primary" id="toggle">Start</button>
    <button id="lap">Lap</button>
    <button id="reset">Reset</button>
  </div>
  <ol id="laps"></ol>
<script>
  const display = document.getElementById('display');
  const toggleBtn = document.getElementById('toggle');
  const lapBtn = document.getElementById('lap');
  const resetBtn = document.getElementById('reset');
  const lapsEl = document.getElementById('laps');
  let running = false, startTime = 0, elapsed = 0, raf = null, lapCount = 0;

  function plainFormat(ms) {
    const total = Math.floor(ms / 10);
    const m = Math.floor(total / 6000);
    const s = Math.floor((total % 6000) / 100);
    const cs = total % 100;
    return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0') + '.' + String(cs).padStart(2,'0');
  }
  function format(ms) {
    const plain = plainFormat(ms);
    const dot = plain.lastIndexOf('.');
    return plain.slice(0, dot) + '<span class="ms">' + plain.slice(dot) + '</span>';
  }

  function loop() {
    display.innerHTML = format(elapsed + (performance.now() - startTime));
    raf = requestAnimationFrame(loop);
  }

  toggleBtn.addEventListener('click', () => {
    running = !running;
    if (running) {
      startTime = performance.now();
      toggleBtn.textContent = 'Stop';
      loop();
    } else {
      elapsed += performance.now() - startTime;
      cancelAnimationFrame(raf);
      toggleBtn.textContent = 'Start';
    }
  });

  lapBtn.addEventListener('click', () => {
    if (!running) return;
    lapCount++;
    const li = document.createElement('li');
    const now = elapsed + (performance.now() - startTime);
    const lapLabel = document.createElement('span');
    lapLabel.textContent = 'Lap ' + lapCount;
    const lapTime = document.createElement('span');
    lapTime.textContent = plainFormat(now);
    li.appendChild(lapLabel);
    li.appendChild(lapTime);
    lapsEl.prepend(li);
  });

  resetBtn.addEventListener('click', () => {
    running = false; elapsed = 0; lapCount = 0;
    cancelAnimationFrame(raf);
    toggleBtn.textContent = 'Start';
    display.innerHTML = format(0);
    lapsEl.innerHTML = '';
  });
</script>
</body>
</html>`;
    },
  },

  {
    id: "counter",
    name: "Tally counter",
    blurb: "a click counter with a reset and a step size",
    keywords: ["counter", "click counter", "tally", "clicker", "count up"],
    build(promptText) {
      const label = /\b(reps|pushups|push-ups|steps|glasses|cups|laps)\b/i.exec(promptText);
      const title = label ? label[0][0].toUpperCase() + label[0].slice(1) : "Count";
      return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)} Counter</title>
<style>
  :root { --accent:#d9601b; --bg:#1c1712; --surface:#28211a; --text:#f4ece0; --dim:#a8987e; }
  * { box-sizing:border-box; }
  body { margin:0; min-height:100vh; background:var(--bg); color:var(--text);
    font-family:-apple-system,Segoe UI,sans-serif; display:flex; flex-direction:column;
    align-items:center; justify-content:center; gap:22px; }
  h1 { font-size:13px; text-transform:uppercase; letter-spacing:.14em; color:var(--dim); margin:0; font-weight:600; }
  .count { font-size:96px; font-weight:800; font-variant-numeric:tabular-nums; }
  .row { display:flex; gap:12px; align-items:center; }
  button { font:inherit; font-weight:700; border-radius:50%; width:64px; height:64px; font-size:26px;
    border:1px solid var(--surface); background:var(--surface); color:var(--text); cursor:pointer; }
  button.primary { background:var(--accent); border-color:var(--accent); color:#1a0f04; }
  .reset { border-radius:8px; width:auto; height:auto; padding:10px 18px; font-size:13px; margin-top:6px; }
  .step { font-size:12px; color:var(--dim); }
  input { width:44px; text-align:center; background:var(--surface); border:1px solid var(--surface); color:var(--text);
    border-radius:6px; padding:4px; font:inherit; }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="count" id="count">0</div>
  <div class="row">
    <button id="dec">&minus;</button>
    <button class="primary" id="inc">+</button>
  </div>
  <div class="step">step <input id="step" type="number" value="1" min="1" /></div>
  <button class="reset" id="reset">Reset</button>
<script>
  let n = 0;
  const countEl = document.getElementById('count');
  const stepEl = document.getElementById('step');
  function step() { return Math.max(1, parseInt(stepEl.value, 10) || 1); }
  document.getElementById('inc').addEventListener('click', () => { n += step(); countEl.textContent = n; });
  document.getElementById('dec').addEventListener('click', () => { n -= step(); countEl.textContent = n; });
  document.getElementById('reset').addEventListener('click', () => { n = 0; countEl.textContent = n; });
</script>
</body>
</html>`;
    },
  },

  {
    id: "tictactoe",
    name: "Tic-tac-toe",
    blurb: "a two-player tic-tac-toe board",
    keywords: ["tic-tac-toe", "tic tac toe", "noughts and crosses", "xo game", "x and o"],
    build() {
      return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Tic-Tac-Toe</title>
<style>
  :root { --accent:#d9601b; --bg:#1c1712; --surface:#28211a; --text:#f4ece0; --dim:#a8987e; }
  * { box-sizing:border-box; }
  body { margin:0; min-height:100vh; background:var(--bg); color:var(--text);
    font-family:-apple-system,Segoe UI,sans-serif; display:flex; flex-direction:column;
    align-items:center; justify-content:center; gap:20px; }
  h1 { font-size:13px; text-transform:uppercase; letter-spacing:.14em; color:var(--dim); margin:0; font-weight:600; }
  #status { font-size:15px; font-weight:600; min-height:20px; }
  .board { display:grid; grid-template-columns:repeat(3, 88px); grid-template-rows:repeat(3, 88px); gap:8px; }
  .cell { background:var(--surface); border-radius:10px; display:flex; align-items:center; justify-content:center;
    font-size:40px; font-weight:800; cursor:pointer; color:var(--accent); user-select:none; }
  .cell:empty:hover { background:#332a1f; }
  button { font:inherit; font-weight:600; font-size:13px; padding:10px 18px; border-radius:8px;
    border:1px solid var(--surface); background:var(--surface); color:var(--text); cursor:pointer; }
</style>
</head>
<body>
  <h1>Tic-Tac-Toe</h1>
  <div id="status">X's turn</div>
  <div class="board" id="board"></div>
  <button id="reset">New game</button>
<script>
  const boardEl = document.getElementById('board');
  const statusEl = document.getElementById('status');
  let cells = Array(9).fill('');
  let turn = 'X';
  let over = false;
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

  function render() {
    boardEl.innerHTML = '';
    cells.forEach((v, i) => {
      const d = document.createElement('div');
      d.className = 'cell';
      d.textContent = v;
      d.addEventListener('click', () => play(i));
      boardEl.appendChild(d);
    });
  }

  function checkWin() {
    for (const [a,b,c] of wins) {
      if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) return cells[a];
    }
    return cells.every(c => c) ? 'draw' : null;
  }

  function play(i) {
    if (over || cells[i]) return;
    cells[i] = turn;
    const result = checkWin();
    if (result) {
      over = true;
      statusEl.textContent = result === 'draw' ? "It's a draw" : result + ' wins!';
    } else {
      turn = turn === 'X' ? 'O' : 'X';
      statusEl.textContent = turn + "'s turn";
    }
    render();
  }

  document.getElementById('reset').addEventListener('click', () => {
    cells = Array(9).fill(''); turn = 'X'; over = false;
    statusEl.textContent = "X's turn";
    render();
  });

  render();
</script>
</body>
</html>`;
    },
  },

  {
    id: "palette",
    name: "Color palette generator",
    blurb: "a random palette generator with hex codes and copy",
    keywords: ["color palette", "palette generator", "color scheme", "colour palette", "hex codes"],
    build() {
      return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Palette Generator</title>
<style>
  :root { --bg:#1c1712; --surface:#28211a; --text:#f4ece0; --dim:#a8987e; }
  * { box-sizing:border-box; }
  body { margin:0; min-height:100vh; background:var(--bg); color:var(--text);
    font-family:-apple-system,Segoe UI,sans-serif; display:flex; flex-direction:column; }
  header { padding:20px 24px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
  h1 { font-size:13px; text-transform:uppercase; letter-spacing:.14em; color:var(--dim); margin:0; font-weight:600; }
  button { font:inherit; font-weight:600; font-size:13px; padding:10px 18px; border-radius:8px;
    border:1px solid var(--surface); background:var(--surface); color:var(--text); cursor:pointer; }
  .swatches { flex:1; display:flex; min-height:320px; }
  .swatch { flex:1; display:flex; align-items:flex-end; justify-content:center; padding-bottom:18px;
    cursor:pointer; position:relative; }
  .hex { background:rgba(0,0,0,.35); color:#fff; padding:6px 12px; border-radius:6px; font-size:13px;
    font-family:ui-monospace,monospace; letter-spacing:.03em; }
  .copied::after { content:'copied'; position:absolute; top:14px; left:50%; transform:translateX(-50%);
    background:rgba(0,0,0,.5); color:#fff; font-size:11px; padding:3px 9px; border-radius:5px; }
</style>
</head>
<body>
  <header>
    <h1>Palette</h1>
    <button id="shuffle">Shuffle</button>
  </header>
  <div class="swatches" id="swatches"></div>
<script>
  const wrap = document.getElementById('swatches');

  function randHex() {
    const h = Math.floor(Math.random() * 360);
    const s = 55 + Math.floor(Math.random() * 30);
    const l = 40 + Math.floor(Math.random() * 30);
    return hslToHex(h, s, l);
  }
  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = x => Math.round(255 * x).toString(16).padStart(2, '0');
    return '#' + toHex(f(0)) + toHex(f(8)) + toHex(f(4));
  }

  function render() {
    wrap.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const color = randHex();
      const div = document.createElement('div');
      div.className = 'swatch';
      div.style.background = color;
      div.innerHTML = '<span class="hex">' + color + '</span>';
      div.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(color); } catch (e) {}
        div.classList.add('copied');
        setTimeout(() => div.classList.remove('copied'), 900);
      });
      wrap.appendChild(div);
    }
  }

  document.getElementById('shuffle').addEventListener('click', render);
  render();
</script>
</body>
</html>`;
    },
  },

  {
    id: "todo",
    name: "Todo list",
    blurb: "a checklist with add, complete, and delete",
    keywords: ["todo", "to-do", "to do list", "checklist", "task list", "shopping list"],
    build(promptText) {
      const shopping = /shopping|grocery/i.test(promptText);
      const title = shopping ? "Shopping List" : "To-Do";
      return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<style>
  :root { --accent:#d9601b; --bg:#1c1712; --surface:#28211a; --text:#f4ece0; --dim:#a8987e; }
  * { box-sizing:border-box; }
  body { margin:0; min-height:100vh; background:var(--bg); color:var(--text);
    font-family:-apple-system,Segoe UI,sans-serif; display:flex; justify-content:center; padding:50px 20px; }
  .card { width:100%; max-width:380px; }
  h1 { font-size:13px; text-transform:uppercase; letter-spacing:.14em; color:var(--dim); margin:0 0 16px; font-weight:600; }
  form { display:flex; gap:8px; margin-bottom:16px; }
  input[type=text] { flex:1; background:var(--surface); border:1px solid var(--surface); color:var(--text);
    padding:11px 12px; border-radius:8px; font:inherit; font-size:14px; }
  button[type=submit] { background:var(--accent); border:none; color:#1a0f04; font-weight:700; font-size:20px;
    width:42px; border-radius:8px; cursor:pointer; }
  ul { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px; }
  li { display:flex; align-items:center; gap:10px; background:var(--surface); padding:11px 12px; border-radius:8px; }
  li span { flex:1; font-size:14px; }
  li.done span { text-decoration:line-through; color:var(--dim); }
  li button { background:none; border:none; color:var(--dim); font-size:16px; cursor:pointer; }
  .empty { color:var(--dim); font-size:13px; padding:10px 2px; }
</style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(title)}</h1>
    <form id="form">
      <input id="input" type="text" placeholder="Add an item…" autocomplete="off" />
      <button type="submit">+</button>
    </form>
    <ul id="list"></ul>
  </div>
<script>
  const form = document.getElementById('form');
  const input = document.getElementById('input');
  const list = document.getElementById('list');
  let items = [];

  function render() {
    list.innerHTML = '';
    if (!items.length) {
      const p = document.createElement('div');
      p.className = 'empty';
      p.textContent = 'Nothing here yet.';
      list.appendChild(p);
      return;
    }
    items.forEach((item, i) => {
      const li = document.createElement('li');
      if (item.done) li.classList.add('done');
      const span = document.createElement('span');
      span.textContent = item.text;
      span.addEventListener('click', () => { item.done = !item.done; render(); });
      const del = document.createElement('button');
      del.textContent = '✕';
      del.addEventListener('click', () => { items.splice(i, 1); render(); });
      li.appendChild(span); li.appendChild(del);
      list.appendChild(li);
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value.trim();
    if (!v) return;
    items.push({ text: v, done: false });
    input.value = '';
    render();
  });

  render();
</script>
</body>
</html>`;
    },
  },

  {
    id: "calculator",
    name: "Calculator",
    blurb: "a working calculator with the standard operators",
    keywords: ["calculator", "calc"],
    build() {
      return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Calculator</title>
<style>
  :root { --accent:#d9601b; --bg:#1c1712; --surface:#28211a; --text:#f4ece0; --dim:#a8987e; }
  * { box-sizing:border-box; }
  body { margin:0; min-height:100vh; background:var(--bg); color:var(--text);
    font-family:-apple-system,Segoe UI,sans-serif; display:flex; align-items:center; justify-content:center; }
  .calc { width:300px; background:var(--surface); border-radius:16px; padding:16px; }
  .display { text-align:right; font-size:40px; font-variant-numeric:tabular-nums; padding:20px 10px;
    word-break:break-all; min-height:56px; }
  .grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:8px; }
  button { font:inherit; font-size:18px; padding:18px 0; border-radius:10px; border:none; cursor:pointer;
    background:#332a1f; color:var(--text); }
  button.op { background:var(--accent); color:#1a0f04; font-weight:700; }
  button.wide { grid-column:span 2; }
  button:active { filter:brightness(1.15); }
</style>
</head>
<body>
  <div class="calc">
    <div class="display" id="display">0</div>
    <div class="grid" id="grid"></div>
  </div>
<script>
  const displayEl = document.getElementById('display');
  const grid = document.getElementById('grid');
  const keys = ['C','±','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','='];
  let expr = '';

  function draw() {
    grid.innerHTML = '';
    keys.forEach(k => {
      const b = document.createElement('button');
      b.textContent = k;
      if ('÷×−+='.includes(k)) b.classList.add('op');
      if (k === '0') b.classList.add('wide');
      b.addEventListener('click', () => press(k));
      grid.appendChild(b);
    });
  }

  function press(k) {
    if (k === 'C') { expr = ''; }
    else if (k === '=') {
      try {
        const safe = expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/%/g,'/100');
        if (!/^[0-9+\\-*/.() ]+$/.test(safe)) throw new Error('bad');
        expr = String(Function('"use strict";return (' + safe + ')')());
      } catch (e) { expr = 'Error'; }
    }
    else if (k === '±') {
      expr = expr.startsWith('-') ? expr.slice(1) : '-' + expr;
    }
    else { expr += k; }
    displayEl.textContent = expr || '0';
  }

  draw();
</script>
</body>
</html>`;
    },
  },

  {
    id: "dice",
    name: "Dice roller",
    blurb: "a dice roller with adjustable sides and count",
    keywords: ["dice", "die roller", "roll a die", "d20", "d6"],
    build(promptText) {
      const validSides = [4, 6, 8, 10, 12, 20];
      const sidesMatch = promptText.match(/d(\d{1,3})/i);
      const parsedSides = sidesMatch ? parseInt(sidesMatch[1], 10) : 6;
      const sides = validSides.includes(parsedSides) ? parsedSides : 6;
      return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Dice Roller</title>
<style>
  :root { --accent:#d9601b; --bg:#1c1712; --surface:#28211a; --text:#f4ece0; --dim:#a8987e; }
  * { box-sizing:border-box; }
  body { margin:0; min-height:100vh; background:var(--bg); color:var(--text);
    font-family:-apple-system,Segoe UI,sans-serif; display:flex; flex-direction:column;
    align-items:center; justify-content:center; gap:22px; }
  h1 { font-size:13px; text-transform:uppercase; letter-spacing:.14em; color:var(--dim); margin:0; font-weight:600; }
  .dice-row { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; max-width:360px; }
  .die { width:74px; height:74px; background:var(--surface); border-radius:14px; display:flex;
    align-items:center; justify-content:center; font-size:30px; font-weight:800; color:var(--accent); }
  .die.rolling { animation:spin .5s ease; }
  @keyframes spin { from { transform:rotate(0deg) scale(.9); } to { transform:rotate(360deg) scale(1); } }
  .controls { display:flex; gap:10px; align-items:center; }
  select, input { background:var(--surface); border:1px solid var(--surface); color:var(--text);
    padding:9px; border-radius:8px; font:inherit; font-size:13px; }
  button { font:inherit; font-weight:700; font-size:14px; padding:12px 22px; border-radius:8px;
    border:none; background:var(--accent); color:#1a0f04; cursor:pointer; }
  .total { font-size:13px; color:var(--dim); }
</style>
</head>
<body>
  <h1>Dice Roller</h1>
  <div class="dice-row" id="diceRow"></div>
  <div class="total" id="total"></div>
  <div class="controls">
    <label>Dice <input id="count" type="number" value="2" min="1" max="8" style="width:50px;"/></label>
    <label>Sides
      <select id="sides">
        <option value="4">d4</option>
        <option value="6" selected>d6</option>
        <option value="8">d8</option>
        <option value="10">d10</option>
        <option value="12">d12</option>
        <option value="20">d20</option>
      </select>
    </label>
    <button id="roll">Roll</button>
  </div>
<script>
  document.getElementById('sides').value = '${sides}';
  const row = document.getElementById('diceRow');
  const totalEl = document.getElementById('total');
  const countEl = document.getElementById('count');
  const sidesEl = document.getElementById('sides');

  function roll() {
    const count = Math.max(1, Math.min(8, parseInt(countEl.value, 10) || 1));
    const sides = parseInt(sidesEl.value, 10);
    row.innerHTML = '';
    let total = 0;
    for (let i = 0; i < count; i++) {
      const val = 1 + Math.floor(Math.random() * sides);
      total += val;
      const d = document.createElement('div');
      d.className = 'die rolling';
      d.textContent = val;
      row.appendChild(d);
    }
    totalEl.textContent = 'Total: ' + total;
  }

  document.getElementById('roll').addEventListener('click', roll);
  roll();
</script>
</body>
</html>`;
    },
  },

  {
    id: "quotes",
    name: "Random quote generator",
    blurb: "a quote generator with a curated offline collection",
    keywords: ["quote generator", "random quote", "inspirational quote", "quote of the day"],
    build() {
      return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Quote Generator</title>
<style>
  :root { --accent:#d9601b; --bg:#1c1712; --surface:#28211a; --text:#f4ece0; --dim:#a8987e; }
  * { box-sizing:border-box; }
  body { margin:0; min-height:100vh; background:var(--bg); color:var(--text);
    font-family:-apple-system,Segoe UI,sans-serif; display:flex; align-items:center; justify-content:center; padding:30px; }
  .card { max-width:480px; text-align:center; }
  blockquote { font-size:26px; line-height:1.4; margin:0 0 18px; font-weight:600; }
  blockquote::before { content:'"'; color:var(--accent); }
  blockquote::after { content:'"'; color:var(--accent); }
  cite { color:var(--dim); font-style:normal; font-size:14px; display:block; margin-bottom:26px; }
  button { font:inherit; font-weight:600; font-size:14px; padding:11px 22px; border-radius:8px;
    border:none; background:var(--accent); color:#1a0f04; cursor:pointer; }
</style>
</head>
<body>
  <div class="card">
    <blockquote id="q"></blockquote>
    <cite id="a"></cite>
    <button id="next">Another one</button>
  </div>
<script>
  const quotes = [
    ["The only way to do great work is to love what you do.", "Steve Jobs"],
    ["Simplicity is the ultimate sophistication.", "Leonardo da Vinci"],
    ["Well done is better than well said.", "Benjamin Franklin"],
    ["What you get by achieving your goals is not as important as what you become by achieving your goals.", "Zig Ziglar"],
    ["It does not matter how slowly you go as long as you do not stop.", "Confucius"],
    ["Whether you think you can or you think you can't, you're right.", "Henry Ford"],
    ["The best time to plant a tree was 20 years ago. The second best time is now.", "Chinese Proverb"],
    ["Quality is not an act, it is a habit.", "Aristotle"],
    ["Make it simple, but significant.", "Don Draper"],
    ["Done is better than perfect.", "Sheryl Sandberg"],
  ];
  const qEl = document.getElementById('q');
  const aEl = document.getElementById('a');
  let last = -1;
  function show() {
    let i;
    do { i = Math.floor(Math.random() * quotes.length); } while (i === last && quotes.length > 1);
    last = i;
    qEl.textContent = quotes[i][0];
    aEl.textContent = '— ' + quotes[i][1];
  }
  document.getElementById('next').addEventListener('click', show);
  show();
</script>
</body>
</html>`;
    },
  },

  {
    id: "password",
    name: "Password generator",
    blurb: "a password generator with adjustable length and character sets",
    keywords: ["password generator", "random password", "passphrase", "generate password"],
    build(promptText) {
      const length = Math.min(64, Math.max(6, firstNumber(promptText, 16)));
      return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Password Generator</title>
<style>
  :root { --accent:#d9601b; --bg:#1c1712; --surface:#28211a; --text:#f4ece0; --dim:#a8987e; }
  * { box-sizing:border-box; }
  body { margin:0; min-height:100vh; background:var(--bg); color:var(--text);
    font-family:-apple-system,Segoe UI,sans-serif; display:flex; align-items:center; justify-content:center; padding:30px; }
  .card { width:100%; max-width:380px; }
  h1 { font-size:13px; text-transform:uppercase; letter-spacing:.14em; color:var(--dim); margin:0 0 18px; font-weight:600; }
  .output { background:var(--surface); border-radius:8px; padding:16px; font-family:ui-monospace,monospace;
    font-size:17px; word-break:break-all; margin-bottom:16px; display:flex; justify-content:space-between; gap:10px; align-items:center; }
  .output button { background:none; border:none; color:var(--dim); cursor:pointer; font-size:16px; flex-shrink:0; }
  label { display:flex; justify-content:space-between; align-items:center; font-size:13px; color:var(--dim);
    padding:8px 0; border-bottom:1px solid var(--surface); }
  input[type=range] { width:150px; }
  .primary { width:100%; margin-top:16px; font:inherit; font-weight:700; font-size:14px; padding:13px;
    border-radius:8px; border:none; background:var(--accent); color:#1a0f04; cursor:pointer; }
</style>
</head>
<body>
  <div class="card">
    <h1>Password Generator</h1>
    <div class="output"><span id="out">—</span><button id="copy">Copy</button></div>
    <label>Length <span id="lenVal">${length}</span>
      <input id="len" type="range" min="6" max="64" value="${length}" />
    </label>
    <label>Uppercase <input id="upper" type="checkbox" checked /></label>
    <label>Numbers <input id="numbers" type="checkbox" checked /></label>
    <label>Symbols <input id="symbols" type="checkbox" checked /></label>
    <button class="primary" id="generate">Generate</button>
  </div>
<script>
  const outEl = document.getElementById('out');
  const lenEl = document.getElementById('len');
  const lenVal = document.getElementById('lenVal');
  const upperEl = document.getElementById('upper');
  const numbersEl = document.getElementById('numbers');
  const symbolsEl = document.getElementById('symbols');

  lenEl.addEventListener('input', () => lenVal.textContent = lenEl.value);

  function generate() {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    let pool = lower;
    if (upperEl.checked) pool += lower.toUpperCase();
    if (numbersEl.checked) pool += '0123456789';
    if (symbolsEl.checked) pool += '!@#\$%^&*()-_=+';
    const len = parseInt(lenEl.value, 10);
    const bytes = new Uint32Array(len);
    crypto.getRandomValues(bytes);
    let out = '';
    for (let i = 0; i < len; i++) out += pool[bytes[i] % pool.length];
    outEl.textContent = out;
  }

  document.getElementById('generate').addEventListener('click', generate);
  document.getElementById('copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(outEl.textContent); } catch (e) {}
  });
  generate();
</script>
</body>
</html>`;
    },
  },
];

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasKeyword(lower, keyword) {
  const pattern = new RegExp("\\b" + escapeRegExp(keyword) + "\\b");
  return pattern.test(lower);
}

function matchRecipe(promptText) {
  const lower = promptText.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const recipe of RECIPES) {
    let score = 0;
    for (const kw of recipe.keywords) {
      if (hasKeyword(lower, kw)) score += kw.split(" ").length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = recipe;
    }
  }
  return best;
}
