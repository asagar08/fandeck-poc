/* global $, gsap, Draggable, tinycolor */

const DATA_URL = "https://www.asianpaints.com/content/ap/en/home/colour-catalogue/jcr:content/root/responsivegrid_602603264/shadelisting.shade.json?selectedShadeFamily=all&language=en&shadeMapper=false";
const MAX_CARDS_DESKTOP = 47;
const MAX_CARDS_MOBILE = 31;
const FAVORITE_KEY = "colourmaxx-fandeck-favorites-v1";
const PALETTE_KEY = "colourmaxx-fandeck-selection-v2";
const MAX_SELECTION = 8;

const fallbackShades = [
  { id: "fb-1", name: "Blue Dawn", code: "7275", hex: "#d9ecf4", family: "Blue" },
  { id: "fb-2", name: "Sea Ridge", code: "7370", hex: "#b7dde3", family: "Blue" },
  { id: "fb-3", name: "Imperial Blue", code: "7245", hex: "#315f8e", family: "Blue" },
  { id: "fb-4", name: "Pistachio", code: "9385", hex: "#d9e6b2", family: "Green" },
  { id: "fb-5", name: "Jade Impact", code: "7526", hex: "#7fc2a6", family: "Teal" },
  { id: "fb-6", name: "Emerald Satin", code: "7502", hex: "#1f9d7a", family: "Teal" },
  { id: "fb-7", name: "Lemon Sprig", code: "7873", hex: "#f3e482", family: "Yellow" },
  { id: "fb-8", name: "Golden Ray", code: "7870", hex: "#f2c25a", family: "Yellow" },
  { id: "fb-9", name: "Peach Rose", code: "7994", hex: "#f4b6a3", family: "Orange" },
  { id: "fb-10", name: "Sunset Cloud", code: "7976", hex: "#e9895f", family: "Orange" },
  { id: "fb-11", name: "Rose Mist", code: "8055", hex: "#f1c7ce", family: "Pink And Red" },
  { id: "fb-12", name: "Berry Brunch", code: "8133", hex: "#c65c7a", family: "Pink And Red" },
  { id: "fb-13", name: "Moon Crater", code: "8248", hex: "#b7b4ac", family: "Grey" },
  { id: "fb-14", name: "Charcoal Shadow", code: "8286", hex: "#5c5f63", family: "Grey" },
  { id: "fb-15", name: "Timber Ridge", code: "8633", hex: "#9b6f53", family: "Brown" },
  { id: "fb-16", name: "Almond White", code: "8692", hex: "#f0e7d8", family: "Whites" },
  { id: "fb-17", name: "White Satin", code: "L119", hex: "#f8f6ec", family: "Whites" },
  { id: "fb-18", name: "Vintage Walnut", code: "8773", hex: "#76543f", family: "Brown" },
  { id: "fb-19", name: "Mauve Halo", code: "8144", hex: "#d6c1d3", family: "Purple" },
  { id: "fb-20", name: "Grape Spread", code: "9160", hex: "#7b6a96", family: "Purple" }
];

const state = {
  all: [],
  filtered: [],
  category: "All",
  selectedIndex: 0,
  selectedId: null,
  favorites: new Set(),
  favoritesOnly: false,
  selectedPalette: [],
  currentSmartPalette: [],
  dragProxy: null,
  isDragging: false,
  lastQuery: "",
  suppressFanClickUntil: 0
};

const dom = {};

$(init);

async function init() {
  cacheDom();
  registerPlugins();
  bindEvents();
  loadFavorites();
  loadSelectedPalette();
  renderSelectedPalette();
  setLoading(true);

  try {
    const shades = await fetchShadeData();
    state.all = shades.length ? shades : buildFallbackSet();
    if (!shades.length) showToast("Using fallback shades because the live JSON returned no usable colours.");
  } catch (error) {
    console.warn("Shade data fetch failed. Fallback data loaded.", error);
    state.all = buildFallbackSet();
    showToast("Live shade JSON could not load, so fallback shades are visible.");
  }

  state.all = prepareShadeList(state.all);
  state.filtered = [...state.all];
  state.selectedId = state.filtered[0]?.id || null;

  buildCategoryTabs();
  applyFilter("All", { silent: true });
  setupGsapIntro();
  setupDraggable();
  setLoading(false);
}

function cacheDom() {
  dom.body = $(document.body);
  dom.fanDeck = $("#fanDeck");
  dom.fanStage = $("#fanStage");
  dom.tabs = $("#categoryTabs");
  dom.range = $("#rangeSlider");
  dom.rangeCount = $("#rangeCount");
  dom.search = $("#shadeSearch");
  dom.clearSearch = $("#clearSearch");
  dom.suggestions = $("#suggestions");
  dom.progressText = $("#progressText");
  dom.shadeTotal = $("#shadeTotal");
  dom.progressFill = $("#progressFill");
  dom.progressKnob = $("#progressKnob");
  dom.progressTrack = $("#progressTrack");
  dom.selectedBeacon = $("#selectedBeacon");
  dom.beaconSwatch = $(".beacon-swatch");
  dom.beaconName = $(".beacon-copy strong");
  dom.beaconMeta = $(".beacon-copy small");
  dom.activeFamily = $("#activeFamily");
  dom.activeName = $("#activeName");
  dom.activeCode = $("#activeCode");
  dom.activeHex = $("#activeHex");
  dom.activeRgb = $("#activeRgb");
  dom.previewWall = $("#previewWall");
  dom.favoriteCurrent = $("#favoriteCurrent");
  dom.favoriteTray = $("#favoriteTray");
  dom.toggleFavorites = $("#toggleFavorites");
  dom.openDetails = $("#openDetails");
  dom.randomShade = $("#randomShade");
  dom.prevShade = $("#prevShade");
  dom.nextShade = $("#nextShade");
  dom.resetDeck = $("#resetDeck");
  dom.overlay = $("#modalOverlay");
  dom.selectionOverlay = $("#selectionOverlay");
  dom.closeModal = $("#closeModal");
  dom.closeSelectionModal = $("#closeSelectionModal");
  dom.modalSwatch = $("#modalSwatch");
  dom.modalFamily = $("#modalFamily");
  dom.modalShadeName = $("#modalShadeName");
  dom.modalShadeCode = $("#modalShadeCode");
  dom.modalHex = $("#modalHex");
  dom.modalRgb = $("#modalRgb");
  dom.modalCode = $("#modalCode");
  dom.smartPalette = $("#smartPalette");
  dom.selectionBento = $("#selectionBento");
  dom.selectionCount = $("#selectionCount");
  dom.clearSelection = $("#clearSelection");
  dom.selectionBadge = $("#selectionBadge");
  dom.paletteHint = $("#paletteHint");
  dom.modalFavorite = $("#modalFavorite");
  dom.modalNext = $("#modalNext");
  dom.toast = $("#toast");
}

function registerPlugins() {
  if (window.gsap && window.Draggable) gsap.registerPlugin(Draggable);
}

