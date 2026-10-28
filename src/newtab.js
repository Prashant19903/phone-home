const PHONE_W = 390;
const PHONE_H = 844;

// The Lite edition has no declarativeNetRequest permission, so apps open in phone-sized windows.
const LITE = !chrome.declarativeNetRequest;
document.body.classList.toggle("lite", LITE);

const $ = (id) => document.getElementById(id);
const grid = $("grid");
const scaleInput = $("scale");
const scaleVal = $("scaleVal");
const autoBox = $("autoFit");
const statusEl = $("status");
const bubble = $("bubble");

let tiles = [];
let scale = 0.7;
let auto = true;
let dragged = null;
const entries = new Map(); // tile.id -> { phone, screen, tile }

const save = (obj) => chrome.storage.local.set(obj);

function setStatus(text) {
  statusEl.textContent = text;
  clearTimeout(setStatus.t);
  setStatus.t = setTimeout(() => (statusEl.textContent = ""), 6000);
}

/* ---------------- sizing ---------------- */
function sizeScreen(screen) {
  screen.style.width = PHONE_W * scale + "px";
  screen.style.height = PHONE_H * scale + "px";
  const f = screen.querySelector("iframe");
  if (f) f.style.transform = `scale(${scale})`;
}

function setScale(s, persist) {
  scale = s;
  const pct = Math.round(s * 100);
  scaleInput.value = pct;
  scaleVal.textContent = pct + "%";
  entries.forEach((e) => sizeScreen(e.screen));
  if (persist) save({ scale: pct });
}

function fitScale() {
  const top = document.querySelector(".top").offsetHeight;
  const n = Math.max(entries.size, 1);
  const byHeight = (innerHeight - top - 150) / PHONE_H;
  const byWidth = (innerWidth - 88 - (n - 1) * 30 - n * 28) / (n * PHONE_W);
  return Math.max(0.4, Math.min(1, byHeight, byWidth));
}

function refreshScale() {
  if (auto) setScale(fitScale(), false);
}

let resizeTimer;
addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(refreshScale, 120);
});

scaleInput.addEventListener("input", () => {
  auto = false;
  autoBox.checked = false;
  setScale(Number(scaleInput.value) / 100, true);
  save({ auto: false });
});

autoBox.addEventListener("change", () => {
  auto = autoBox.checked;
  save({ auto });
  refreshScale();
});

/* ---------------- loading sites ---------------- */
function popOut(tile) {
  chrome.windows.create({ url: tile.url, type: "popup", width: 420, height: 900 });
}

function loadSite(entry) {
  if (LITE) return popOut(entry.tile);
  const { screen, tile } = entry;
  const old = screen.querySelector("iframe");
  if (old) old.remove();
  const ph = screen.querySelector(".placeholder");
  if (ph) ph.style.display = "none";

  const iframe = document.createElement("iframe");
  iframe.src = tile.url;
  iframe.allow = "clipboard-write; autoplay; fullscreen";
  screen.appendChild(iframe);
  iframe.style.transform = `scale(${scale})`;
}

function unloadSite(entry) {
  const { screen } = entry;
  const f = screen.querySelector("iframe");
  if (f) f.remove();
  const ph = screen.querySelector(".placeholder");
  if (ph) ph.style.display = "flex";
}

/* ---------------- tiles ---------------- */
function updateEmpty() {
  let msg = grid.querySelector(".empty");
  if (entries.size === 0) {
    if (!msg) {
      msg = document.createElement("div");
      msg.className = "empty";
      msg.textContent = "No apps yet. Click “+ Add app” to start.";
      grid.appendChild(msg);
    }
  } else if (msg) {
    msg.remove();
  }
}

function saveOrder() {
  const byId = new Map(tiles.map((t) => [t.id, t]));
  const ordered = [...grid.querySelectorAll(".phone")].map((p) => byId.get(p.dataset.id)).filter(Boolean);
  if (ordered.length === tiles.length) {
    tiles = ordered;
    save({ tiles });
  }
}

