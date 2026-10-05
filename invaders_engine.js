class SoundFX {
constructor() {
this.ctx = null;
this.muted = false;
}
init() {
if (!this.ctx) {
const AudioContext = window.AudioContext || window.webkitAudioContext;
this.ctx = new AudioContext();
}
if (this.ctx && this.ctx.state === 'suspended') {
this.ctx.resume();
}
}
playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.2) {
if (this.muted) return;
this.init();
if (!this.ctx) return;
const osc = this.ctx.createOscillator();
const gain = this.ctx.createGain();
osc.type = type;
osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
osc.connect(gain);
gain.connect(this.ctx.destination);
osc.start();
osc.stop(this.ctx.currentTime + duration);
}
laser() { this.playTone(850, 'sawtooth', 0.08, 0.25); }
hit() { this.playTone(220, 'square', 0.12, 0.3); }
coin() { this.playTone(987, 'sine', 0.15, 0.3); }
emp() {
this.playTone(150, 'sawtooth', 0.4, 0.4);
setTimeout(() => this.playTone(1200, 'sine', 0.3, 0.3), 100);
}
shield() { this.playTone(600, 'sine', 0.3, 0.25); }
}
const sound = new SoundFX();
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const W = 460;
const H = 720;
const SHIPS = [
{ id: "striker", name: "Neon Striker", icon: "🚀", price: 0, color: "#00f3ff", bulletType: "single", speed: 6 },
{ id: "cruiser", name: "Plasma Cruiser", icon: "🛸", price: 40, color: "#ff007f", bulletType: "double", speed: 6.5 },
{ id: "phantom", name: "Quantum Phantom", icon: "⚡", price: 80, color: "#00ffaa", bulletType: "spread3", speed: 7.5 },
{ id: "destroyer", name: "Solar Destroyer", icon: "☀️", price: 150, color: "#ffe600", bulletType: "plasmaBeam", speed: 7 },
{ id: "titan", name: "Sovereign Titan", icon: "👑", price: 250, color: "#ff0055", bulletType: "quad", speed: 8 }
];
const QUESTS = [
{ id: "q1", desc: "Chơi 1 trận Void Invaders", goal: 1, reward: 15, key: "gamesPlayed" },
{ id: "q2", desc: "Bắn hạ 25 phi thuyền địch", goal: 25, reward: 30, key: "aliensKilled" },
{ id: "q3", desc: "Kích hoạt Kỹ năng EMP hoặc Shield 2 lần", goal: 2, reward: 25, key: "skillsUsed" },
{ id: "q4", desc: "Đạt 80 Điểm trong một ván", goal: 80, reward: 50, key: "bestScore" }
];
let gameState = "MENU";
let score = 0;
let highScore = parseInt(localStorage.getItem("void_highscore") || "0", 10);
let totalCoins = parseInt(localStorage.getItem("void_coins") || "0", 10);
let sessionCoins = 0;
let wave = 1;
let currentShipId = localStorage.getItem("void_ship") || "striker";
let unlockedShips = JSON.parse(localStorage.getItem("void_unlocked_ships") || '["striker"]');
let player = {
x: W / 2 - 20,
y: H - 140,
w: 40,
h: 40,
vx: 0
};
let bullets = [];
let enemies = [];
let enemyBullets = [];
let coins = [];
let particles = [];
let shockwaves = [];
let keys = { left: false, right: false, fire: false };
let lastShootTime = 0;
let isShield = false;
let shieldEndTime = 0;
let shieldCdEnd = 0;
const SHIELD_DURATION = 4000;
const SHIELD_COOLDOWN = 12000;
let empCdEnd = 0;
const EMP_COOLDOWN = 15000;
let stars = [];
for (let i = 0; i < 70; i++) {
stars.push({
x: Math.random() * W,
y: Math.random() * H,
speed: Math.random() * 2 + 0.5,
size: Math.random() * 2 + 1
});
}
function getQuestProgress() {
return JSON.parse(localStorage.getItem("void_quests_data") || '{"gamesPlayed":0,"aliensKilled":0,"skillsUsed":0,"bestScore":0,"claimed":{}}');
}
function saveQuestProgress(data) {
localStorage.setItem("void_quests_data", JSON.stringify(data));
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
document.getElementById("hudPlayer").querySelector("span").innerText = name;
document.getElementById("startPlayerName").innerText = name;
document.getElementById("overPlayerName").innerText = name;
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
function startGame() {
sound.init();
const ship = SHIPS.find(s => s.id === currentShipId) || SHIPS[0];
player.x = W / 2 - 20;
player.y = H - 140;
player.vx = 0;
bullets = [];
enemies = [];
enemyBullets = [];
coins = [];
particles = [];
shockwaves = [];
score = 0;
sessionCoins = 0;
wave = 1;
isShield = false;
shieldEndTime = 0;
spawnWave(wave);
gameState = "PLAYING";
const qp = getQuestProgress();
qp.gamesPlayed = (qp.gamesPlayed || 0) + 1;
saveQuestProgress(qp);
document.getElementById("startScreen").classList.add("hidden");
document.getElementById("gameOverScreen").classList.add("hidden");
document.getElementById("pauseScreen").classList.add("hidden");
document.getElementById("nameModal").classList.add("hidden");
document.getElementById("hudScore").querySelector("span").innerText = "0";
document.getElementById("hudCoins").querySelector("span").innerText = "0";
document.getElementById("hudWave").innerText = `🌊 W${wave}`;
updatePlayerDisplays();
}
function spawnWave(w) {
enemies = [];
const rows = Math.min(5, 2 + Math.floor(w / 2));
const cols = 6;
for (let r = 0; r < rows; r++) {
for (let c = 0; c < cols; c++) {
enemies.push({
x: 45 + c * 60,
y: 50 + r * 45,
w: 36,
h: 26,
hp: 1 + Math.floor(w / 3),
type: (r === 0 ? "boss" : (r === 1 ? "elite" : "scout")),
color: (r === 0 ? "#ff0055" : (r === 1 ? "#ffe600" : "#00f3ff"))
});
}
}
}
function triggerEMP() {
if (gameState !== "PLAYING") return;
const now = performance.now();
if (now < empCdEnd) return;
empCdEnd = now + EMP_COOLDOWN;
sound.emp();
enemyBullets = [];
enemies.forEach(e => {
createExplosion(e.x + e.w / 2, e.y + e.h / 2, e.color, 15);
score += 5;
if (Math.random() < 0.6) {
coins.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vy: 2 });
}
});
enemies = [];
shockwaves.push({ x: W / 2, y: H / 2, r: 10, maxR: W, life: 1.0 });
const qp = getQuestProgress();
qp.skillsUsed = (qp.skillsUsed || 0) + 1;
saveQuestProgress(qp);
setTimeout(() => {
if (enemies.length === 0 && gameState === "PLAYING") {
wave++;
document.getElementById("hudWave").innerText = `🌊 W${wave}`;
spawnWave(wave);
}
}, 500);
}
function triggerShield() {
if (gameState !== "PLAYING") return;
const now = performance.now();
if (now < shieldCdEnd) return;
isShield = true;
shieldEndTime = now + SHIELD_DURATION;
shieldCdEnd = now + SHIELD_DURATION + SHIELD_COOLDOWN;
sound.shield();
const qp = getQuestProgress();
qp.skillsUsed = (qp.skillsUsed || 0) + 1;
saveQuestProgress(qp);
}
function shootBullet() {
const now = performance.now();
if (now - lastShootTime < 220) return;
lastShootTime = now;
sound.laser();
const ship = SHIPS.find(s => s.id === currentShipId) || SHIPS[0];
const midX = player.x + player.w / 2;
const topY = player.y;
if (ship.bulletType === "single") {
bullets.push({ x: midX - 3, y: topY, vx: 0, vy: -12, color: ship.color, w: 6, h: 14 });
} else if (ship.bulletType === "double") {
bullets.push({ x: midX - 12, y: topY, vx: 0, vy: -12, color: ship.color, w: 5, h: 14 });
bullets.push({ x: midX + 7, y: topY, vx: 0, vy: -12, color: ship.color, w: 5, h: 14 });
} else if (ship.bulletType === "spread3") {
bullets.push({ x: midX - 3, y: topY, vx: 0, vy: -12, color: ship.color, w: 6, h: 14 });
bullets.push({ x: midX - 10, y: topY, vx: -2.5, vy: -11, color: ship.color, w: 5, h: 12 });
bullets.push({ x: midX + 5, y: topY, vx: 2.5, vy: -11, color: ship.color, w: 5, h: 12 });
} else if (ship.bulletType === "plasmaBeam") {
bullets.push({ x: midX - 6, y: topY, vx: 0, vy: -14, color: ship.color, w: 12, h: 20 });
} else if (ship.bulletType === "quad") {
bullets.push({ x: midX - 16, y: topY, vx: -1, vy: -13, color: ship.color, w: 5, h: 15 });
bullets.push({ x: midX - 6, y: topY, vx: 0, vy: -13, color: ship.color, w: 5, h: 15 });
bullets.push({ x: midX + 4, y: topY, vx: 0, vy: -13, color: ship.color, w: 5, h: 15 });
bullets.push({ x: midX + 14, y: topY, vx: 1, vy: -13, color: ship.color, w: 5, h: 15 });
}
}
function createExplosion(x, y, color, count = 12) {
for (let i = 0; i < count; i++) {
particles.push({
x, y,
vx: (Math.random() - 0.5) * 8,
vy: (Math.random() - 0.5) * 8,
life: 1.0,
color
});
}
}
let enemyDirection = 1;