function bindEvents() {
  dom.range.on("input", function () {
    setSelectedIndex(Number(this.value), { source: "range" });
  });

  dom.prevShade.on("click", () => stepShade(-1));
  dom.nextShade.on("click", () => stepShade(1));
  dom.modalNext.on("click", () => {
    stepShade(1);
    openModal(getSelectedShade());
  });
  dom.resetDeck.on("click", () => {
    setSelectedIndex(0, { source: "reset" });
    pulseDeck();
  });
  dom.randomShade.on("click", () => {
    if (!state.filtered.length) return;
    const randomIndex = Math.floor(Math.random() * state.filtered.length);
    setSelectedIndex(randomIndex, { source: "random" });
    openModal(getSelectedShade());
  });

  dom.progressTrack.on("click", function (event) {
    const rect = this.getBoundingClientRect();
    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    setSelectedIndex(Math.round(ratio * (state.filtered.length - 1)), { source: "progress" });
  });

  dom.openDetails.on("click", openSelectionModal);
  dom.selectedBeacon.on("click", () => openModal(getSelectedShade()));
  dom.closeModal.on("click", closeModal);
  dom.closeSelectionModal.on("click", closeSelectionModal);
  dom.overlay.on("click", event => {
    if (event.target === dom.overlay[0]) closeModal();
  });
  dom.selectionOverlay.on("click", event => {
    if (event.target === dom.selectionOverlay[0]) closeSelectionModal();
  });

  dom.favoriteCurrent.on("click", () => shortlistShade(getSelectedShade(), dom.favoriteCurrent[0]));
  dom.modalFavorite.on("click", () => shortlistShade(getSelectedShade(), dom.modalFavorite[0]));
  dom.toggleFavorites.on("click", toggleFavoritesFilter);

  dom.search.on("input", debounce(handleSearchInput, 80));
  dom.search.on("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      const first = dom.suggestions.find(".suggestion-item").first();
      if (first.length) selectById(first.data("id"), { source: "search", open: true });
    }
    if (event.key === "Escape") clearSearch();
  });
  dom.clearSearch.on("click", clearSearch);

  dom.suggestions.on("click", ".suggestion-item", function () {
    selectById($(this).data("id"), { source: "search", open: true });
    dom.suggestions.hide();
  });

  dom.fanDeck.on("click", ".strip-add", function (event) {
    if (shouldSuppressFanClick()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    const sampleNode = $(this).closest(".card-cap, .card-strip");
    const card = $(this).closest(".fan-card");
    const shade = state.all.find(item => item.id === card.data("id"));
    if (!shade || !sampleNode.length) return;
    const index = state.filtered.findIndex(item => item.id === shade.id);
    if (index >= 0) setSelectedIndex(index, { source: "shortlist" });

    const sample = paletteItemFromElement(shade, sampleNode[0]);
    savePaletteColor(sample, { origin: this });
  });

  dom.fanDeck.on("click", ".card-cap, .card-strip", function (event) {
    if (shouldSuppressFanClick()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const card = $(this).closest(".fan-card");
    const shade = state.all.find(item => item.id === card.data("id"));
    if (!shade) return;
    const index = state.filtered.findIndex(item => item.id === shade.id);
    if (index >= 0) setSelectedIndex(index, { source: "strip" });
    openModal(getSelectedShade());
  });

  dom.fanDeck.on("click", ".fan-card", function (event) {
    if (shouldSuppressFanClick()) {
      event.preventDefault();
      return;
    }
    if ($(event.target).closest(".card-cap, .card-strip, .card-fav, .strip-add").length) return;
    const id = $(this).data("id");
    const index = state.filtered.findIndex(shade => shade.id === id);
    if (index >= 0) {
      setSelectedIndex(index, { source: "card" });
      openModal(getSelectedShade());
    }
  });

  dom.fanDeck.on("click", ".card-fav", function (event) {
    if (shouldSuppressFanClick()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    const card = $(this).closest(".fan-card");
    const shade = state.all.find(item => item.id === card.data("id"));
    const index = state.filtered.findIndex(item => item.id === shade?.id);
    if (index >= 0) setSelectedIndex(index, { source: "shortlist" });
    shortlistShade(shade, this);
  });

  dom.favoriteTray.on("click", ".selection-mini", function () {
    const shadeId = $(this).data("shadeId");
    if (shadeId) selectById(shadeId, { source: "selection" });
  });

  dom.selectionBento.on("click", ".remove-selection", function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    removePaletteColor($(this).data("key"));
  });
  dom.selectionBento.on("click", ".selection-card", function (event) {
    if ($(event.target).closest(".remove-selection").length) return;
    const shadeId = $(this).data("shadeId");
    if (!shadeId) return;
    closeSelectionModal({ instant: true });
    selectById(shadeId, { source: "selection-popup", open: true });
  });

  dom.clearSelection.on("click", clearSelectedPalette);

  $(document).on("keydown", event => {
    const isTyping = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);
    if (event.key === "Escape") { closeModal(); closeSelectionModal(); }
    if (event.key === "/" && !isTyping) {
      event.preventDefault();
      dom.search.trigger("focus");
    }
    if (!isTyping && event.key === "ArrowLeft") stepShade(-1);
    if (!isTyping && event.key === "ArrowRight") stepShade(1);
    if (!isTyping && event.key === "Enter") openModal(getSelectedShade());
  });


  $(".copy-chip").on("click", function () {
    const shade = getSelectedShade();
    if (!shade) return;
    const type = $(this).data("copy");
    const value = type === "rgb" ? shade.rgbText : type === "code" ? shade.code : shade.hex;
    copyToClipboard(value);
  });

  $(window).on("resize", debounce(() => {
    renderDeck({ animate: false });
    setupDraggable();
  }, 160));
}

async function fetchShadeData() {
  const response = await fetch(DATA_URL, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Shade JSON failed with HTTP ${response.status}`);
  const payload = await response.json();
  const raw = extractShadeObjects(payload);
  return raw.map((item, index) => normalizeShade(item, index)).filter(Boolean);
}

function extractShadeObjects(payload) {
  const result = [];
  const seen = new WeakSet();

  function walk(node, context = {}) {
    if (!node || typeof node !== "object") return;
    if (seen.has(node)) return;
    seen.add(node);

    if (Array.isArray(node)) {
      node.forEach(child => walk(child, context));
      return;
    }

    const nextContext = {
      ...context,
      family: readAny(node, [
        "shadeFamily", "shadefamily", "shadeFamilyName", "family", "familyName", "colourFamily",
        "colorFamily", "colourFamilyName", "colorFamilyName", "filterName", "category", "categoryName",
        "shadeGroup", "shadeGroupName", "groupName"
      ]) || context.family
    };

    if (looksLikeShade(node)) {
      result.push({ ...node, __contextFamily: nextContext.family || context.family });
    }

    Object.entries(node).forEach(([key, value]) => {
      let childContext = nextContext;
      if (typeof value === "object" && value) {
        const prettyKey = prettifyKey(key);
        if (isLikelyFamilyName(prettyKey)) childContext = { ...nextContext, family: prettyKey };
      }
      walk(value, childContext);
    });
  }

  walk(payload);
  return result;
}

function looksLikeShade(obj) {
  const hasNameOrCode = Boolean(readAny(obj, [
    "shadeName", "shade_name", "name", "colourName", "colorName", "title", "shadeTitle", "label", "shade"
  ]) || readAny(obj, [
    "shadeCode", "shade_code", "code", "shadeNo", "shadeNumber", "colourCode", "colorCode", "shadeId", "id"
  ]));
  const hasColor = Boolean(extractHex(obj) || readAny(obj, ["rgb", "shadeRGB", "shadeRgb", "rgbValue", "colorRgb", "colourRgb"]));
  return hasNameOrCode && hasColor;
}

function normalizeShade(obj, index) {
  const hex = normalizeHex(extractHex(obj));
  if (!hex) return null;

  const code = cleanText(readAny(obj, [
    "shadeCode", "shade_code", "code", "shadeNo", "shadeNumber", "colourCode", "colorCode", "shadeId", "id", "sapCode"
  ])) || `C${String(index + 1).padStart(4, "0")}`;

  const name = cleanText(readAny(obj, [
    "shadeName", "shade_name", "name", "colourName", "colorName", "title", "shadeTitle", "label", "shade"
  ])) || `Shade ${code}`;

  const family = cleanText(readAny(obj, [
    "shadeFamily", "shadefamily", "shadeFamilyName", "family", "familyName", "colourFamily", "colorFamily",
    "colourFamilyName", "colorFamilyName", "filterName", "category", "categoryName", "shadeGroup", "shadeGroupName", "groupName"
  ]) || obj.__contextFamily) || autoFamily(hex);

  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  return {
    id: `${slugify(code)}-${slugify(name)}-${index}`,
    name,
    code: String(code).trim(),
    hex,
    family: normalizeFamily(family),
    rgb,
    rgbText: `${rgb.r}, ${rgb.g}, ${rgb.b}`,
    hsl,
    search: `${name} ${code} ${family}`.toLowerCase()
  };
}

function prepareShadeList(list) {
  const deduped = [];
  const seen = new Set();
  list.forEach((shade, index) => {
    const normalized = shade.rgb ? shade : normalizeShade(shade, index);
    if (!normalized) return;
    const key = `${normalized.code}|${normalized.name}|${normalized.hex}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push({ ...normalized, id: normalized.id || `${slugify(normalized.code)}-${index}` });
  });

  return deduped.sort((a, b) => {
    const familyCompare = a.family.localeCompare(b.family);
    if (familyCompare !== 0) return familyCompare;
    return a.name.localeCompare(b.name);
  });
}