function buildTile(tile) {
  const phone = document.createElement("div");
  phone.className = "phone";
  phone.dataset.id = tile.id;
  phone.style.setProperty("--tile", tile.accent || "#8b5cf6");

  const head = document.createElement("div");
  head.className = "phone-head";
  head.draggable = true;
  head.innerHTML =
    `<span class="name"></span><span class="actions">` +
    (LITE ? "" : `<button data-a="pop">Pop out</button><button data-a="reload">Reload</button><button data-a="close">Close</button>`) +
    `<button data-a="remove" title="Remove this app">✕</button></span>`;
  head.querySelector(".name").textContent = tile.name;

  const screen = document.createElement("div");
  screen.className = "screen";
  const ph = document.createElement("div");
  ph.className = "placeholder";
  ph.innerHTML = `<div class="icon"></div><div class="label"></div><div class="hint"></div>`;
  ph.querySelector(".icon").textContent = (tile.name || "?")[0].toUpperCase();
  ph.querySelector(".label").textContent = tile.name;
  ph.querySelector(".hint").textContent = LITE ? "Click to open in a phone window" : "Click to open";
  screen.appendChild(ph);

  phone.append(head, screen);
  grid.appendChild(phone);

  const entry = { phone, screen, tile };
  entries.set(tile.id, entry);
  sizeScreen(screen);

  ph.addEventListener("click", () => loadSite(entry));

  head.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    const a = btn && btn.dataset.a;
    if (a === "reload") loadSite(entry);
    if (a === "close") unloadSite(entry);
    if (a === "pop") popOut(tile);
    if (a === "remove") removeTile(tile.id);
  });

  // Apple TV style focus: the app's colour drives the page glow
  phone.addEventListener("mouseenter", () => {
    document.body.style.setProperty("--accent", tile.accent || "#8b5cf6");
    if (!dragged) botReact(tile);
  });
  phone.addEventListener("mouseleave", () => document.body.style.removeProperty("--accent"));

  // Drag the title bar to reorder
  head.addEventListener("dragstart", (e) => {
    dragged = phone;
    document.body.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", tile.id);
    e.dataTransfer.setDragImage(phone, 40, 20);
  });
  head.addEventListener("dragend", () => {
    dragged = null;
    document.body.classList.remove("dragging");
    saveOrder();
  });
  phone.addEventListener("dragover", (e) => {
    if (!dragged || dragged === phone) return;
    e.preventDefault();
    const r = phone.getBoundingClientRect();
    const after = e.clientX > r.left + r.width / 2;
    const ref = after ? phone.nextElementSibling : phone;
    if (ref === dragged || dragged.nextElementSibling === ref) return; // already there
    grid.insertBefore(dragged, ref);
  });
}

function removeTile(id) {
  const entry = entries.get(id);
  if (!entry) return;
  entry.phone.remove();
  entries.delete(id);
  tiles = tiles.filter((t) => t.id !== id);
  save({ tiles });
  updateEmpty();
  refreshScale();
}

async function ensurePerms(tile) {
  if (LITE) return true;
  const origins = tile.domains.map((d) => `https://*.${d}/*`);
  try {
    if (await chrome.permissions.contains({ origins })) return true;
    return await chrome.permissions.request({ origins });
  } catch (e) {
    return false;
  }
}

async function addTile(tile) {
  if (tiles.some((t) => t.id === tile.id)) return false;
  if (!(await ensurePerms(tile))) {
    setStatus(`Permission for ${tile.name} was not granted.`);
    return false;
  }
  tiles.push(tile);
  buildTile(tile);
  save({ tiles });
  updateEmpty();
  refreshScale();
  return true;
}

/* ---------------- add dialog ---------------- */
const dlg = $("addDlg");
const presetList = $("presetList");
const form = $("customForm");
const formErr = $("formErr");

function renderPresets() {
  presetList.textContent = "";
  const have = new Set(tiles.map((t) => t.id));
  const available = PRESETS.filter((p) => !have.has(p.id));
  if (!available.length) {
    const none = document.createElement("span");
    none.className = "none";
    none.textContent = "All presets are already added.";
    presetList.appendChild(none);
    return;
  }
  for (const p of available) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    const dot = document.createElement("i");
    dot.style.background = p.accent;
    b.append(dot, document.createTextNode(p.name));
    b.addEventListener("click", async () => {
      if (await addTile(JSON.parse(JSON.stringify(p)))) dlg.close();
    });
    presetList.appendChild(b);
  }
}

