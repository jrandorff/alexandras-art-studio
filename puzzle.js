/* Axolotl Puzzle — earn pieces by drawing, assemble a mystery axolotl.
   Real interlocking jigsaw pieces, drawn as SVG clip paths. Touch + mouse. */

"use strict";

const PZ_KEY = "aas_puzzle_v1";
const GRID = 6;                       // 6 x 6 = 36 pieces
const PIECES = GRID * GRID;
const PER_DRAWING = 4;                // 4 pieces per drawing => 9 drawings per puzzle
const TABF = 0.22;                    // tab size as a fraction of a cell

let pz = null;      // state
let cellPx = 60;    // computed on render
let uid = 0;        // unique clipPath ids
let selected = null;

/* ---------- state ---------- */

function pzLoad() {
  try { pz = JSON.parse(localStorage.getItem(PZ_KEY)); } catch { pz = null; }
  if (!pz || typeof pz.puzzle !== "number") {
    pz = { puzzle: 0, unlocked: [], placed: [], bank: 0, done: [], awarded: [] };
  }
  pz.unlocked ||= []; pz.placed ||= []; pz.done ||= []; pz.awarded ||= []; pz.bank ||= 0;
  return pz;
}
function pzSave() { try { localStorage.setItem(PZ_KEY, JSON.stringify(pz)); } catch {} }