function extractHex(obj) {
  const direct = readAny(obj, [
    "hex", "hexCode", "shadeHex", "shadeHexCode", "colorHex", "colourHex", "htmlColor", "htmlColour",
    "rgbHexCode", "rgbHex", "shadeRGB", "shadeRgb", "rgb", "rgbValue", "color", "colour", "value"
  ]);

  if (Array.isArray(direct)) return rgbArrayToHex(direct);
  if (typeof direct === "object" && direct) {
    const nestedHex = readAny(direct, ["hex", "hexCode", "value"]);
    if (nestedHex) return nestedHex;
    if (["r", "g", "b"].every(key => key in direct)) return rgbToHex(Number(direct.r), Number(direct.g), Number(direct.b));
  }
  if (typeof direct === "string") {
    if (/rgb\s*\(/i.test(direct)) return rgbStringToHex(direct);
    return direct;
  }
  return null;
}

function readAny(obj, keys) {
  if (!obj || typeof obj !== "object") return null;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== null && obj[key] !== undefined && obj[key] !== "") return obj[key];
  }
  const lowerMap = Object.keys(obj).reduce((acc, key) => {
    acc[key.toLowerCase()] = key;
    return acc;
  }, {});
  for (const key of keys) {
    const actual = lowerMap[key.toLowerCase()];
    if (actual && obj[actual] !== null && obj[actual] !== undefined && obj[actual] !== "") return obj[actual];
  }
  return null;
}

function buildFallbackSet() {
  const expanded = [];
  fallbackShades.forEach((shade, familyIndex) => {
    for (let i = 0; i < 5; i += 1) {
      const color = shiftColor(shade.hex, (i - 2) * 6, (i - 2) * -2);
      expanded.push({
        ...shade,
        id: `${shade.id}-${i}`,
        name: i === 2 ? shade.name : `${shade.name} ${i < 2 ? "Light" : "Deep"} ${Math.abs(i - 2)}`,
        code: `${shade.code}${i ? `-${i}` : ""}`,
        hex: color,
        family: shade.family || ["Blue", "Green", "Yellow", "Pink", "Neutral"][familyIndex % 5]
      });
    }
  });
  return expanded;
}

function buildCategoryTabs() {
  const familyCounts = new Map();
  state.all.forEach(shade => familyCounts.set(shade.family, (familyCounts.get(shade.family) || 0) + 1));
  const families = [...familyCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([family]) => family);
  const trendingFamilies = new Set(families.slice(0, 5));

  const tabs = ["All", ...families].map((family, index) => {
    const count = index === 0 ? state.all.length : familyCounts.get(family);
    const accent = familyAccent(family);
    const soft = shiftColor(accent, 34, -12);
    const deep = shiftColor(accent, -12, 6);
    const classes = ["tab", index === 0 ? "active" : "", index > 0 && trendingFamilies.has(family) ? "trending" : ""].filter(Boolean).join(" ");
    return `<button class="${classes}" type="button" role="tab" data-family="${escapeAttr(family)}" aria-selected="${index === 0}" style="--tab-accent:${accent};--tab-soft:${soft};--tab-deep:${deep};--tab-shadow:${hexToRgba(accent, .24)}">
      <span class="tab-dot" aria-hidden="true"></span>
      <span class="tab-label">${escapeHtml(family)}</span>
      <em>${count}</em>
    </button>`;
  }).join("");

  dom.tabs.html(tabs);
  dom.tabs.off("click", ".tab").on("click", ".tab", function () {
    applyFilter($(this).data("family"));
  });
}

function applyFilter(family, options = {}) {
  state.category = family || "All";
  state.favoritesOnly = false;
  dom.toggleFavorites.removeClass("active").find("i").attr("class", "ri-heart-3-line");

  dom.tabs.find(".tab").removeClass("active").attr("aria-selected", "false");
  dom.tabs.find(".tab").filter((_, tab) => $(tab).data("family") === state.category).addClass("active").attr("aria-selected", "true");

  state.filtered = state.category === "All"
    ? [...state.all]
    : state.all.filter(shade => shade.family === state.category);

  resetSelectionAfterFilter(options);
}

function toggleFavoritesFilter() {
  state.favoritesOnly = !state.favoritesOnly;
  dom.toggleFavorites.toggleClass("active", state.favoritesOnly)
    .find("i")
    .attr("class", state.favoritesOnly ? "ri-heart-3-fill" : "ri-heart-3-line");

  if (state.favoritesOnly) {
    state.filtered = state.all.filter(shade => state.favorites.has(shade.id));
    if (!state.filtered.length) {
      showToast("No favourites yet. Tap a heart on any shade to save one.");
      state.favoritesOnly = false;
      dom.toggleFavorites.removeClass("active").find("i").attr("class", "ri-heart-3-line");
      applyFilter(state.category, { silent: true });
      return;
    }
    dom.tabs.find(".tab").removeClass("active").attr("aria-selected", "false");
    resetSelectionAfterFilter();
  } else {
    applyFilter(state.category, { silent: true });
  }
}

function resetSelectionAfterFilter(options = {}) {
  if (!state.filtered.length) {
    state.selectedIndex = 0;
    state.selectedId = null;
    renderDeck({ animate: false });
    syncUi();
    return;
  }
  const preservedIndex = state.selectedId ? state.filtered.findIndex(shade => shade.id === state.selectedId) : -1;
  state.selectedIndex = preservedIndex >= 0 ? preservedIndex : 0;
  state.selectedId = state.filtered[state.selectedIndex].id;
  dom.range.attr({ min: 0, max: Math.max(0, state.filtered.length - 1) });
  renderDeck({ animate: !options.silent });
  syncUi();
}

