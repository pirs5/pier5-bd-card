const BASE_WIDTH = 4022;
const BASE_HEIGHT = 2272;
const EXPORT_WIDTH = 1920;
const EXPORT_HEIGHT = 1080;
const BG = "#f1f1e4";
const DEFAULT_NAME = "ГЕРАААА";

const ASSETS = {
  stripes: "https://www.figma.com/api/mcp/asset/11d5c7d0-7d2a-45bc-882b-198622a486ff",
  hero: "https://www.figma.com/api/mcp/asset/b287ac84-fadd-4c30-bec9-14d71244307c",
  logo: "https://www.figma.com/api/mcp/asset/74818229-32a7-4369-8c8e-63c9aa0ded5e",
};

const card = document.getElementById("card");
const nameInput = document.getElementById("personName");
const nameLine = document.getElementById("nameLine");
const downloadBtn = document.getElementById("downloadBtn");
const statusEl = document.getElementById("status");

const setStatus = (text) => {
  statusEl.textContent = text;
};

const normalizeName = (raw) => {
  const clean = raw.replace(/\s+/g, " ").trim();
  const base = clean || DEFAULT_NAME;
  return `${base.toUpperCase()}!`;
};

const updatePreviewName = () => {
  nameLine.textContent = normalizeName(nameInput.value);
};

const ensureNameValue = () => {
  const clean = nameInput.value.replace(/\s+/g, " ").trim();
  if (!clean) {
    nameInput.value = DEFAULT_NAME;
  }
  updatePreviewName();
};

const updateScale = () => {
  const width = card.getBoundingClientRect().width;
  card.style.setProperty("--scale", width / BASE_WIDTH);
};

const createImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Image load failed: ${src}`));
    img.src = src;
  });

const fetchObjectUrl = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Asset fetch failed: ${url}`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

const roundedRect = (ctx, x, y, w, h, r) => {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
};

const drawCard = async () => {
  const objectUrls = [];

  try {
    const [stripesUrl, heroUrl, logoUrl] = await Promise.all([
      fetchObjectUrl(ASSETS.stripes),
      fetchObjectUrl(ASSETS.hero),
      fetchObjectUrl(ASSETS.logo),
    ]);

    objectUrls.push(stripesUrl, heroUrl, logoUrl);

    const [stripesImg, heroImg, logoImg] = await Promise.all([
      createImage(stripesUrl),
      createImage(heroUrl),
      createImage(logoUrl),
    ]);

    const canvas = document.createElement("canvas");
    canvas.width = EXPORT_WIDTH;
    canvas.height = EXPORT_HEIGHT;
    const ctx = canvas.getContext("2d");
    const sx = EXPORT_WIDTH / BASE_WIDTH;
    const sy = EXPORT_HEIGHT / BASE_HEIGHT;
    const tx = (value) => value * sx;
    const ty = (value) => value * sy;

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

    ctx.drawImage(stripesImg, tx(0), ty(252), tx(334), ty(107));

    const heroX = 2211;
    const heroY = 118;
    const heroW = 1679;
    const heroH = 2036;
    ctx.save();
    roundedRect(ctx, tx(heroX), ty(heroY), tx(heroW), ty(heroH), tx(235));
    ctx.clip();
    ctx.drawImage(heroImg, tx(heroX), ty(heroY), tx(heroW), ty(heroH));
    ctx.restore();

    ctx.fillStyle = BG;
    roundedRect(ctx, tx(2804), ty(882), tx(600), ty(600), tx(158));
    ctx.fill();

    ctx.drawImage(logoImg, tx(2968), ty(1001), tx(272), ty(361));

    await document.fonts.ready;

    ctx.fillStyle = "#111111";
    ctx.textBaseline = "top";
    ctx.font = `400 ${ty(155)}px 'Manrope Pier 5 Display', 'Manrope', sans-serif`;
    ctx.fillText("С ДНЕМ РОЖДЕНИЯ,", tx(399), ty(624));
    ctx.fillText(normalizeName(nameInput.value), tx(399), ty(800));

    const bodyLines = [
      "От всей нашей команды",
      "желаем жизненного оптимизма,",
      "доброй удачи на пути, успешной",
      "реализации идей и планов, ярких",
      "впечатлений и положительных",
      "эмоций.",
    ];

    ctx.font = `400 ${ty(95)}px 'Manrope', 'Segoe UI', sans-serif`;
    bodyLines.forEach((line, i) => {
      ctx.fillText(line, tx(399), ty(1171 + i * 110));
    });

    return canvas;
  } finally {
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }
};

const downloadPng = async () => {
  downloadBtn.disabled = true;
  setStatus("Собираю PNG...");

  try {
    const canvas = await drawCard();
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `bd-card-${Date.now()}.png`;
    link.click();
    setStatus("PNG сохранен");
  } catch (err) {
    console.error(err);
    setStatus("Ошибка экспорта");
    alert("Не удалось экспортировать PNG");
  } finally {
    downloadBtn.disabled = false;
  }
};

nameInput.addEventListener("input", updatePreviewName);
nameInput.addEventListener("blur", ensureNameValue);
nameInput.addEventListener("change", ensureNameValue);
downloadBtn.addEventListener("click", downloadPng);
window.addEventListener("resize", updateScale);

updatePreviewName();
updateScale();
