class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }
  playJump() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(350, t);
    osc.frequency.exponentialRampToValueAtTime(750, t + 0.12);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }
  playCoin() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;
    [987.77, 1318.51].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);
      gain.gain.setValueAtTime(0.25, t + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.01, t + idx * 0.06 + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.15);
    });
  }
  playScore() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, t);
    osc.frequency.exponentialRampToValueAtTime(1046.5, t + 0.18);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.18);
  }
  playCrash() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(40, t + 0.35);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  }
}
const sound = new SoundEngine();

const I18N = {
  vi: {
    title: "FLAPPY BIRD",
    subtitle: "WORLD CHAMPIONSHIP • NEON EDITION",
    play: "CHƠI NGAY (SPACE)",
    leaderboard: "BẢNG XẾP HẠNG",
    shop: "CỬA HÀNG SKIN",
    web3: "WEB3 TIỀN ĐIỆN TỬ",
    arcade: "VỀ ARCADE HUB",
    pauseTitle: "TẠM DỪNG",
    pauseSubtitle: "TRÒ CHƠI ĐANG ĐƯỢC TẠM DỪNG",
    resume: "TIẾP TỤC",
    restart: "CHƠI LẠI (SPACE)",
    mainMenu: "MENU CHÍNH",
    gameOver: "GAME OVER",
    scoreLabel: "ĐIỂM ĐẠT ĐƯỢC",
    recordLabel: "KỶ LỤC",
    coinEarned: "NHẶT ĐƯỢC"
  },
  en: {
    title: "FLAPPY BIRD",
    subtitle: "WORLD CHAMPIONSHIP • NEON EDITION",
    play: "PLAY NOW (SPACE)",
    leaderboard: "LEADERBOARD",
    shop: "SKIN SHOP",
    web3: "WEB3 CRYPTO",
    arcade: "ARCADE HUB",
    pauseTitle: "PAUSED",
    pauseSubtitle: "GAME IS CURRENTLY PAUSED",
    resume: "RESUME",
    restart: "RESTART (SPACE)",
    mainMenu: "MAIN MENU",
    gameOver: "GAME OVER",
    scoreLabel: "SCORE ACHIEVED",
    recordLabel: "RECORD",
    coinEarned: "COLLECTED"
  }
};

const urlParams = new URLSearchParams(window.location.search);
let currentLang = urlParams.get('lang') || localStorage.getItem('game_lang') || 'vi';
if (!I18N[currentLang]) currentLang = 'vi';

function applyGameTranslations() {
  const t = I18N[currentLang] || I18N.vi;
  document.documentElement.lang = currentLang;

  const setT = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };

  setT('txtTitle', t.title);
  setT('txtSubtitle', t.subtitle);
  setT('txtBtnPlay', t.play);
  setT('txtBtnLeaderboard', t.leaderboard);
  setT('txtBtnShop', t.shop);
  setT('txtBtnWeb3', t.web3);
  setT('txtBtnArcade', t.arcade);

  setT('txtPauseTitle', t.pauseTitle);
  setT('txtPauseSubtitle', t.pauseSubtitle);
  setT('txtBtnResume', t.resume);
  setT('txtBtnPauseRestart', t.restart);
  setT('txtBtnPauseHome', t.mainMenu);
  setT('txtBtnPauseArcade', t.arcade);

  setT('txtGameOver', t.gameOver);
  setT('txtScoreLabel', t.scoreLabel);
  setT('txtRecordLabel', t.recordLabel);
  setT('txtCoinEarnedLabel', t.coinEarned);
  setT('txtBtnRestart', t.restart);
  setT('txtBtnMainMenu', t.mainMenu);
  setT('txtBtnGameOverArcade', t.arcade);

  const inp = document.getElementById('playerNameInput');
  if (inp) inp.placeholder = t.namePlaceholder;

  setT('txtShopTitle', t.shopTitle);
  setT('txtShopSubtitle', t.shopSubtitle);
  setT('txtShopBalance', t.shopBalance);

  setT('txtBoardTitle', t.boardTitle);
  setT('txtBoardSubtitle', t.boardSubtitle);

  setT('txtWeb3Title', t.web3Title);
  setT('txtWeb3Subtitle', t.web3Subtitle);
  setT('txtWeb3WalletLabel', t.web3WalletLabel);
}

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const W = 440;
const H = 720;

let gameState = "START";
let score = 0;
let highScore = parseInt(localStorage.getItem("fb_high_score") || "0", 10);
let coins = parseInt(localStorage.getItem("fb_coins") || "40", 10);
let runCoinsCollected = 0;
let currentSkinId = localStorage.getItem("fb_skin") || "classic";
let frame = 0;
let screenShake = 0;