function setSelectedIndex(index, options = {}) {
  if (!state.filtered.length) return;
  const nextIndex = clamp(Math.round(index), 0, state.filtered.length - 1);
  if (nextIndex === state.selectedIndex && options.source !== "force") {
    syncUi();
    return;
  }
  state.selectedIndex = nextIndex;
  state.selectedId = state.filtered[nextIndex].id;
  const animate = !["range", "scroll", "drag", "touch-swipe"].includes(options.source);
  renderDeck({ animate });
  syncUi();
}

function selectById(id, options = {}) {
  if (!id) return;
  let index = state.filtered.findIndex(shade => shade.id === id);
  const shade = state.all.find(item => item.id === id);

  if (index < 0 && shade) {
    if (state.favoritesOnly) toggleFavoritesFilter();
    if (state.category !== "All" && shade.family !== state.category) {
      applyFilter(shade.family, { silent: true });
    }
    index = state.filtered.findIndex(item => item.id === id);
  }

  if (index >= 0) {
    setSelectedIndex(index, { source: options.source || "select" });
    if (options.open) openModal(getSelectedShade());
  }
}

function stepShade(step) {
  setSelectedIndex(state.selectedIndex + step, { source: "step" });
}

function renderDeck(options = {}) {
  const shades = state.filtered;
  dom.fanDeck.empty();

  if (!shades.length) {
    dom.fanDeck.html(`<div class="empty-tray">No shades available</div>`);
    return;
  }

  const maxCards = window.matchMedia("(max-width: 820px)").matches ? MAX_CARDS_MOBILE : MAX_CARDS_DESKTOP;
  const visibleCount = Math.min(maxCards, shades.length);
  const half = Math.floor(visibleCount / 2);
  let start = clamp(state.selectedIndex - half, 0, Math.max(0, shades.length - visibleCount));
  const end = Math.min(start + visibleCount, shades.length);
  start = Math.max(0, end - visibleCount);

  const centerSlot = state.selectedIndex - start;
  const maxSpread = window.matchMedia("(max-width: 820px)").matches ? 58 : 63;
  const gap = visibleCount > 1 ? Math.min(6.2, (maxSpread * 2) / Math.max(1, visibleCount - 1)) : 0;
  const selectedShade = getSelectedShade();

  const html = [];
  for (let slot = 0; slot < end - start; slot += 1) {
    const shade = shades[start + slot];
    const rel = slot - centerSlot;
    const angle = rel * gap;
    const isActive = shade.id === selectedShade?.id;
    const isFavorite = state.favorites.has(shade.id);
    const isShortlisted = isShadeShortlisted(shade);
    const lift = isActive ? -20 : Math.max(-9, -Math.abs(rel) * 0.16);
    const z = 300 - Math.abs(rel);
    const tintA = shiftColor(shade.hex, 17, 6);
    const tintB = shiftColor(shade.hex, 10, 3);
    const tintC = shade.hex;
    const tintD = shiftColor(shade.hex, -8, -2);

    html.push(`
      <button class="fan-card${isActive ? " active" : ""}${isFavorite ? " favorite" : ""}${isShortlisted ? " shortlisted" : ""}" type="button"
        data-id="${escapeAttr(shade.id)}"
        title="${escapeAttr(`${shade.name} ${shade.code}`)}"
        style="--angle:${angle.toFixed(3)}deg;--lift:${lift}px;--card-bg:${shade.hex};z-index:${z};">
        <span class="card-fav" aria-label="Shortlist ${escapeAttr(shade.name)}"><i class="${isShortlisted ? "ri-check-line" : "ri-add-line"}"></i></span>
        <div class="card-cap" data-hex="${escapeAttr(tintA)}" data-role="Light top" data-label="${escapeAttr(`${shade.name} Light Top`)}" style="background:${tintA}"><span class="strip-code">${escapeHtml(shade.code)}</span><span class="strip-add" aria-hidden="true">+</span></div>
        <div class="card-strip" data-hex="${escapeAttr(tintA)}" data-role="Soft tint" data-label="${escapeAttr(`${shade.name} Soft Tint`)}" style="background:${tintA}"><span class="strip-code">${escapeHtml(shortCode(shade.code, 0))}</span><span class="strip-add" aria-hidden="true">+</span></div>
        <div class="card-strip" data-hex="${escapeAttr(tintB)}" data-role="Wall tone" data-label="${escapeAttr(`${shade.name} Wall Tone`)}" style="background:${tintB}"><span class="strip-code">${escapeHtml(shortCode(shade.code, 1))}</span><span class="strip-add" aria-hidden="true">+</span></div>
        <div class="card-strip" data-hex="${escapeAttr(tintC)}" data-role="Primary" data-label="${escapeAttr(shade.name)}" style="background:${tintC}"><span class="strip-code">${escapeHtml(shortCode(shade.code, 2))}</span><span class="strip-add" aria-hidden="true">+</span></div>
        <div class="card-strip" data-hex="${escapeAttr(tintD)}" data-role="Deep accent" data-label="${escapeAttr(`${shade.name} Deep Accent`)}" style="background:${tintD}"><span class="strip-code">${escapeHtml(shortCode(shade.code, 3))}</span><span class="strip-add" aria-hidden="true">+</span></div>
        <span class="card-name">${escapeHtml(shade.name)}</span>
      </button>`);
  }

  dom.fanDeck.html(html.join(""));

  if (window.gsap) {
    const spin = ((state.selectedIndex / Math.max(1, shades.length - 1)) * -10) + 5;
    gsap.to(dom.fanDeck[0], { "--deck-spin": `${spin}deg`, duration: options.animate === false ? 0 : 0.55, ease: "power3.out" });
    gsap.fromTo(dom.fanDeck.find(".fan-card"),
      { y: options.animate === false ? 0 : 18, opacity: options.animate === false ? 1 : 0.75 },
      { y: 0, opacity: 1, duration: options.animate === false ? 0 : 0.42, ease: "power3.out", stagger: { each: 0.006, from: "center" } }
    );
  }
}

function syncUi() {
  const shade = getSelectedShade();
  const total = state.filtered.length;
  const index = total ? state.selectedIndex + 1 : 0;
  const progress = total > 1 ? state.selectedIndex / (total - 1) : 0;

  dom.range.attr({ min: 0, max: Math.max(0, total - 1) }).val(state.selectedIndex);
  dom.rangeCount.text(`${index} / ${total}`);
  dom.progressText.text(shade ? `${shade.name} · ${shade.code}` : "No shade selected");
  dom.shadeTotal.text(`${total} shade${total === 1 ? "" : "s"}`);
  dom.progressFill.css("width", `${progress * 100}%`);
  dom.progressKnob.css("left", `${progress * 100}%`);

  renderSelectedPalette();

  if (!shade) return;

  const textColor = readableText(shade.hex);
  dom.beaconSwatch.css("background", shade.hex);
  dom.beaconName.text(shade.name);
  dom.beaconMeta.text(`${shade.family} · ${shade.code} · ${shade.hex.toUpperCase()}`);
  dom.activeFamily.text(shade.family);
  dom.activeName.text(shade.name);
  dom.activeCode.text(`Shade code ${shade.code}`);
  dom.activeHex.text(shade.hex.toUpperCase());
  dom.activeRgb.text(shade.rgbText);
  dom.previewWall.css("--preview-color", shade.hex);
  const shadeShortlisted = isShadeShortlisted(shade);
  dom.favoriteCurrent.toggleClass("active", shadeShortlisted)
    .attr("aria-label", shadeShortlisted ? "Colour already shortlisted" : "Shortlist selected colour")
    .find("i")
    .attr("class", shadeShortlisted ? "ri-check-line" : "ri-add-line");

  dom.selectedBeacon.css({ color: textColor === "#ffffff" ? "#0f172a" : "#0f172a" });
}

