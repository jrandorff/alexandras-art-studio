/* Alexandra's Art Studio — app logic. Plain JS, no build step, no accounts.
   Data lives in videos.json / prompts.json / supplies.json so the content
   can be edited without touching code. */

"use strict";

const $ = (sel) => document.querySelector(sel);

const LS_FAVS = "aas_favs_v1";
const LS_SUPPLIES = "aas_supplies_v2"; // values: "have" | "need" (unset = neither)

let VIDEOS = [];   // {id, t (title), c (channel index)}
let CHANNELS = []; // channel display names
let PROMPTS = { subjects: [], twists: [], settings: [], daily: [] };
const LS_REMOVED = "aas_removed_v1"; // baseline favorites she has un-hearted on this device

let favs = load(LS_FAVS, []);
let removedBaseline = load(LS_REMOVED, []);
let baselineFavs = []; // "family favorites" shipped with the site (family-state.json)
let supplyState = load(LS_SUPPLIES, null);
if (!supplyState) {
  // migrate v1 checkboxes: checked meant "have it"
  const v1 = load("aas_supplies_v1", {});
  supplyState = {};
  for (const k in v1) if (v1[k]) supplyState[k] = "have";
  save(LS_SUPPLIES, supplyState);
}
let shopMode = false;
let supplyNames = {}; // id -> short name, for Idea Machine suggestions

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

/* ---------------- tabs ---------------- */

document.querySelectorAll("nav button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("nav button").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    btn.classList.add("active");
    $("#view-" + btn.dataset.view).classList.add("active");
    window.scrollTo(0, 0);
  });
});

/* ---------------- videos: search + favorites ---------------- */

const MAX_RESULTS = 48;

function videoById(id) {
  return VIDEOS.find((v) => v.id === id);
}

/* favorites = site-shipped family favorites (minus ones un-hearted here) + this device's own */
function effectiveFavs() {
  const seen = new Set();
  const out = [];
  [...baselineFavs.filter((id) => !removedBaseline.includes(id)), ...favs].forEach((id) => {
    if (!seen.has(id)) { seen.add(id); out.push(id); }
  });
  return out;
}

function isFaved(id) {
  return effectiveFavs().includes(id);
}

function cardHTML(v) {
  const faved = isFaved(v.id);
  return `
    <div class="vcard" data-id="${v.id}">
      <img loading="lazy" src="https://i.ytimg.com/vi/${v.id}/mqdefault.jpg" alt="">
      <div class="vtitle">${escapeHTML(v.t)}</div>
      <div class="vchan">${escapeHTML(CHANNELS[v.c] || "")}</div>
      <button class="heart ${faved ? "faved" : ""}" aria-label="favorite">🩷</button>
    </div>`;
}

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

function renderFavs() {
  const favVideos = effectiveFavs().map(videoById).filter(Boolean);
  $("#favs-grid").innerHTML = favVideos.map(cardHTML).join("");
  $("#favs-empty").style.display = favVideos.length ? "none" : "block";
  $("#backup-favs").style.display = favVideos.length ? "inline" : "none";
}

// alternate results between channels so no channel can crowd the other out of
// the first page (the index lists whole channels back-to-back)
function interleave(list) {
  const groups = new Map();
  list.forEach((v) => {
    if (!groups.has(v.c)) groups.set(v.c, []);
    groups.get(v.c).push(v);
  });
  const gs = [...groups.values()];
  const out = [];
  for (let i = 0; gs.some((g) => i < g.length); i++)
    for (const g of gs) if (i < g.length) out.push(g[i]);
  return out;
}

function search(query) {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  return VIDEOS.filter((v) => {
    const t = v.t.toLowerCase();
    return tokens.every((tok) => t.includes(tok));
  });
}

function renderResults() {
  const q = $("#search").value.trim();
  let list, label;
  if (q) {
    list = search(q);
    label = list.length ? `🔎 Results for “${q}”` : `😢 Nothing found for “${q}” — try another word!`;
  } else {
    list = VIDEOS.filter((v) => v.t.toLowerCase().includes("axolotl"));
    label = "🩷 Axolotl picks";
  }
  // searching takes over the screen; favorites come back when the box is cleared
  $("#favs-section").style.display = q ? "none" : "";
  const shown = interleave(list).slice(0, MAX_RESULTS);
  $("#results-label").textContent = label;
  $("#results-grid").innerHTML = shown.map(cardHTML).join("");
  $("#more-note").textContent =
    list.length > MAX_RESULTS ? `Showing ${MAX_RESULTS} of ${list.length} — add another word to narrow it down!` : "";
}

