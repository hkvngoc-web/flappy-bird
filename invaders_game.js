function update() {
const ship = SHIPS.find(s => s.id === currentShipId) || SHIPS[0];
const now = performance.now();
if (isShield && now > shieldEndTime) {
isShield = false;
}
if (keys.left) player.x -= ship.speed;
if (keys.right) player.x += ship.speed;
player.x = Math.max(8, Math.min(W - player.w - 8, player.x));
if (keys.fire) {
shootBullet();
}
for (let i = bullets.length - 1; i >= 0; i--) {
const b = bullets[i];
b.x += b.vx || 0;
b.y += b.vy;
if (b.y < -20 || b.x < 0 || b.x > W) {
bullets.splice(i, 1);
}
}
for (let i = enemyBullets.length - 1; i >= 0; i--) {
const eb = enemyBullets[i];
eb.y += eb.vy;
if (eb.x > player.x && eb.x < player.x + player.w &&
eb.y > player.y && eb.y < player.y + player.h) {
enemyBullets.splice(i, 1);
if (!isShield) {
gameOver();
return;
} else {
createExplosion(eb.x, eb.y, "#00f3ff", 6);
}
continue;
}
if (eb.y > H + 20) {
enemyBullets.splice(i, 1);
}
}
let edgeReached = false;
enemies.forEach(e => {
e.x += enemyDirection * (0.8 + wave * 0.15);
if (e.x < 15 || e.x + e.w > W - 15) edgeReached = true;
if (Math.random() < 0.005 + wave * 0.001) {
enemyBullets.push({ x: e.x + e.w / 2, y: e.y + e.h, vy: 4 + wave * 0.2 });
}
});
if (edgeReached) {
enemyDirection *= -1;
enemies.forEach(e => { e.y += 14; });
}
for (let bi = bullets.length - 1; bi >= 0; bi--) {
const b = bullets[bi];
for (let ei = enemies.length - 1; ei >= 0; ei--) {
const e = enemies[ei];
if (b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h) {
bullets.splice(bi, 1);
e.hp--;
sound.hit();
createExplosion(b.x, b.y, e.color, 6);
if (e.hp <= 0) {
enemies.splice(ei, 1);
createExplosion(e.x + e.w / 2, e.y + e.h / 2, e.color, 16);
score += 10;
document.getElementById("hudScore").querySelector("span").innerText = score;
if (Math.random() < 0.75) {
coins.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vy: 2.5 });
}
const qp = getQuestProgress();
qp.aliensKilled = (qp.aliensKilled || 0) + 1;
if (score > (qp.bestScore || 0)) qp.bestScore = score;
saveQuestProgress(qp);
}
break;
}
}
}
for (let i = coins.length - 1; i >= 0; i--) {
const c = coins[i];
c.y += c.vy;
const dx = (player.x + player.w / 2) - c.x;
const dy = (player.y + player.h / 2) - c.y;
const dist = Math.hypot(dx, dy);
if (dist < 110) {
c.x += (dx / dist) * 5;
c.y += (dy / dist) * 5;
}
if (dist < 28) {
coins.splice(i, 1);
sessionCoins += 1;
totalCoins += 1;
localStorage.setItem("void_coins", totalCoins);
sound.coin();
document.getElementById("hudCoins").querySelector("span").innerText = sessionCoins;
continue;
}
if (c.y > H + 20) {
coins.splice(i, 1);
}
}
if (enemies.length === 0) {
wave++;
document.getElementById("hudWave").innerText = `🌊 W${wave}`;
spawnWave(wave);
}
for (let i = shockwaves.length - 1; i >= 0; i--) {
const sw = shockwaves[i];
sw.r += 18;
sw.life -= 0.03;
if (sw.life <= 0) shockwaves.splice(i, 1);
}
}
function calculateRank(sc) {
if (sc >= 135) return "#1";
if (sc >= 110) return "#2";
if (sc >= 90) return "#3";
if (sc >= 70) return "#4";
if (sc >= 50) return "#5";
if (sc > 0) return "#8";
return "#--";
}
async function gameOver() {
gameState = "GAMEOVER";
sound.hit();
if (score > highScore) {
highScore = score;
localStorage.setItem("void_highscore", highScore);
}
const finalRank = calculateRank(highScore);
localStorage.setItem("void_rank", finalRank);
const playerName = getPlayerName() || "Player";
const ship = SHIPS.find(s => s.id === currentShipId) || SHIPS[0];
try {
fetch("/api/score", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
name: playerName,
score: score,
skin: ship.name,
country: "VN"
})
}).catch(() => {});
} catch (_) {}
document.getElementById("finalScore").innerText = score;
document.getElementById("finalHighScore").innerText = highScore;
document.getElementById("finalRank").innerText = finalRank;
document.getElementById("overEarnedCoins").innerText = `+${sessionCoins}`;
document.getElementById("overTotalCoins").innerText = totalCoins;
document.getElementById("gameOverScreen").classList.remove("hidden");
}
function render() {
ctx.fillStyle = "#03030a";
ctx.fillRect(0, 0, W, H);
ctx.fillStyle = "#ffffff";
stars.forEach(s => {
s.y += s.speed;
if (s.y > H) s.y = 0;
ctx.globalAlpha = Math.min(1, s.speed / 2);
ctx.fillRect(s.x, s.y, s.size, s.size);
});
ctx.globalAlpha = 1;
shockwaves.forEach(sw => {
ctx.save();
ctx.strokeStyle = `rgba(0, 243, 255, ${sw.life})`;
ctx.lineWidth = 4;
ctx.beginPath();
ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
ctx.stroke();
ctx.restore();
});
bullets.forEach(b => {
ctx.save();
ctx.fillStyle = b.color;
ctx.shadowColor = b.color;
ctx.shadowBlur = 10;
ctx.fillRect(b.x, b.y, b.w, b.h);
ctx.restore();
});
ctx.fillStyle = "#ff0055";
ctx.shadowColor = "#ff0055";
ctx.shadowBlur = 8;
enemyBullets.forEach(eb => {
ctx.beginPath();
ctx.arc(eb.x, eb.y, 4, 0, Math.PI * 2);
ctx.fill();
});
coins.forEach(c => {
ctx.save();
ctx.fillStyle = "#ffe600";
ctx.shadowColor = "#ffe600";
ctx.shadowBlur = 12;
ctx.beginPath();
ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "#000";
ctx.font = "bold 8px sans-serif";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillText("C", c.x, c.y);
ctx.restore();
});
enemies.forEach(e => {
ctx.save();
ctx.fillStyle = e.color;
ctx.shadowColor = e.color;
ctx.shadowBlur = 10;
ctx.fillRect(e.x, e.y, e.w, e.h);
ctx.fillStyle = "#000";
ctx.fillRect(e.x + 8, e.y + 6, 6, 6);
ctx.fillRect(e.x + e.w - 14, e.y + 6, 6, 6);
ctx.restore();
});
const ship = SHIPS.find(s => s.id === currentShipId) || SHIPS[0];
ctx.save();
ctx.fillStyle = ship.color;
ctx.shadowColor = ship.color;
ctx.shadowBlur = 15;
ctx.beginPath();
ctx.moveTo(player.x + player.w / 2, player.y);
ctx.lineTo(player.x + player.w, player.y + player.h);
ctx.lineTo(player.x + player.w / 2, player.y + player.h - 10);
ctx.lineTo(player.x, player.y + player.h);
ctx.closePath();
ctx.fill();
if (isShield) {
ctx.strokeStyle = "#00f3ff";
ctx.lineWidth = 3;
ctx.shadowColor = "#00f3ff";
ctx.shadowBlur = 20;
ctx.beginPath();
ctx.arc(player.x + player.w / 2, player.y + player.h / 2, 34, 0, Math.PI * 2);
ctx.stroke();
}
ctx.restore();
for (let i = particles.length - 1; i >= 0; i--) {
const p = particles[i];
p.x += p.vx;
p.y += p.vy;
p.life -= 0.04;
if (p.life <= 0) {
particles.splice(i, 1);
continue;
}
ctx.save();
ctx.fillStyle = p.color;
ctx.globalAlpha = p.life;
ctx.shadowColor = p.color;
ctx.shadowBlur = 8;
ctx.beginPath();
ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
ctx.fill();
ctx.restore();
}
updateSkillButtonUI();
}
function updateSkillButtonUI() {
const now = performance.now();
const btnEmp = document.getElementById("btnSkillEmp");
const empText = document.getElementById("empCdText");
if (now < empCdEnd) {
btnEmp.classList.add("cooling");
const rem = Math.ceil((empCdEnd - now) / 1000);
empText.innerText = `CD: ${rem}s`;
} else {
btnEmp.classList.remove("cooling");
empText.innerText = "[B] READY";
}
const btnShld = document.getElementById("btnSkillShield");
const shldText = document.getElementById("shieldCdText");
if (isShield) {
btnShld.classList.add("active");
btnShld.classList.remove("cooling");
shldText.innerText = "ACTIVE!";
} else if (now < shieldCdEnd) {
btnShld.classList.remove("active");
btnShld.classList.add("cooling");
const rem = Math.ceil((shieldCdEnd - now) / 1000);
shldText.innerText = `CD: ${rem}s`;
} else {
btnShld.classList.remove("active");
btnShld.classList.remove("cooling");
shldText.innerText = "[S] READY";
}
}
function gameLoop() {
if (gameState === "PLAYING") {
update();
}
render();
requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
window.addEventListener("keydown", (e) => {
if (e.code === "KeyB") { e.preventDefault(); triggerEMP(); return; }
if (e.code === "KeyS") { e.preventDefault(); triggerShield(); return; }
if (e.code === "KeyP") { togglePause(); return; }
if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = true;
if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = true;
if (e.code === "Space" || e.key === "w" || e.key === "W") keys.fire = true;
});
window.addEventListener("keyup", (e) => {
if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false;
if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false;
if (e.code === "Space" || e.key === "w" || e.key === "W") keys.fire = false;
});
const bindTouch = (id, k) => {
const el = document.getElementById(id);
el.addEventListener("mousedown", () => keys[k] = true);
el.addEventListener("mouseup", () => keys[k] = false);
el.addEventListener("touchstart", (e) => { e.preventDefault(); keys[k] = true; });
el.addEventListener("touchend", (e) => { e.preventDefault(); keys[k] = false; });
};
bindTouch("btnLeft", "left");
bindTouch("btnRight", "right");
bindTouch("btnFire", "fire");
document.getElementById("btnSkillEmp").onclick = triggerEMP;
document.getElementById("btnSkillShield").onclick = triggerShield;
function togglePause() {
if (gameState === "PLAYING") {
gameState = "PAUSED";
document.getElementById("pauseScreen").classList.remove("hidden");
} else if (gameState === "PAUSED") {
gameState = "PLAYING";
document.getElementById("pauseScreen").classList.add("hidden");
}
}
function goToMainMenu() {
gameState = "MENU";
document.getElementById("pauseScreen").classList.add("hidden");
document.getElementById("gameOverScreen").classList.add("hidden");
document.getElementById("startScreen").classList.remove("hidden");
updatePlayerDisplays();
}
function goToArcadeHub() {
window.location.href = "index.html";
}
document.getElementById("btnChangeName").onclick = () => {
document.getElementById("nameInputBox").value = getPlayerName();
document.getElementById("nameModal").classList.remove("hidden");
};
document.getElementById("btnSaveName").onclick = () => {
const val = document.getElementById("nameInputBox").value;
setPlayerName(val);
document.getElementById("nameModal").classList.add("hidden");
if (gameState === "MENU") startGame();
};
function renderShop() {
const container = document.getElementById("shipGridContainer");
document.getElementById("shopCoinsDisplay").innerText = totalCoins;
container.innerHTML = "";
SHIPS.forEach(ship => {
const isUnlocked = unlockedShips.includes(ship.id);
const isEquipped = currentShipId === ship.id;
const card = document.createElement("div");
card.className = `ship-card ${isEquipped ? "selected" : ""}`;
card.innerHTML = `
<div class="ship-icon">${ship.icon}</div>
<div class="ship-name" style="color:${ship.color};">${ship.name}</div>
<div class="ship-desc">${ship.bulletType}</div>
<div class="ship-price">${isUnlocked ? (isEquipped ? "ĐANG DÙNG" : "ĐÃ CÓ") : `🟡 ${ship.price} COIN`}</div>
`;
card.onclick = () => {
if (isUnlocked) {
currentShipId = ship.id;
localStorage.setItem("void_ship", currentShipId);
renderShop();
} else {
if (totalCoins >= ship.price) {
totalCoins -= ship.price;
localStorage.setItem("void_coins", totalCoins);
unlockedShips.push(ship.id);
localStorage.setItem("void_unlocked_ships", JSON.stringify(unlockedShips));
currentShipId = ship.id;
localStorage.setItem("void_ship", currentShipId);
renderShop();
} else {
alert("Không đủ coin! Hãy bắn hạ thêm phi thuyền địch!");
}
}
};
container.appendChild(card);
});
}
document.getElementById("btnOpenShop").onclick = () => {
renderShop();
document.getElementById("shopScreen").classList.remove("hidden");
};
document.getElementById("btnCloseShop").onclick = () => {
document.getElementById("shopScreen").classList.add("hidden");
};
function renderQuests() {
const container = document.getElementById("questsListContainer");
const qp = getQuestProgress();
container.innerHTML = "";
QUESTS.forEach(q => {
const curVal = qp[q.key] || 0;
const isComplete = curVal >= q.goal;
const isClaimed = qp.claimed && qp.claimed[q.id];
const pct = Math.min(100, Math.floor((curVal / q.goal) * 100));
const item = document.createElement("div");
item.className = "quest-item";
item.innerHTML = `
<div class="quest-info">
<div class="quest-desc">${q.desc}</div>
<div class="quest-progress-bar">
<div class="quest-progress-fill" style="width: ${pct}%;"></div>
</div>
<div style="font-size:10px; color:#aaa; margin-top:2px;">Tiến độ: ${curVal}/${q.goal}</div>
</div>
<div style="text-align:right;">
<div class="quest-reward">+${q.reward} COIN</div>
<button class="claim-btn" ${!isComplete || isClaimed ? "disabled" : ""} id="claim_inv_${q.id}">
${isClaimed ? "ĐÃ NHẬN" : (isComplete ? "NHẬN" : "CHƯA XONG")}
</button>
</div>
`;
const btn = item.querySelector(`#claim_inv_${q.id}`);
if (isComplete && !isClaimed) {
btn.onclick = () => {
qp.claimed = qp.claimed || {};
qp.claimed[q.id] = true;
saveQuestProgress(qp);
totalCoins += q.reward;
localStorage.setItem("void_coins", totalCoins);
sound.coin();
renderQuests();
};
}
container.appendChild(item);
});
}
document.getElementById("btnOpenQuests").onclick = () => {
renderQuests();
document.getElementById("questsScreen").classList.remove("hidden");
};
document.getElementById("btnCloseQuests").onclick = () => {
document.getElementById("questsScreen").classList.add("hidden");
};
document.getElementById("btnOpenLeaderboard").onclick = () => {
document.getElementById("leaderboardScreen").classList.remove("hidden");
const container = document.getElementById("boardListContainer");
const list = [
{ rank: 1, name: "NeonPilot_X", score: 135, country: "US" },
{ rank: 2, name: "AstroBot_01", score: 110, country: "VN" },
{ rank: 3, name: "StarHunter", score: 90, country: "JP" },
{ rank: 4, name: "LaserCommander", score: 70, country: "KR" },
{ rank: 5, name: "CosmicVoid", score: 50, country: "SG" }
];
container.innerHTML = "";
list.forEach(item => {
const row = document.createElement("div");
row.style.display = "flex";
row.style.justifyContent = "space-between";
row.style.padding = "8px 10px";
row.style.borderBottom = "1px solid rgba(255,255,255,0.06)";
row.style.fontSize = "13px";
row.innerHTML = `
<div style="display:flex; align-items:center; gap:8px;">
<span style="font-weight:800; color:${item.rank <= 3 ? '#ffe600' : '#ff007f'};">#${item.rank}</span>
<span style="font-weight:700;">${item.name}</span>
<span style="font-size:11px; color:#888;">[${item.country}]</span>
</div>
<span style="font-weight:800; color:#00f3ff;">${item.score} pts</span>
`;
container.appendChild(row);
});
};
document.getElementById("btnCloseLeaderboard").onclick = () => {
document.getElementById("leaderboardScreen").classList.add("hidden");
};
document.getElementById("btnPlay").onclick = requireNameAndStart;
document.getElementById("btnRestart").onclick = requireNameAndStart;
document.getElementById("btnBackMenu").onclick = goToMainMenu;
document.getElementById("btnGameOverArcade").onclick = goToArcadeHub;
document.getElementById("btnPause").onclick = togglePause;
document.getElementById("btnResume").onclick = togglePause;
document.getElementById("btnPauseRestart").onclick = requireNameAndStart;
document.getElementById("btnPauseHome").onclick = goToMainMenu;
document.getElementById("btnPauseArcade").onclick = goToArcadeHub;
document.getElementById("btnGoArcade").onclick = goToArcadeHub;
document.getElementById("btnSound").onclick = () => {
sound.muted = !sound.muted;
document.getElementById("btnSound").innerText = sound.muted ? "🔇" : "🔊";
};
updatePlayerDisplays();