function openModal(shade) {
  if (!shade) return;
  closeSelectionModal();
  dom.overlay.css("--modal-color", shade.hex);
  dom.overlay.find(".shade-modal").css("--modal-color", shade.hex);
  dom.modalSwatch.css("--modal-color", shade.hex);
  dom.modalFamily.text(shade.family);
  dom.modalShadeName.text(shade.name);
  dom.modalShadeCode.text(`Shade code ${shade.code}`);
  dom.modalHex.text(shade.hex.toUpperCase());
  dom.modalRgb.text(shade.rgbText);
  dom.modalCode.text(shade.code);
  updateModalShortlistState(shade);

  buildSmartPalette(shade);
  renderSelectedPalette();
  dom.body.addClass("modal-open");
  dom.overlay.addClass("active").attr("aria-hidden", "false");

  const modalNode = dom.overlay.find(".shade-modal")[0];
  const modalContentNode = dom.overlay.find(".modal-content")[0];
  if (modalNode) modalNode.scrollTop = 0;
  if (modalContentNode) modalContentNode.scrollTop = 0;

  if (window.gsap) {
    gsap.fromTo(".shade-modal", { y: 26, scale: .96, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: .36, ease: "power3.out" });
  }
}

function closeModal() {
  if (!dom.overlay.hasClass("active")) return;
  if (window.gsap) {
    gsap.to(".shade-modal", { y: 18, scale: .98, opacity: 0, duration: .2, ease: "power2.in", onComplete: () => {
      dom.overlay.removeClass("active").attr("aria-hidden", "true");
      if (!dom.selectionOverlay.hasClass("active")) dom.body.removeClass("modal-open");
    } });
  } else {
    dom.overlay.removeClass("active").attr("aria-hidden", "true");
    if (!dom.selectionOverlay.hasClass("active")) dom.body.removeClass("modal-open");
  }
}

function openSelectionModal() {
  renderSelectedPalette();
  closeModal();
  dom.body.addClass("modal-open");
  dom.selectionOverlay.addClass("active").attr("aria-hidden", "false");
  const selectionNode = dom.selectionOverlay.find(".selection-modal")[0];
  if (selectionNode) selectionNode.scrollTop = 0;
  if (window.gsap) {
    gsap.fromTo(".selection-modal", { y: 24, scale: .97, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: .34, ease: "power3.out" });
  }
}

function closeSelectionModal(options = {}) {
  if (!dom.selectionOverlay.hasClass("active")) return;
  const complete = () => {
    dom.selectionOverlay.removeClass("active").attr("aria-hidden", "true");
    if (!dom.overlay.hasClass("active")) dom.body.removeClass("modal-open");
  };
  if (options.instant || !window.gsap) {
    complete();
    return;
  }
  gsap.to(".selection-modal", { y: 18, scale: .98, opacity: 0, duration: .2, ease: "power2.in", onComplete: complete });
}

function shortlistShade(shade, origin) {
  if (!shade) return;
  savePaletteColor(shadeToPaletteItem(shade, { role: "Shortlisted shade", source: "Fan plus" }), {
    origin,
    toast: (colour, added) => added ? `Shortlisted colour: ${colour.name}.` : `${colour.name} is already shortlisted and moved to the front.`
  });
}

function isShadeShortlisted(shade) {
  if (!shade) return false;
  return state.selectedPalette.some(item => item.shadeId === shade.id || item.hex === shade.hex);
}

function updateModalShortlistState(shade) {
  if (!shade || !dom.modalFavorite?.length) return;
  const shortlisted = isShadeShortlisted(shade);
  dom.modalFavorite.toggleClass("saved", shortlisted)
    .html(`<i class="${shortlisted ? "ri-check-line" : "ri-add-line"}" aria-hidden="true"></i> ${shortlisted ? "Shortlisted" : "Shortlist shade"}`);
}

function buildSmartPalette(shade) {
  if (!shade) {
    state.currentSmartPalette = [];
    dom.smartPalette.empty();
    return;
  }
  const base = shade.hex;
  const palette = [
    shadeToPaletteItem(shade, { role: "Primary", source: "Selected shade", hex: base, name: shade.name, featured: true }),
    shadeToPaletteItem(shade, { role: "Soft wall", source: "Smart palette", hex: shiftColor(base, 24, -8), name: `${shade.name} Mist`, wide: true }),
    shadeToPaletteItem(shade, { role: "Warm accent", source: "Smart palette", hex: shiftHue(base, 38, 5, 4), name: `${shade.name} Warm Accent` }),
    shadeToPaletteItem(shade, { role: "Cool contrast", source: "Smart palette", hex: shiftHue(base, 182, -1, -5), name: `${shade.name} Contrast` }),
    shadeToPaletteItem(shade, { role: "Deep trim", source: "Smart palette", hex: shiftColor(base, -18, 5), name: `${shade.name} Deep Trim`, wide: true })
  ].map(item => ({ ...item, key: paletteKey(item) }));

  state.currentSmartPalette = palette;

  dom.smartPalette.html(palette.map((item, index) => {
    const text = readableText(item.hex);
    const ratio = contrastRatio(item.hex, text);
    const saved = hasPaletteColor(item.key) || hasPaletteColor(item.hex);
    const classes = ["palette-tile", item.featured ? "featured" : "", item.wide ? "wide" : "", saved ? "saved" : ""].filter(Boolean).join(" ");
    return `<button class="${classes}" type="button" data-key="${escapeAttr(item.key)}" style="--tile-bg:${item.hex};--tile-text:${text};" title="Save ${escapeAttr(item.name)}">
      <span class="tile-top">
        <span class="tile-copy">
          <span class="tile-role">${escapeHtml(item.role)}</span>
          <span class="tile-name">${escapeHtml(item.name)}</span>
        </span>
        <span class="contrast-pill">${contrastGrade(ratio)} ${ratio.toFixed(1)}</span>
      </span>
      <span class="tile-bottom">
        <span class="tile-meta">${escapeHtml(item.hex.toUpperCase())}</span>
        <span class="tile-save"><i class="${saved ? "ri-check-line" : "ri-heart-3-line"}" aria-hidden="true"></i>${saved ? "Saved" : "Save"}</span>
      </span>
    </button>`;
  }).join(""));

  dom.smartPalette.off("click", ".palette-tile").on("click", ".palette-tile", function () {
    const key = String($(this).data("key"));
    const item = state.currentSmartPalette.find(color => color.key === key);
    if (!item) return;
    savePaletteColor(item, {
      origin: this,
      toast: (colour, added) => added ? `Shortlisted colour: ${colour.name}.` : `${colour.name} is already shortlisted and moved to the front.`
    });
  });
}