/* deterministic shuffle/tabs so a puzzle looks identical on every device + reload */
function rng(seed) {
  let a = seed * 1831565813 + 0x9e3779b9;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* tab layout for the current puzzle: hE[r][c] = piece(r,c) bottom edge dir */
function tabLayout(seed) {
  const r = rng(seed + 7), hE = [], vE = [];
  for (let i = 0; i < GRID; i++) {
    hE.push([]); vE.push([]);
    for (let j = 0; j < GRID; j++) {
      hE[i].push(r() < 0.5 ? 1 : -1);
      vE[i].push(r() < 0.5 ? 1 : -1);
    }
  }
  return { hE, vE };
}
function pieceTabs(lay, r, c) {
  return {
    top: r === 0 ? 0 : -lay.hE[r - 1][c],
    right: c === GRID - 1 ? 0 : lay.vE[r][c],
    bottom: r === GRID - 1 ? 0 : lay.hE[r][c],
    left: c === 0 ? 0 : -lay.vE[r][c - 1],
  };
}

/* ---------- piece geometry ---------- */

// cubic control points of one tabbed edge, in (along, perpendicular) unit space
const TAB_PTS = [
  [0.25, 0.00], [0.38, 0.00], [0.40, 0.03],
  [0.31, 0.13], [0.31, 0.27], [0.50, 0.27],
  [0.69, 0.27], [0.69, 0.13], [0.60, 0.03],
  [0.62, 0.00], [0.75, 0.00], [1.00, 0.00],
];

function edgeSeg(O, A, P, dir, C) {
  const f = (x, y) => `${x.toFixed(2)},${y.toFixed(2)}`;
  if (!dir) return `L ${f(O[0] + A[0] * C, O[1] + A[1] * C)}`;
  const q = TAB_PTS.map(([a, p]) => [
    O[0] + A[0] * a * C + P[0] * p * C * dir,
    O[1] + A[1] * a * C + P[1] * p * C * dir,
  ]);
  const s = (i) => f(q[i][0], q[i][1]);
  return `C ${s(0)} ${s(1)} ${s(2)} C ${s(3)} ${s(4)} ${s(5)} C ${s(6)} ${s(7)} ${s(8)} C ${s(9)} ${s(10)} ${s(11)}`;
}

function piecePath(tabs, C, T) {
  const a = T, b = T + C;
  return [
    `M ${a},${a}`,
    edgeSeg([a, a], [1, 0], [0, -1], tabs.top, C),
    edgeSeg([b, a], [0, 1], [1, 0], tabs.right, C),
    edgeSeg([b, b], [-1, 0], [0, 1], tabs.bottom, C),
    edgeSeg([a, b], [0, -1], [-1, 0], tabs.left, C),
    "Z",
  ].join(" ");
}

/* one piece as a standalone <svg> string */
function pieceSVG(idx, lay, cardHref, C, T, cls) {
  const r = Math.floor(idx / GRID), c = idx % GRID;
  const box = C + 2 * T;
  const d = piecePath(pieceTabs(lay, r, c), C, T);
  const id = `cp${++uid}`;
  return `<svg class="${cls}" data-idx="${idx}" width="${box}" height="${box}" viewBox="0 0 ${box} ${box}">
    <defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs>
    <image href="${cardHref}" x="${T - c * C}" y="${T - r * C}" width="${C * GRID}" height="${C * GRID}"
           clip-path="url(#${id})" preserveAspectRatio="none"/>
    <path d="${d}" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="1.2"/>
  </svg>`;
}

/* ---------- rendering ---------- */

function pzRender() {
  const view = document.getElementById("view-puzzle");
  if (!view) return;
  pzLoad();

  const wrap = document.getElementById("pz-boardwrap");
  if (!wrap.clientWidth) return;   // tab not visible yet; render when it opens
  const avail = Math.min(wrap.clientWidth, 430);
  cellPx = Math.floor(avail / GRID);
  const T = Math.round(cellPx * TABF);
  const board = cellPx * GRID;
  const lay = tabLayout(pz.puzzle);
  const href = cardURL(pz.puzzle);

  // board: empty cells + placed pieces
  const cells = [];
  for (let i = 0; i < PIECES; i++) {
    const r = Math.floor(i / GRID), c = i % GRID;
    cells.push(`<div class="pz-cell" data-idx="${i}" style="left:${c * cellPx}px;top:${r * cellPx}px;width:${cellPx}px;height:${cellPx}px"></div>`);
  }
  const placedHTML = pz.placed.map((i) => {
    const r = Math.floor(i / GRID), c = i % GRID;
    return `<div class="pz-placed" style="left:${c * cellPx - T}px;top:${r * cellPx - T}px">${pieceSVG(i, lay, href, cellPx, T, "pz-svg")}</div>`;
  }).join("");

  document.getElementById("pz-board").innerHTML = cells.join("") + placedHTML;
  Object.assign(document.getElementById("pz-board").style, { width: board + "px", height: board + "px" });

  // tray: unlocked but not placed
  const tray = pz.unlocked.filter((i) => !pz.placed.includes(i));
  document.getElementById("pz-tray").innerHTML = tray.length
    ? tray.map((i) => `<div class="pz-traypiece" data-idx="${i}">${pieceSVG(i, lay, href, cellPx, T, "pz-svg")}</div>`).join("")
    : `<p class="pz-empty">${pz.placed.length === PIECES ? "" : "No pieces waiting — draw along with a video to earn 4 more! 🎨"}</p>`;

  // progress
  const got = pz.unlocked.length, need = Math.ceil((PIECES - got) / PER_DRAWING);
  document.getElementById("pz-progress").innerHTML =
    `<b>${pz.placed.length}</b> of ${PIECES} pieces placed · <b>${got}</b> earned` +
    (need > 0 ? ` · ${need} more drawing${need === 1 ? "" : "s"} to unlock them all` : " · all pieces earned!") +
    (pz.bank ? ` · ${pz.bank} banked for the next one` : "");

  renderCollection();
  if (pz.placed.length === PIECES) showFinish();
}

function renderCollection() {
  const el = document.getElementById("pz-collection");
  if (!pz.done.length) {
    el.innerHTML = `<p class="pz-empty">No axolotls collected yet — finish a puzzle to start your collection! 🩷</p>`;
    return;
  }
  el.innerHTML = pz.done.map((m) =>
    `<figure class="pz-card"><img src="${cardURL(m)}" alt="${MORPHS[m % MORPHS.length].name}">
     <figcaption>${MORPHS[m % MORPHS.length].name}</figcaption></figure>`).join("");
}

/* ---------- earning ---------- */

/* unlock n random still-locked pieces; anything that doesn't fit is banked */
function grantPieces(n) {
  const left = [];
  for (let i = 0; i < PIECES; i++) if (!pz.unlocked.includes(i)) left.push(i);
  const r = rng(pz.puzzle * 101 + pz.unlocked.length);
  const won = [];
  while (n > 0 && left.length) {
    won.push(left.splice(Math.floor(r() * left.length), 1)[0]);
    n--;
  }
  pz.bank += n;                       // puzzle already full: save for the next one
  pz.unlocked.push(...won);
  pzSave();
  pzRender();
  return won.length;
}

function pzAward(videoId) {
  pzLoad();
  if (videoId && pz.awarded.includes(videoId)) return { ok: false, why: "already" };
  if (videoId) pz.awarded.push(videoId);
  const banked = pz.bank;
  pz.bank = 0;
  return { ok: true, won: grantPieces(PER_DRAWING + banked) };
}

/* ---------- interaction: drag, or tap-then-tap ---------- */

function cellFromPoint(x, y) {
  const b = document.getElementById("pz-board").getBoundingClientRect();
  if (x < b.left || x > b.right || y < b.top || y > b.bottom) return -1;
  const c = Math.floor((x - b.left) / cellPx), r = Math.floor((y - b.top) / cellPx);
  return r * GRID + c;
}

function place(idx) {
  if (pz.placed.includes(idx)) return;
  pz.placed.push(idx);
  pzSave();
  selected = null;
  pzRender();
  const el = document.querySelector(`.pz-placed [data-idx="${idx}"]`);
  if (el) { el.classList.add("pz-pop"); setTimeout(() => el.classList.remove("pz-pop"), 400); }
}

function wireDrag() {
  const tray = document.getElementById("pz-tray");
  let ghost = null, startX = 0, startY = 0, dragIdx = -1, moved = false;

  tray.addEventListener("pointerdown", (e) => {
    const p = e.target.closest(".pz-traypiece");
    if (!p) return;
    dragIdx = +p.dataset.idx; startX = e.clientX; startY = e.clientY; moved = false;
    ghost = p.cloneNode(true);
    ghost.className = "pz-ghost";
    document.body.appendChild(ghost);
    moveGhost(e.clientX, e.clientY);
    p.classList.add("pz-lifted");
    try { tray.setPointerCapture(e.pointerId); } catch {}
  });

  tray.addEventListener("pointermove", (e) => {
    if (!ghost) return;
    if (Math.abs(e.clientX - startX) > 6 || Math.abs(e.clientY - startY) > 6) moved = true;
    if (moved) { e.preventDefault(); moveGhost(e.clientX, e.clientY); }
  });

  tray.addEventListener("pointerup", (e) => {
    if (!ghost) return;
    ghost.remove(); ghost = null;
    document.querySelectorAll(".pz-lifted").forEach((n) => n.classList.remove("pz-lifted"));
    if (moved) {
      if (cellFromPoint(e.clientX, e.clientY) === dragIdx) place(dragIdx);
      else nudge(dragIdx);
    } else {
      selected = selected === dragIdx ? null : dragIdx;  // tap to select
      document.querySelectorAll(".pz-traypiece").forEach((n) =>
        n.classList.toggle("pz-sel", +n.dataset.idx === selected));
    }
    dragIdx = -1;
  });

  tray.addEventListener("pointercancel", () => {
    if (ghost) { ghost.remove(); ghost = null; }
    document.querySelectorAll(".pz-lifted").forEach((n) => n.classList.remove("pz-lifted"));
  });

  // tap-to-place (accessible alternative to dragging on a small screen)
  document.getElementById("pz-board").addEventListener("click", (e) => {
    if (selected === null) return;
    const cell = e.target.closest(".pz-cell");
    if (cell && +cell.dataset.idx === selected) place(selected);
    else nudge(selected);
  });

  function moveGhost(x, y) {
    const r = ghost.getBoundingClientRect();
    ghost.style.transform = `translate(${x - r.width / 2}px, ${y - r.height / 2}px)`;
  }
  function nudge(idx) {
    const el = document.querySelector(`.pz-traypiece[data-idx="${idx}"]`);
    if (el) { el.classList.add("pz-shake"); setTimeout(() => el.classList.remove("pz-shake"), 400); }
  }
}

/* ---------- completion ---------- */

function showFinish() {
  const m = MORPHS[pz.puzzle % MORPHS.length];
  document.getElementById("pz-finish-img").src = cardURL(pz.puzzle);
  document.getElementById("pz-finish-name").textContent = m.name + " Axolotl";
  document.getElementById("pz-finish-fact").textContent = m.fact;
  document.getElementById("pz-finish").classList.add("open");
}

function nextPuzzle() {
  pz.done.push(pz.puzzle);
  pz.puzzle = pz.done.length % MORPHS.length;
  pz.unlocked = []; pz.placed = [];
  pzSave();
  document.getElementById("pz-finish").classList.remove("open");
  const carry = pz.bank;
  pz.bank = 0;
  pzSave();
  if (carry > 0) grantPieces(carry);   // pieces earned ahead go straight onto the new puzzle
  else pzRender();
}