let searchTimer;
$("#search").addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(renderResults, 150);
});

/* card taps: heart toggles favorite, anywhere else opens the player */
document.addEventListener("click", (e) => {
  const heart = e.target.closest(".heart");
  if (heart) {
    const id = heart.closest(".vcard").dataset.id;
    if (isFaved(id)) {
      favs = favs.filter((f) => f !== id);
      if (baselineFavs.includes(id) && !removedBaseline.includes(id)) removedBaseline.push(id);
    } else {
      if (!favs.includes(id)) favs.push(id);
      removedBaseline = removedBaseline.filter((r) => r !== id);
    }
    save(LS_FAVS, favs);
    save(LS_REMOVED, removedBaseline);
    renderFavs();
    renderResults();
    return;
  }
  const card = e.target.closest(".vcard");
  if (card) openPlayer(card.dataset.id);
});

$("#backup-favs").addEventListener("click", (e) => {
  e.stopPropagation();
  const data = JSON.stringify(effectiveFavs().map(videoById).filter(Boolean), null, 2);
  navigator.clipboard?.writeText(data).then(
    () => { e.target.textContent = "copied! ✔️"; setTimeout(() => (e.target.textContent = "copy my list"), 2000); },
    () => alert(data)
  );
});

/* ---------------- player ---------------- */