const SKINS = [
  { id: "classic", name: "Classic Canary", icon: "🐥", color: "#ffe600", trailColor: "#ffe600", price: 0, unlocked: true },
  { id: "cyber", name: "Cyber Neon", icon: "🤖", color: "#00f3ff", trailColor: "#00f3ff", price: 50, unlocked: false },
  { id: "golden", name: "Golden Phoenix", icon: "👑", color: "#ffd700", trailColor: "#ffaa00", price: 100, unlocked: false },
  { id: "dragon", name: "Dragon Flame", icon: "🐉", color: "#ff3300", trailColor: "#ff007f", price: 200, unlocked: false },
  { id: "void", name: "Void Specter", icon: "👾", color: "#a020f0", trailColor: "#00f3ff", price: 300, unlocked: false },
  { id: "sovereign", name: "Sovereign Agent", icon: "💎", color: "#00ffaa", trailColor: "#ffffff", price: "WEB3 VIP", unlocked: false }
];

try {
  const savedUnlocked = JSON.parse(localStorage.getItem("fb_unlocked_skins") || "[]");
  savedUnlocked.forEach(id => {
    const s = SKINS.find(x => x.id === id);
    if (s) s.unlocked = true;
  });
} catch(e) {}

function saveState() {
  localStorage.setItem("fb_high_score", highScore);
  localStorage.setItem("fb_coins", coins);
  localStorage.setItem("fb_skin", currentSkinId);
  const unlocked = SKINS.filter(s => s.unlocked).map(s => s.id);
  localStorage.setItem("fb_unlocked_skins", JSON.stringify(unlocked));
  document.getElementById("hudCoins").querySelector("span").innerText = coins;
  document.getElementById("menuCoins").innerText = coins;
  document.getElementById("shopCoins").innerText = coins;
}

const bird = {
  x: 80,
  y: H / 2,
  vy: 0,
  gravity: 0.38,
  jumpStrength: -7.5,
  radius: 16,
  rotation: 0
};

let pipes = [];
let particles = [];
let stars = [];

for (let i = 0; i < 45; i++) {
  stars.push({
    x: Math.random() * W,
    y: Math.random() * (H - 40),
    size: Math.random() * 2 + 0.5,
    speed: Math.random() * 0.3 + 0.1
  });
}

const PIPE_WIDTH = 64;
const PIPE_GAP = 160;
const PIPE_SPEED = 2.4;
const PIPE_SPAWN_INTERVAL = 110;

function spawnPipe() {
  const minTop = 60;
  const maxTop = H - PIPE_GAP - 120;
  const topHeight = Math.floor(Math.random() * (maxTop - minTop)) + minTop;
  const bottomY = topHeight + PIPE_GAP;
  const bottomHeight = H - bottomY;

  pipes.push({
    x: W,
    width: PIPE_WIDTH,
    topHeight,
    bottomY,
    bottomHeight,
    scored: false,
    coin: {
      x: W + PIPE_WIDTH / 2,
      y: topHeight + PIPE_GAP / 2,
      radius: 12,
      collected: false
    }
  });
}

function spawnTrail(x, y, color) {
  particles.push({
    x: x + (Math.random() - 0.5) * 6,
    y: y + (Math.random() - 0.5) * 6,
    vx: -Math.random() * 2 - 1,
    vy: (Math.random() - 0.5) * 1.5,
    size: Math.random() * 4 + 2,
    color,
    alpha: 0.8,
    life: 1.0
  });
}

function spawnExplosion(x, y, color) {
  for (let i = 0; i < 22; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4 + 1.5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 5 + 2,
      color,
      alpha: 1.0,
      life: 1.0
    });
  }
}

const QUESTS = [
  { id: "fb_q1", desc: "Chơi 1 ván Flappy Bird", goal: 1, reward: 15, key: "gamesPlayed" },
  { id: "fb_q2", desc: "Thu thập 10 Đồng Xu", goal: 10, reward: 25, key: "coinsCollected" },
  { id: "fb_q3", desc: "Bay qua 10 Ống Nước", goal: 10, reward: 30, key: "pipesPassed" },
  { id: "fb_q4", desc: "Đạt 20 Điểm trong một ván", goal: 20, reward: 50, key: "bestScore" }
];

function getQuestProgress() {
  return JSON.parse(localStorage.getItem("fb_quests_data") || '{"gamesPlayed":0,"coinsCollected":0,"pipesPassed":0,"bestScore":0,"claimed":{}}');
}
function saveQuestProgress(data) {
  localStorage.setItem("fb_quests_data", JSON.stringify(data));
}

function getPlayerName() {
  return localStorage.getItem("arcade_player_name") || "";
}
function setPlayerName(name) {
  name = name.trim().slice(0, 14);
  if (!name) name = "Player_" + Math.floor(Math.random() * 899 + 100);
  localStorage.setItem("arcade_player_name", name);
  updatePlayerDisplays();
  return name;
}
function updatePlayerDisplays() {
  const name = getPlayerName() || "Player";
  const elHud = document.getElementById("hudPlayer");
  if (elHud) elHud.querySelector("span").innerText = name;
  const elStart = document.getElementById("startPlayerName");
  if (elStart) elStart.innerText = name;
  const elOver = document.getElementById("overPlayerName");
  if (elOver) elOver.innerText = name;
}

function requireNameAndStart() {
  const name = getPlayerName();
  if (!name) {
    document.getElementById("nameInputBox").value = "Player_" + Math.floor(Math.random() * 899 + 100);
    document.getElementById("nameModal").classList.remove("hidden");
  } else {
    startGame();
  }
}