$("addBtn").addEventListener("click", () => {
  formErr.textContent = "";
  renderPresets();
  dlg.showModal();
});
$("cancelBtn").addEventListener("click", () => dlg.close());

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formErr.textContent = "";
  let url;
  try {
    url = new URL($("cUrl").value.trim());
    if (url.protocol !== "https:") throw new Error("https only");
  } catch (err) {
    formErr.textContent = "Enter a valid https:// address.";
    return;
  }
  const name = $("cName").value.trim() || url.hostname.replace(/^www\./, "");
  const tile = makeCustomTile(name, url.href, $("cColor").value, $("cMobile").checked);
  if (await addTile(tile)) {
    form.reset();
    dlg.close();
  }
});

/* ---------------- fix login (Full edition) ---------------- */
$("fixLogin").addEventListener("click", () => {
  setStatus("Fixing cookies…");
  chrome.runtime.sendMessage("fixCookies", (res) => {
    setStatus(res && res.ok ? `Done (${res.count} cookies updated). Reload the frames.` : "Failed");
  });
});

/* ---------------- clock ---------------- */
function tick() {
  const now = new Date();
  const h = now.getHours();
  $("clock").textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  const part = h < 5 ? "night" : h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  const day = now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
  $("greeting").textContent = `Good ${part} · ${day}`;
}
tick();
setInterval(tick, 20000);

/* ---------------- mascot: Builder Bot ---------------- */
const wrap = $("mascotWrap");
const mascot = $("mascot");
const pupils = [$("pupilL"), $("pupilR")];
const LINES = [
  "Namaste! Aaj kya build karna hai?",
  "Chai break ka time ho gaya?",
  "Ek aur reel? Main ready hu!",
  "Bug nahi, feature hai. 😎",
  "Ctrl+S dabaya kya?",
  "Average builder, above average ideas.",
];

function say(text, ms = 3200) {
  bubble.textContent = text;
  bubble.classList.add("show");
  clearTimeout(say.t);
  say.t = setTimeout(() => bubble.classList.remove("show"), ms);
}

let lastReact = "";
function botReact(tile) {
  if (wrap.hidden || lastReact === tile.id) return;
  lastReact = tile.id;
  setTimeout(() => (lastReact = ""), 4000);
  say(`${tile.name}? Chalo dekhte hain!`, 2200);
}

mascot.addEventListener("click", () => {
  wrap.classList.remove("jump");
  void wrap.offsetWidth; // restart animation
  wrap.classList.add("jump");
  say(LINES[Math.floor(Math.random() * LINES.length)]);
});

addEventListener("mousemove", (e) => {
  if (wrap.hidden) return;
  const r = mascot.getBoundingClientRect();
  const dx = e.clientX - (r.left + r.width / 2);
  const dy = e.clientY - (r.top + r.height * 0.47);
  const d = Math.hypot(dx, dy) || 1;
  const k = Math.min(1, d / 300);
  const t = `translate(${(dx / d) * 2.8 * k} ${(dy / d) * 2.8 * k})`;
  pupils.forEach((p) => p.setAttribute("transform", t));
});

$("mascotToggle").addEventListener("change", (e) => {
  wrap.hidden = !e.target.checked;
  save({ mascot: e.target.checked });
});

/* ---------------- init ---------------- */
(async function init() {
  const st = await chrome.storage.local.get(["tiles", "scale", "auto", "mascot"]);
  tiles = Array.isArray(st.tiles) ? st.tiles : defaultTiles();
  auto = st.auto !== false;
  autoBox.checked = auto;
  if (!auto && st.scale) scale = st.scale / 100;

  tiles.forEach(buildTile);
  updateEmpty();
  if (auto) refreshScale();
  else setScale(scale, false);

  const mascotOn = st.mascot !== false;
  $("mascotToggle").checked = mascotOn;
  wrap.hidden = !mascotOn;
  if (mascotOn) {
    const h = new Date().getHours();
    setTimeout(() => say(h < 12 ? "Subah subah build mode on!" : h < 18 ? "Namaste! Aaj kya build karna hai?" : "Raat ki shift? Chalo shuru karein.", 4000), 800);
  }
})();