function openPlayer(id) {
  const v = videoById(id);
  if (!v) return;
  $("#player-title").textContent = v.t;
  // rel=0 keeps end-of-video suggestions within the same channel
  $("#frame-wrap").innerHTML =
    `<iframe src="https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1"
       title="${escapeHTML(v.t)}"
       allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen
       referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  $("#player-modal").classList.add("open");
}

function closePlayer() {
  $("#frame-wrap").innerHTML = ""; // removing the iframe stops playback
  $("#player-modal").classList.remove("open");
}

$("#player-close").addEventListener("click", closePlayer);
$("#player-modal").addEventListener("click", (e) => {
  if (e.target === $("#player-modal")) closePlayer();
});

/* ---------------- styles tab → video search ---------------- */

document.querySelectorAll(".findbtn").forEach((btn) => {
  btn.addEventListener("click", () => {
    $("#search").value = btn.dataset.q;
    document.querySelector('nav button[data-view="videos"]').click();
    renderResults();
  });
});

/* ---------------- supplies ---------------- */

function renderSupplies(groups) {
  const root = $("#supplies-root");
  root.innerHTML = groups
    .map((g) => {
      const items = g.items
        .filter((it) => !shopMode || supplyState[it.id] === "need")
        .map((it) => {
          const st = supplyState[it.id] || "";
          return `
            <div class="supply-item ${st}">
              <label>${it.emoji} ${escapeHTML(it.name)}</label>
              <span class="pills">
                <button class="pill ${st === "have" ? "on-have" : ""}" data-id="${it.id}" data-set="have">✔️ Have</button>
                <button class="pill ${st === "need" ? "on-need" : ""}" data-id="${it.id}" data-set="need">🛒 Need</button>
              </span>
            </div>`;
        })
        .join("");
      if (shopMode && !items) return "";
      return `<div class="panel"><h2>${g.emoji} ${escapeHTML(g.name)}</h2>${items || ""}</div>`;
    })
    .join("") || `<div class="panel"><h2>🎉 Nothing on the shopping list!</h2></div>`;

  root.querySelectorAll(".pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      const { id, set } = btn.dataset;
      // tap toggles; Have and Need are mutually exclusive
      if (supplyState[id] === set) delete supplyState[id];
      else supplyState[id] = set;
      save(LS_SUPPLIES, supplyState);
      renderSupplies(groups);
    });
  });
}

/* ---------------- ideas ---------------- */

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function setDaily() {
  if (!PROMPTS.daily.length) return;
  // date-seeded: same challenge all day, new one at midnight
  const days = Math.floor(Date.now() / 86400000);
  $("#daily-out").textContent = PROMPTS.daily[days % PROMPTS.daily.length];
}

$("#spin-btn").addEventListener("click", () => {
  const out = $("#prompt-out");
  out.classList.add("spinning");
  let ticks = 0;
  const timer = setInterval(() => {
    out.textContent = `${pick(PROMPTS.subjects, Math.random)} ${pick(PROMPTS.twists, Math.random)} ${pick(PROMPTS.settings, Math.random)}`;
    if (++ticks >= 9) {
      clearInterval(timer);
      out.classList.remove("spinning");
      // sometimes suggest making it with a supply she actually has
      const haves = Object.keys(supplyState)
        .filter((id) => supplyState[id] === "have" && supplyNames[id]);
      if (haves.length && Math.random() < 0.5) {
        out.textContent += ` — and maybe make it with your ${supplyNames[pick(haves, Math.random)]}! 🎨`;
      }
    }
  }, 90);
});

/* ---------------- sync between devices ---------------- */

function syncURL() {
  const state = { f: effectiveFavs(), s: supplyState };
  return location.origin + location.pathname + "#sync=" + btoa(JSON.stringify(state));
}

$("#sync-open").addEventListener("click", () => {
  const url = syncURL();
  const slot = $("#qr-slot");
  slot.innerHTML = "";
  if (typeof QRCode !== "undefined" && url.length <= 1800) {
    new QRCode(slot, { text: url, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.L });
  } else {
    slot.innerHTML = `<p class="qr-note">${url.length > 1800
      ? "Your list is too big for a QR code — use the copy link button instead!"
      : "QR maker didn't load — use the copy link button instead!"}</p>`;
  }
  $("#sync-modal").classList.add("open");
});

$("#sync-copy").addEventListener("click", (e) => {
  navigator.clipboard?.writeText(syncURL()).then(
    () => { e.target.textContent = "copied! ✔️"; setTimeout(() => (e.target.textContent = "📋 Copy sync link"), 2000); },
    () => prompt("Copy this link:", syncURL())
  );
});

$("#sync-close").addEventListener("click", () => $("#sync-modal").classList.remove("open"));
$("#sync-modal").addEventListener("click", (e) => {
  if (e.target === $("#sync-modal")) $("#sync-modal").classList.remove("open");
});

function maybeImportSync(rerenderSupplies) {
  if (!location.hash.startsWith("#sync=")) return;
  try {
    const incoming = JSON.parse(atob(decodeURIComponent(location.hash.slice(6))));
    const n = (incoming.f || []).length;
    if (confirm(`🔄 Bring over ${n} favorite${n === 1 ? "" : "s"} + supplies from your other device?`)) {
      (incoming.f || []).forEach((id) => {
        if (!favs.includes(id)) favs.push(id);
        removedBaseline = removedBaseline.filter((r) => r !== id);
      });
      Object.assign(supplyState, incoming.s || {});
      save(LS_FAVS, favs);
      save(LS_REMOVED, removedBaseline);
      save(LS_SUPPLIES, supplyState);
      renderFavs();
      renderResults();
      rerenderSupplies();
    }
  } catch {
    alert("Hmm, that sync link didn't work — try making a fresh one.");
  }
  history.replaceState(null, "", location.pathname);
}

/* ---------------- YouTube reachability check ---------------- */

(function () {
  const probe = new Image();
  let done = false;
  probe.onload = () => { done = true; };
  probe.onerror = () => { if (!done) $("#netwarn").style.display = "block"; };
  setTimeout(() => { if (!done) $("#netwarn").style.display = "block"; }, 8000);
  probe.src = "https://i.ytimg.com/vi/2iF-9DAqYu8/hqdefault.jpg?t=" + Date.now();
})();

/* ---------------- boot ---------------- */

Promise.all([
  fetch("videos.json").then((r) => r.json()).catch(() => ({ channels: [], videos: [] })),
  fetch("prompts.json").then((r) => r.json()),
  fetch("supplies.json").then((r) => r.json()),
  fetch("family-state.json").then((r) => r.json()).catch(() => ({ f: [] })),
]).then(([vids, prompts, supplies, family]) => {
  CHANNELS = vids.channels;
  VIDEOS = vids.videos;
  PROMPTS = prompts;
  baselineFavs = family.f || [];
  supplies.groups.forEach((g) => g.items.forEach((it) => {
    // "Watercolor paint set (pan style)" -> "watercolor paint set"
    supplyNames[it.id] = it.name.split("(")[0].trim().toLowerCase();
  }));
  renderFavs();
  renderResults();
  renderSupplies(supplies.groups);
  setDaily();
  maybeImportSync(() => renderSupplies(supplies.groups));

  $("#mode-all").addEventListener("click", () => {
    shopMode = false;
    $("#mode-all").classList.add("on");
    $("#mode-shop").classList.remove("on");
    renderSupplies(supplies.groups);
  });
  $("#mode-shop").addEventListener("click", () => {
    shopMode = true;
    $("#mode-shop").classList.add("on");
    $("#mode-all").classList.remove("on");
    renderSupplies(supplies.groups);
  });
});