function toggleFavorite(shade) {
  if (!shade) return;
  const willSave = !state.favorites.has(shade.id);
  if (willSave) {
    state.favorites.add(shade.id);
    savePaletteColor(shadeToPaletteItem(shade, { role: "Favourite shade", source: "Heart" }), { silent: true });
    showToast(`${shade.name} saved.`);
  } else {
    state.favorites.delete(shade.id);
    showToast(`${shade.name} removed from favourites.`);
  }
  haptic();
  persistFavorites();
  renderDeck({ animate: false });
  syncUi();
  if (dom.overlay.hasClass("active")) openModal(getSelectedShade());
}

function loadFavorites() {
  try {
    const stored = JSON.parse(localStorage.getItem(FAVORITE_KEY) || "[]");
    state.favorites = new Set(Array.isArray(stored) ? stored : []);
  } catch (_) {
    state.favorites = new Set();
  }
}

function persistFavorites() {
  localStorage.setItem(FAVORITE_KEY, JSON.stringify([...state.favorites]));
}

function loadSelectedPalette() {
  try {
    const stored = JSON.parse(localStorage.getItem(PALETTE_KEY) || "[]");
    state.selectedPalette = Array.isArray(stored)
      ? stored.map(item => normalizePaletteItem(item)).filter(Boolean).slice(0, MAX_SELECTION)
      : [];
  } catch (_) {
    state.selectedPalette = [];
  }
}

function persistSelectedPalette() {
  localStorage.setItem(PALETTE_KEY, JSON.stringify(state.selectedPalette));
}

function shadeToPaletteItem(shade, overrides = {}) {
  const hex = normalizeHex(overrides.hex || shade.hex) || shade.hex;
  return normalizePaletteItem({
    shadeId: shade.id,
    name: overrides.name || shade.name,
    code: overrides.code || shade.code,
    family: shade.family,
    role: overrides.role || "Shade",
    source: overrides.source || "Fandeck",
    hex,
    featured: Boolean(overrides.featured),
    wide: Boolean(overrides.wide)
  });
}

function paletteItemFromElement(shade, element) {
  const target = $(element);
  const hex = normalizeHex(target.data("hex")) || shade.hex;
  const role = cleanText(target.data("role")) || "Sample";
  const name = cleanText(target.data("label")) || `${shade.name} ${role}`;
  return shadeToPaletteItem(shade, { hex, role, name, source: "Fan strip" });
}

function normalizePaletteItem(item) {
  if (!item || !item.hex) return null;
  const hex = normalizeHex(item.hex);
  if (!hex) return null;
  const safe = {
    shadeId: item.shadeId || item.id || null,
    name: cleanText(item.name) || "Selected colour",
    code: cleanText(item.code) || "Custom",
    family: cleanText(item.family) || "Palette",
    role: cleanText(item.role) || "Sample",
    source: cleanText(item.source) || "Palette",
    hex,
    featured: Boolean(item.featured),
    wide: Boolean(item.wide)
  };
  safe.key = item.key || paletteKey(safe);
  return safe;
}

function paletteKey(item) {
  return `${slugify(item.shadeId || item.code || item.name)}-${normalizeHex(item.hex)?.replace("#", "") || "colour"}-${slugify(item.role || "sample")}`;
}

function hasPaletteColor(keyOrHex) {
  const normalizedHex = normalizeHex(keyOrHex);
  return state.selectedPalette.some(item => normalizedHex ? item.hex === normalizedHex : item.key === keyOrHex);
}

function savePaletteColor(item, options = {}) {
  const normalized = normalizePaletteItem(item);
  if (!normalized) return;

  const existingIndex = state.selectedPalette.findIndex(color => color.key === normalized.key || color.hex === normalized.hex);
  let added = false;
  if (existingIndex >= 0) {
    state.selectedPalette.splice(existingIndex, 1);
    state.selectedPalette.unshift(normalized);
  } else {
    state.selectedPalette.unshift(normalized);
    added = true;
    if (state.selectedPalette.length > MAX_SELECTION) state.selectedPalette.length = MAX_SELECTION;
  }

  persistSelectedPalette();
  renderSelectedPalette();
  buildSmartPalette(getSelectedShade());

  if (!options.silent) {
    const customToast = typeof options.toast === "function" ? options.toast(normalized, added) : options.toast;
    showToast(customToast || (added ? `Shortlisted colour: ${normalized.name}.` : `${normalized.name} moved to the top of your shortlist.`));
  }
  haptic();
  animateSaved(options.origin);
  const savedTile = dom.smartPalette.find(`[data-key="${cssEscape(normalized.key)}"]`);
  if (savedTile.length) animateSaved(savedTile[0]);
  updateModalShortlistState(getSelectedShade());
  setTimeout(() => renderDeck({ animate: false }), 180);
  if (options.open) openModal(getSelectedShade());
}

function removePaletteColor(key) {
  const before = state.selectedPalette.length;
  state.selectedPalette = state.selectedPalette.filter(item => item.key !== key);
  if (state.selectedPalette.length === before) return;
  persistSelectedPalette();
  renderSelectedPalette();
  buildSmartPalette(getSelectedShade());
  renderDeck({ animate: false });
  updateModalShortlistState(getSelectedShade());
  showToast("Colour removed from selection.");
}

function clearSelectedPalette() {
  if (!state.selectedPalette.length) return;
  state.selectedPalette = [];
  persistSelectedPalette();
  renderSelectedPalette();
  buildSmartPalette(getSelectedShade());
  renderDeck({ animate: false });
  updateModalShortlistState(getSelectedShade());
  showToast("Colour selection cleared.");
}

function renderSelectedPalette() {
  const count = state.selectedPalette.length;
  const countText = `${count} colour${count === 1 ? "" : "s"}`;
  if (dom.selectionCount?.length) dom.selectionCount.text(countText);
  if (dom.clearSelection?.length) dom.clearSelection.prop("disabled", count === 0);
  if (dom.paletteHint?.length) {
    dom.paletteHint.text(count ? `${countText} shortlisted. Tap the blue header CTA to review.` : "Tap the + on a fan card or a smart palette tile to shortlist colours.");
  }
  if (dom.selectionBadge?.length) {
    dom.selectionBadge.text(count).toggleClass("hidden", count === 0).addClass("bump");
    clearTimeout(renderSelectedPalette.badgeTimer);
    renderSelectedPalette.badgeTimer = setTimeout(() => dom.selectionBadge.removeClass("bump"), 520);
  }

  const selectionPanel = dom.selectionBento?.closest(".selection-preview");
  if (selectionPanel?.length) selectionPanel.toggleClass("has-selection", count > 0);

  if (dom.selectionBento?.length) {
    if (!count) {
      dom.selectionBento.html(`<div class="empty-selection">No colours selected yet. Tap the + on a fandeck card or a smart palette tile.</div>`);
    } else {
      dom.selectionBento.html(state.selectedPalette.map((item, index) => selectionCardMarkup(item, index)).join(""));
    }
  }

  if (dom.favoriteTray?.length) {
    if (!count) {
      dom.favoriteTray.html(`<span class="empty-tray">No colours selected yet</span>`);
    } else {
      dom.favoriteTray.html(state.selectedPalette.slice(0, 6).map(item => `
        <button class="selection-mini" type="button" data-shade-id="${escapeAttr(item.shadeId || "")}" title="${escapeAttr(`${item.name} ${item.hex.toUpperCase()}`)}">
          <span class="selection-mini-swatch" style="background:${item.hex}"></span>
          <span class="selection-mini-text"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.hex.toUpperCase())}</small></span>
          <i class="ri-arrow-right-up-line" aria-hidden="true"></i>
        </button>
      `).join(""));
    }
  }
}

