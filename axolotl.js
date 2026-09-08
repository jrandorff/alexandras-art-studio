/* Parametric axolotl "specimen cards" — every puzzle picture is generated here.
   No image files: each morph is a colour recipe, drawn as SVG on demand.
   Morph names and facts are real axolotl genetics. */

"use strict";

const MORPHS = [
  { name: "Leucistic", body: "#ffd7e3", gill: "#ff8fab", mark: "#e8a8bd", style: "freckle",
    eye: "#3a2e39", light: true, wt: "#dff4fd", wb: "#a9dcf0",
    fact: "The famous pink axolotl! Leucistic ones are pale with DARK eyes — that's how you know they aren't albino." },
  { name: "Wild Type", body: "#8a7f5c", gill: "#6f5b3e", mark: "#4d452f", style: "speckle",
    eye: "#2b2b22", light: true, wt: "#e2f3e8", wb: "#a8ccb4",
    fact: "This is how axolotls look in the wild — speckly brown, hiding in the lakes near Mexico City." },
  { name: "Golden Albino", body: "#ffd97a", gill: "#ffb26b", mark: "#ffc247", style: "speckle",
    eye: "#e05a5a", light: false, wt: "#fff6e0", wb: "#ffd9a8",
    fact: "Golden albinos have no dark pigment at all, so even their eyes look pink and shiny." },
  { name: "Melanoid", body: "#4a4550", gill: "#2f2b36", mark: "#37323d", style: "freckle",
    eye: "#141018", light: true, wt: "#dfe6f2", wb: "#9aa8c4",
    fact: "Melanoid axolotls are extra dark — no shiny gold flecks anywhere, not even a ring in the eye." },
  { name: "Copper", body: "#e0a882", gill: "#c9855c", mark: "#a86a44", style: "speckle",
    eye: "#c05a4a", light: false, wt: "#fdeee2", wb: "#e8c1a0",
    fact: "Coppers are freckly and warm-coloured, like a penny. Their eyes are reddish too." },
  { name: "Axanthic", body: "#c7ccd4", gill: "#9aa3af", mark: "#aeb6c0", style: "speckle",
    eye: "#3a2e39", light: true, wt: "#eaf1f8", wb: "#b9c6d6",
    fact: "Axanthics are grey because they're missing yellow and red pigment — like a black-and-white photo." },
  { name: "Piebald", body: "#fff0f4", gill: "#ff9ab8", mark: "#4a4550", style: "patch",
    eye: "#3a2e39", light: true, wt: "#e6f6fd", wb: "#aedcf0",
    fact: "Piebalds are pale with dark patches, usually splashed across the head and back. No two are the same." },
  { name: "Glow (GFP)", body: "#c9f7a8", gill: "#7fe06b", mark: "#8fd97a", style: "freckle",
    eye: "#3a2e39", light: true, wt: "#e8f7ff", wb: "#9fd0e8",
    fact: "GFP axolotls carry a jellyfish gene and really do GLOW green under blue light. Scientists use it to watch cells." },
  { name: "Chimera", body: "#ffd7e3", gill: "#ff8fab", mark: "#4a4550", style: "split",
    eye: "#3a2e39", light: true, wt: "#f0eafb", wb: "#c3b4e0",
    fact: "Super rare! A chimera is split right down the middle — two colours, because two eggs joined into one axolotl." },
  { name: "Lavender", body: "#cfc0e0", gill: "#a68fc4", mark: "#6d5a86", style: "speckle",
    eye: "#3a2e39", light: true, wt: "#f4ecff", wb: "#cbb9e8",
    fact: "Lavenders (silver dalmatians) are purple-grey with dark spots — they often fade as they grow up." },
  { name: "Mosaic", body: "#ffd7e3", gill: "#ff8fab", mark: "#5c5464", style: "mosaic",
    eye: "#3a2e39", light: true, wt: "#e9f6ec", wb: "#aed4bb",
    fact: "Mosaics are speckled with two colours all mixed together, and their gills can even be different colours." },
  { name: "Enigma", body: "#514a58", gill: "#3c3644", mark: "#f2e3a8", style: "speckle",
    eye: "#3a2e39", light: true, wt: "#e4eaf4", wb: "#a5b2c8",
    fact: "The Enigma morph is dark with golden speckles. It's so new and so rare it was named after a mystery." },
];