function selectionCardMarkup(item, index) {
  const text = readableText(item.hex);
  const ratio = contrastRatio(item.hex, text);
  const classes = ["selection-card", index === 0 ? "primary" : ""].filter(Boolean).join(" ");
  return `<article class="${classes}" data-shade-id="${escapeAttr(item.shadeId || "")}" style="--tile-bg:${item.hex};--tile-text:${text};">
    <button class="remove-selection" type="button" data-key="${escapeAttr(item.key)}" aria-label="Remove ${escapeAttr(item.name)}"><i class="ri-subtract-line" aria-hidden="true"></i></button>
    <div>
      <span class="tile-role">${escapeHtml(item.role)}</span>
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.code)} · ${escapeHtml(item.hex.toUpperCase())}</p>
    </div>
    <span class="contrast-pill">${contrastGrade(ratio)} contrast · ${ratio.toFixed(1)}:1</span>
  </article>`;
}

function animateSaved(origin) {
  if (origin) {
    const node = $(origin);
    node.addClass("just-saved saved-pulse");
    setTimeout(() => node.removeClass("just-saved saved-pulse"), 650);
  }
  if (window.gsap && dom.openDetails?.length) {
    gsap.fromTo(dom.openDetails[0], { scale: .92 }, { scale: 1, duration: .42, ease: "elastic.out(1, .5)" });
  }
}

function haptic() {
  if (navigator.vibrate) navigator.vibrate(18);
}


function handleSearchInput() {
  const query = dom.search.val().trim().toLowerCase();
  state.lastQuery = query;
  dom.clearSearch.toggleClass("hidden", !query);

  if (!query) {
    dom.suggestions.hide().empty();
    return;
  }

  const matches = state.all
    .filter(shade => shade.search.includes(query))
    .slice(0, 9);

  if (!matches.length) {
    dom.suggestions.html(`<div class="suggestion-item"><span></span><strong>No shade found</strong><small>Try a family, colour name, or code.</small></div>`).show();
    return;
  }

  dom.suggestions.html(matches.map(shade => `
    <button class="suggestion-item" type="button" data-id="${escapeAttr(shade.id)}">
      <span class="suggestion-swatch" style="background:${shade.hex}"></span>
      <span><strong>${escapeHtml(shade.name)}</strong><small>${escapeHtml(shade.family)} · ${escapeHtml(shade.hex.toUpperCase())}</small></span>
      <em>${escapeHtml(shade.code)}</em>
    </button>
  `).join("")).show();
}

function clearSearch() {
  dom.search.val("");
  dom.clearSearch.addClass("hidden");
  dom.suggestions.hide().empty();
}

function setupGsapIntro() {
  if (!window.gsap) return;
  gsap.from(".brand, .title-block, .search-wrap, .approve-btn", { y: -18, opacity: 0, duration: .55, ease: "power3.out", stagger: .05 });
  gsap.from(".hero-copy > *, .control-row, .deck-section", { y: 22, opacity: 0, duration: .7, ease: "power3.out", stagger: .08, delay: .08 });
}

function setupDraggable() {
  if (state.dragProxy) {
    state.dragProxy.kill();
    state.dragProxy = null;
  }

  dom.fanStage.off(".swipeBrowse");
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;

  if (isTouchDevice) {
    setupNativeSwipeBrowsing();
    return;
  }

  if (!window.gsap || !window.Draggable) {
    setupNativeSwipeBrowsing();
    return;
  }

  const proxy = document.createElement("div");
  let startIndex = 0;
  let lastX = 0;
  let hasDragged = false;

  state.dragProxy = Draggable.create(proxy, {
    trigger: dom.fanStage[0],
    type: "x",
    inertia: false,
    allowNativeTouchScrolling: true,
    minimumMovement: 6,
    onPress() {
      state.isDragging = true;
      startIndex = state.selectedIndex;
      lastX = this.x;
      hasDragged = false;
      dom.fanStage.addClass("dragging");
    },
    onDrag() {
      const distance = this.x - lastX;
      if (Math.abs(distance) > 6) hasDragged = true;
      const stepSize = 28;
      const next = startIndex - Math.round(distance / stepSize);
      setSelectedIndex(next, { source: "drag" });
    },
    onRelease() {
      state.isDragging = false;
      dom.fanStage.removeClass("dragging");
      if (hasDragged) state.suppressFanClickUntil = Date.now() + 260;
      gsap.set(proxy, { x: 0 });
    }
  })[0];
}

function setupNativeSwipeBrowsing() {
  const stage = dom.fanStage[0];
  let active = false;
  let horizontal = false;
  let startX = 0;
  let startY = 0;
  let startIndex = 0;
  let pointerId = null;

  function beginSwipe(clientX, clientY, id) {
    active = true;
    horizontal = false;
    pointerId = id;
    startX = clientX;
    startY = clientY;
    startIndex = state.selectedIndex;
    state.isDragging = false;
    if (id !== null && id !== undefined && stage.setPointerCapture) {
      try { stage.setPointerCapture(id); } catch (_) {}
    }
  }

  function moveSwipe(clientX, clientY, event) {
    if (!active) return;
    const dx = clientX - startX;
    const dy = clientY - startY;

    if (!horizontal && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.18) {
      horizontal = true;
      state.isDragging = true;
      dom.fanStage.addClass("dragging");
    }

    if (!horizontal) return;
    if (event && event.preventDefault) event.preventDefault();
    const stepSize = window.matchMedia("(max-width: 520px)").matches ? 24 : 30;
    const next = startIndex - Math.round(dx / stepSize);
    setSelectedIndex(next, { source: "touch-swipe" });
  }

  function endSwipe() {
    if (!active) return;
    active = false;
    if (horizontal) state.suppressFanClickUntil = Date.now() + 320;
    horizontal = false;
    state.isDragging = false;
    dom.fanStage.removeClass("dragging");
    if (pointerId !== null && pointerId !== undefined && stage.releasePointerCapture) {
      try { stage.releasePointerCapture(pointerId); } catch (_) {}
    }
    pointerId = null;
  }

  if (window.PointerEvent) {
    dom.fanStage.on("pointerdown.swipeBrowse", function (event) {
      const e = event.originalEvent;
      if (!e || e.pointerType === "mouse") return;
      beginSwipe(e.clientX, e.clientY, e.pointerId);
    });

    dom.fanStage.on("pointermove.swipeBrowse", function (event) {
      const e = event.originalEvent;
      if (!e) return;
      moveSwipe(e.clientX, e.clientY, event);
    });

    dom.fanStage.on("pointerup.swipeBrowse pointercancel.swipeBrowse pointerleave.swipeBrowse", endSwipe);
    return;
  }

  dom.fanStage.on("touchstart.swipeBrowse", function (event) {
    const touch = event.originalEvent?.touches?.[0];
    if (!touch) return;
    beginSwipe(touch.clientX, touch.clientY, null);
  });

  dom.fanStage.on("touchmove.swipeBrowse", function (event) {
    const touch = event.originalEvent?.touches?.[0];
    if (!touch) return;
    moveSwipe(touch.clientX, touch.clientY, event);
  });

  dom.fanStage.on("touchend.swipeBrowse touchcancel.swipeBrowse", endSwipe);
}