/* One cute axolotl, centred at (cx, cy). */
function axolotlSVG(cx, cy, m, s) {
  const P = (...n) => {
    let out = [];
    for (let i = 0; i < n.length; i += 2) out.push(`${(cx + n[i] * s).toFixed(1)},${(cy + n[i + 1] * s).toFixed(1)}`);
    return out.join(" ");
  };
  const o = [];
  // gills (behind everything)
  for (const side of [-1, 1]) {
    for (const [gx, gy, rot] of [[56, -22, -35], [64, -2, -8], [58, 16, 18]]) {
      const X = cx + side * gx * s, Y = cy + gy * s, R = `rotate(${rot * side} ${X.toFixed(1)} ${Y.toFixed(1)})`;
      o.push(`<ellipse cx="${X.toFixed(1)}" cy="${Y.toFixed(1)}" rx="${(26 * s).toFixed(1)}" ry="${(9 * s).toFixed(1)}" fill="${m.gill}" transform="${R}"/>`);
      o.push(`<ellipse cx="${X.toFixed(1)}" cy="${Y.toFixed(1)}" rx="${(18 * s).toFixed(1)}" ry="${(4 * s).toFixed(1)}" fill="#fff" opacity=".22" transform="${R}"/>`);
    }
  }
  o.push(`<path d="M ${P(-26, 58)} Q ${P(0, 124, 26, 58)} Z" fill="${m.body}"/>`);
  o.push(`<path d="M ${P(-10, 66)} Q ${P(0, 112, 10, 66)} Z" fill="#fff" opacity=".18"/>`);
  for (const [lx, ly] of [[-44, 28], [44, 28], [-36, 56], [36, 56]])
    o.push(`<ellipse cx="${(cx + lx * s).toFixed(1)}" cy="${(cy + ly * s).toFixed(1)}" rx="${(13 * s).toFixed(1)}" ry="${(9 * s).toFixed(1)}" fill="${m.body}"/>`);
  o.push(`<path d="M ${P(-40, 4)} C ${P(-46, 44, -30, 68, 0, 68)} C ${P(30, 68, 46, 44, 40, 4)} Z" fill="${m.body}"/>`);
  o.push(`<ellipse cx="${cx}" cy="${(cy - 8 * s).toFixed(1)}" rx="${(46 * s).toFixed(1)}" ry="${(40 * s).toFixed(1)}" fill="${m.body}"/>`);
  // shading: gives even the flattest morph a light direction (helps solving)
  o.push(`<ellipse cx="${(cx - 4 * s).toFixed(1)}" cy="${(cy + 34 * s).toFixed(1)}" rx="${(26 * s).toFixed(1)}" ry="${(22 * s).toFixed(1)}" fill="#fff" opacity=".30"/>`);
  o.push(`<ellipse cx="${(cx - 16 * s).toFixed(1)}" cy="${(cy - 20 * s).toFixed(1)}" rx="${(22 * s).toFixed(1)}" ry="${(16 * s).toFixed(1)}" fill="#fff" opacity=".26"/>`);
  o.push(`<path d="M ${P(18, -42)} C ${P(46, -30, 50, 10, 36, 34)} C ${P(48, 6, 44, -24, 18, -42)} Z" fill="#000" opacity=".07"/>`);
  // markings
  const spots = [[-26, -26, 5], [14, -30, 4], [30, -10, 5], [-14, 10, 4], [20, 26, 5], [-30, 34, 4], [6, 46, 3]];
  const freckles = [[-30, -30], [-18, -36], [-6, -30], [24, -32], [32, -20], [-34, -16], [30, 4], [-28, 14], [10, 20], [-12, 34], [22, 40], [0, 52], [-22, 46], [14, -20]];
  if (m.style === "speckle" || m.style === "mosaic")
    spots.forEach(([px, py, pr]) =>
      o.push(`<circle cx="${(cx + px * s).toFixed(1)}" cy="${(cy + py * s).toFixed(1)}" r="${(pr * s).toFixed(1)}" fill="${m.mark}" opacity=".6"/>`));
  if (m.style === "freckle" || m.style === "mosaic")
    freckles.forEach(([px, py], i) =>
      o.push(`<circle cx="${(cx + px * s).toFixed(1)}" cy="${(cy + py * s).toFixed(1)}" r="${((2.2 + (i % 3) * 0.7) * s).toFixed(1)}" fill="${m.mark}" opacity=".5"/>`));
  if (m.style === "patch") {
    o.push(`<ellipse cx="${(cx - 20 * s).toFixed(1)}" cy="${(cy - 26 * s).toFixed(1)}" rx="${(20 * s).toFixed(1)}" ry="${(14 * s).toFixed(1)}" fill="${m.mark}" opacity=".85"/>`);
    o.push(`<ellipse cx="${(cx + 22 * s).toFixed(1)}" cy="${(cy + 28 * s).toFixed(1)}" rx="${(16 * s).toFixed(1)}" ry="${(18 * s).toFixed(1)}" fill="${m.mark}" opacity=".85"/>`);
    freckles.slice(0, 6).forEach(([px, py]) =>
      o.push(`<circle cx="${(cx + px * s).toFixed(1)}" cy="${(cy + py * s).toFixed(1)}" r="${(2.6 * s).toFixed(1)}" fill="${m.mark}" opacity=".4"/>`));
  }
  if (m.style === "split")
    o.push(`<path d="M ${P(0, -48)} C ${P(30, -48, 46, -10, 40, 4)} C ${P(46, 44, 30, 68, 0, 68)} Z" fill="${m.mark}" opacity=".9"/>`);
  // face
  for (const side of [-1, 1]) {
    const ex = cx + side * 19 * s;
    o.push(`<circle cx="${ex.toFixed(1)}" cy="${(cy - 14 * s).toFixed(1)}" r="${(7.5 * s).toFixed(1)}" fill="${m.eye}"/>`);
    if (m.light) o.push(`<circle cx="${(ex - 2 * s).toFixed(1)}" cy="${(cy - 17 * s).toFixed(1)}" r="${(2.6 * s).toFixed(1)}" fill="#fff"/>`);
  }
  o.push(`<path d="M ${P(-11, 4)} Q ${P(0, 13, 11, 4)}" fill="none" stroke="#3a2e39" stroke-width="${(2.6 * s).toFixed(1)}" stroke-linecap="round"/>`);
  for (const side of [-1, 1])
    o.push(`<ellipse cx="${(cx + side * 32 * s).toFixed(1)}" cy="${(cy + 2 * s).toFixed(1)}" rx="${(9 * s).toFixed(1)}" ry="${(5.5 * s).toFixed(1)}" fill="#ff7f9f" opacity=".38"/>`);
  return o.join("");
}