function shouldSuppressFanClick() {
  return state.isDragging || Date.now() < state.suppressFanClickUntil;
}

function pulseDeck() {
  if (!window.gsap) return;
  gsap.fromTo(dom.fanDeck[0], { scale: .97 }, { scale: 1, duration: .55, ease: "elastic.out(1, .6)" });
}

function setLoading(isLoading) {
  if (!isLoading) return;
  dom.progressText.text("Loading live colour catalogue...");
  dom.beaconName.text("Loading shades");
  dom.beaconMeta.text("Connecting to shade listing");
}

function getSelectedShade() {
  return state.filtered[state.selectedIndex] || null;
}

function copyToClipboard(value) {
  if (!value) return;
  const done = () => showToast(`${value} copied.`);
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(String(value)).then(done).catch(() => fallbackCopy(value, done));
  } else {
    fallbackCopy(value, done);
  }
}

function fallbackCopy(value, done) {
  const input = document.createElement("textarea");
  input.value = value;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
  done();
}

function showToast(message) {
  dom.toast.text(message).addClass("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => dom.toast.removeClass("show"), 2200);
}

function debounce(fn, wait) {
  let timer;
  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function cleanText(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeFamily(family) {
  const text = cleanText(family) || "Other";
  const known = {
    grey: "Grey",
    gray: "Grey",
    blue: "Blue",
    brown: "Brown",
    red: "Pink And Red",
    pink: "Pink And Red",
    "pink and red": "Pink And Red",
    orange: "Orange",
    yellow: "Yellow",
    green: "Green",
    teal: "Teal",
    purple: "Purple",
    white: "Whites",
    whites: "Whites",
    "off white": "Off Whites",
    "off whites": "Off Whites",
    neutral: "Neutrals",
    neutrals: "Neutrals"
  };
  const lower = text.toLowerCase();
  return known[lower] || text.replace(/\b\w/g, char => char.toUpperCase());
}

function autoFamily(hex) {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  if (l > 92 && s < 30) return "Whites";
  if (s < 12) return "Grey";
  if (h >= 345 || h < 14) return "Pink And Red";
  if (h < 42) return "Orange";
  if (h < 68) return "Yellow";
  if (h < 145) return "Green";
  if (h < 188) return "Teal";
  if (h < 245) return "Blue";
  if (h < 304) return "Purple";
  return "Pink And Red";
}

function isLikelyFamilyName(key) {
  const normalized = key.toLowerCase();
  return ["grey", "gray", "blue", "brown", "red", "pink", "pink and red", "orange", "yellow", "green", "teal", "purple", "whites", "white", "off whites", "off white", "neutral", "neutrals"].includes(normalized);
}

function prettifyKey(key) {
  return cleanText(key.replace(/([a-z])([A-Z])/g, "$1 $2"));
}

function normalizeHex(value) {
  if (!value) return null;
  let hex = String(value).trim();
  if (/^[0-9a-f]{6}$/i.test(hex)) hex = `#${hex}`;
  if (/^[0-9a-f]{3}$/i.test(hex)) hex = `#${hex}`;
  if (!/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(hex)) return null;
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex.toLowerCase();
}

function hexToRgb(hex) {
  const safe = normalizeHex(hex) || "#000000";
  const value = safe.slice(1);
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map(num => clamp(Math.round(num), 0, 255).toString(16).padStart(2, "0")).join("")}`;
}

function rgbArrayToHex(arr) {
  if (arr.length < 3) return null;
  return rgbToHex(Number(arr[0]), Number(arr[1]), Number(arr[2]));
}

function rgbStringToHex(value) {
  const matches = String(value).match(/\d+(?:\.\d+)?/g);
  if (!matches || matches.length < 3) return null;
  return rgbToHex(Number(matches[0]), Number(matches[1]), Number(matches[2]));
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > .5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;

  if (s === 0) {
    const value = Math.round(l * 255);
    return { r: value, g: value, b: value };
  }

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < .5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
  };
}

function shiftColor(hex, lightnessDelta = 0, saturationDelta = 0) {
  if (window.tinycolor) {
    const color = tinycolor(hex);
    if (lightnessDelta >= 0) color.lighten(lightnessDelta);
    else color.darken(Math.abs(lightnessDelta));
    if (saturationDelta >= 0) color.saturate(saturationDelta);
    else color.desaturate(Math.abs(saturationDelta));
    return color.toHexString();
  }
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const shifted = hslToRgb(hsl.h, hsl.s + saturationDelta, hsl.l + lightnessDelta);
  return rgbToHex(shifted.r, shifted.g, shifted.b);
}

function shiftHue(hex, hueDelta = 0, lightnessDelta = 0, saturationDelta = 0) {
  if (window.tinycolor) {
    const color = tinycolor(hex).spin(hueDelta);
    if (lightnessDelta >= 0) color.lighten(lightnessDelta);
    else color.darken(Math.abs(lightnessDelta));
    if (saturationDelta >= 0) color.saturate(saturationDelta);
    else color.desaturate(Math.abs(saturationDelta));
    return color.toHexString();
  }
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const shifted = hslToRgb(hsl.h + hueDelta, hsl.s + saturationDelta, hsl.l + lightnessDelta);
  return rgbToHex(shifted.r, shifted.g, shifted.b);
}

function readableText(hex) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > .58 ? "#0f172a" : "#ffffff";
}

function familyAccent(family = "All") {
  const lower = String(family).toLowerCase();
  if (lower.includes("all")) return "#2563eb";
  if (lower.includes("blue")) return "#1d6fb8";
  if (lower.includes("brown")) return "#8b5a3c";
  if (lower.includes("grey") || lower.includes("gray")) return "#64748b";
  if (lower.includes("orange")) return "#f97316";
  if (lower.includes("pink") || lower.includes("red")) return "#db2777";
  if (lower.includes("purple") || lower.includes("violet")) return "#7c3aed";
  if (lower.includes("green")) return "#16a34a";
  if (lower.includes("teal")) return "#0f9f9a";
  if (lower.includes("yellow")) return "#ca8a04";
  if (lower.includes("white")) return "#94a3b8";
  if (lower.includes("neutral")) return "#a16207";
  return "#075da7";
}

function hexToRgba(hex, alpha = 1) {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1)})`;
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const convert = value => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * convert(r) + 0.0722 * convert(b) + 0.7152 * convert(g);
}

function contrastRatio(backgroundHex, textHex) {
  const bg = relativeLuminance(backgroundHex);
  const fg = relativeLuminance(textHex);
  const lighter = Math.max(bg, fg);
  const darker = Math.min(bg, fg);
  return (lighter + 0.05) / (darker + 0.05);
}

function contrastGrade(ratio) {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "Large";
  return "Low";
}

function shortCode(code, offset) {
  const clean = String(code || "").replace(/\s+/g, "");
  if (clean.length <= 6) return offset ? `${clean}` : clean;
  return `${clean.slice(0, 4)}${offset}`;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "shade";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function cssEscape(value) {
  if (window.CSS?.escape) return CSS.escape(String(value));
  return String(value).replace(/"/g, "\\\"");
}