const BUBBLES = [[70,90,13],[126,52,7],[505,74,15],[452,132,8],[548,196,10],[40,214,9],[84,300,12],
  [556,330,8],[36,392,11],[520,420,13],[150,466,9],[470,486,7],[96,150,6],[300,44,9],
  [398,88,6],[566,262,6],[24,300,7],[240,470,6]];

/* The full 600x600 specimen card: scene + frame + name plaque.
   Every element exists so that no puzzle piece is a featureless field of colour. */
function cardSVG(i) {
  const m = MORPHS[i % MORPHS.length], W = 600, H = 600, o = [];
  o.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
  o.push(`<defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${m.wt}"/><stop offset="1" stop-color="${m.wb}"/></linearGradient></defs>`);
  o.push(`<rect width="${W}" height="${H}" fill="url(#w)"/>`);
  BUBBLES.forEach(([x, y, r]) => {
    o.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".38"/>`);
    o.push(`<circle cx="${(x - r * 0.3).toFixed(0)}" cy="${(y - r * 0.35).toFixed(0)}" r="${(r * 0.28).toFixed(1)}" fill="#fff" opacity=".55"/>`);
  });
  o.push(`<path d="M 0,${H} L 0,${H - 70} Q ${W * 0.25},${H - 108} ${W * 0.5},${H - 76} Q ${W * 0.78},${H - 46} ${W},${H - 92} L ${W},${H} Z" fill="#f5e6c4"/>`);
  [[58, "#6fbf73", 150], [96, "#8fd48a", 108], [512, "#5fae6b", 132], [548, "#86cf84", 96], [300, "#7ac97e", 74]].forEach(([bx, col, hg]) =>
    o.push(`<path d="M ${bx},${H - 58} C ${bx - 26},${H - 58 - hg * 0.4} ${bx + 26},${H - 58 - hg * 0.7} ${bx},${H - 58 - hg} C ${bx - 20},${H - 58 - hg * 0.6} ${bx + 16},${H - 58 - hg * 0.3} ${bx},${H - 58} Z" fill="${col}" opacity=".85"/>`));
  [[150,566,14,"#cbb897"],[196,578,10,"#ddcaa8"],[420,570,16,"#c6b391"],[468,582,9,"#d8c5a2"],[330,584,11,"#cfbc9a"]].forEach(([px,py,pr,c]) =>
    o.push(`<ellipse cx="${px}" cy="${py}" rx="${pr}" ry="${(pr * 0.62).toFixed(1)}" fill="${c}"/>`));
  o.push(axolotlSVG(W / 2, 258, m, 2.15));
  o.push(`<rect x="${W / 2 - 158}" y="${H - 146}" width="316" height="58" rx="29" fill="#fffdf8" opacity=".95" stroke="#3a2e39" stroke-width="3"/>`);
  o.push(`<text x="${W / 2}" y="${H - 106}" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="#3a2e39">${m.name}</text>`);
  o.push(`<rect x="9" y="9" width="${W - 18}" height="${H - 18}" rx="26" fill="none" stroke="#3a2e39" stroke-width="7"/>`);
  o.push(`<rect x="22" y="22" width="${W - 44}" height="${H - 44}" rx="18" fill="none" stroke="#fff" stroke-width="3" opacity=".75"/>`);
  [[44,44],[W-44,44],[44,H-44],[W-44,H-44]].forEach(([ox, oy]) =>
    o.push(`<circle cx="${ox}" cy="${oy}" r="11" fill="#ff8fab" stroke="#3a2e39" stroke-width="3"/>`));
  o.push("</svg>");
  return o.join("");
}

function cardURL(i) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(cardSVG(i));
}
