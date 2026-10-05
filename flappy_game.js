function startGame() {
  gameState = "PLAYING";
  score = 0;
  runCoinsCollected = 0;
  bird.y = H / 2;
  bird.vy = 0;
  bird.rotation = 0;
  pipes = [];
  particles = [];
  frame = 0;
  screenShake = 0;

  const qp = getQuestProgress();
  qp.gamesPlayed = (qp.gamesPlayed || 0) + 1;
  saveQuestProgress(qp);

  document.getElementById("hudScore").querySelector("span").innerText = "0";
  document.getElementById("hudCoins").querySelector("span").innerText = coins;
  updatePlayerDisplays();

  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("pauseScreen").classList.add("hidden");
  document.getElementById("gameOverScreen").classList.add("hidden");
  document.getElementById("shopScreen").classList.add("hidden");
  document.getElementById("leaderboardScreen").classList.add("hidden");
  document.getElementById("web3Screen").classList.add("hidden");
  document.getElementById("questsScreen").classList.add("hidden");
  document.getElementById("nameModal").classList.add("hidden");
}

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
  gameState = "START";
  document.getElementById("pauseScreen").classList.add("hidden");
  document.getElementById("gameOverScreen").classList.add("hidden");
  document.getElementById("shopScreen").classList.add("hidden");
  document.getElementById("leaderboardScreen").classList.add("hidden");
  document.getElementById("web3Screen").classList.add("hidden");
  document.getElementById("startScreen").classList.remove("hidden");
  updatePlayerDisplays();
  saveState();
}

function goToArcadeHub() {
  window.location.href = `index.html?lang=${currentLang}`;
}

function jump() {
  if (gameState === "PLAYING") {
    bird.vy = bird.jumpStrength;
    sound.playJump();
    const curSkin = SKINS.find(s => s.id === currentSkinId) || SKINS[0];
    spawnExplosion(bird.x - 10, bird.y + 10, curSkin.trailColor);
  } else if (gameState === "START") {
    requireNameAndStart();
  } else if (gameState === "GAMEOVER") {
    requireNameAndStart();
  }
}

function triggerGameOver() {
  if (gameState !== "PLAYING") return;
  gameState = "GAMEOVER";
  sound.playCrash();
  screenShake = 18;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("fb_high_score", highScore);
  }
  coins += runCoinsCollected;
  localStorage.setItem("fb_coins", coins);

  function calcRank(sc) {
    if (sc >= 148) return "#1";
    if (sc >= 124) return "#2";
    if (sc >= 98) return "#3";
    if (sc >= 80) return "#4";
    if (sc >= 60) return "#5";
    if (sc > 0) return "#8";
    return "#--";
  }
  const myRank = calcRank(highScore);
  localStorage.setItem("fb_rank", myRank);

  const playerName = getPlayerName() || "Player";
  const curSkin = SKINS.find(s => s.id === currentSkinId) || SKINS[0];

  try {
    fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: playerName,
        score: score,
        skin: curSkin.name,
        country: "VN"
      })
    }).catch(() => {});
  } catch (_) {}

  const qp = getQuestProgress();
  qp.coinsCollected = (qp.coinsCollected || 0) + runCoinsCollected;
  if (score > (qp.bestScore || 0)) qp.bestScore = score;
  saveQuestProgress(qp);

  saveState();

  document.getElementById("overPlayerName").innerText = playerName;
  document.getElementById("finalScore").innerText = score;
  document.getElementById("finalHighScore").innerText = highScore;
  document.getElementById("finalRank").innerText = myRank;
  document.getElementById("overEarnedCoins").innerText = `+${runCoinsCollected}`;
  document.getElementById("overTotalCoins").innerText = coins;

  document.getElementById("gameOverScreen").classList.remove("hidden");
}

function update() {
  if (gameState !== "PLAYING") return;

  frame++;

  bird.vy += bird.gravity;
  bird.y += bird.vy;
  bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, bird.vy * 0.08));

  const curSkin = SKINS.find(s => s.id === currentSkinId) || SKINS[0];
  spawnTrail(bird.x - 12, bird.y, curSkin.trailColor);

  if (bird.y + bird.radius >= H - 15 || bird.y - bird.radius <= 0) {
    triggerGameOver();
  }

  if (frame % PIPE_SPAWN_INTERVAL === 0) {
    spawnPipe();
  }

  for (let i = pipes.length - 1; i >= 0; i--) {
    const p = pipes[i];
    p.x -= PIPE_SPEED;

    if (!p.scored && p.x + p.width < bird.x) {
      p.scored = true;
      score++;
      sound.playScore();
      document.getElementById("hudScore").querySelector("span").innerText = score;

      const qp = getQuestProgress();
      qp.pipesPassed = (qp.pipesPassed || 0) + 1;
      saveQuestProgress(qp);
    }

    if (p.coin && !p.coin.collected) {
      p.coin.x -= PIPE_SPEED;
      const dist = Math.hypot(bird.x - p.coin.x, bird.y - p.coin.y);
      if (dist < bird.radius + p.coin.radius) {
        p.coin.collected = true;
        coins += 5;
        runCoinsCollected += 5;
        sound.playCoin();
        saveState();
        spawnExplosion(p.coin.x, p.coin.y, "#ffe600");
      }
    }

    const inX = (bird.x + bird.radius > p.x) && (bird.x - bird.radius < p.x + p.width);
    const hitTop = bird.y - bird.radius < p.topHeight;
    const hitBottom = bird.y + bird.radius > p.bottomY;

    if (inX && (hitTop || hitBottom)) {
      triggerGameOver();
    }

    if (p.x + p.width < -20) {
      pipes.splice(i, 1);
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.life -= 0.025;
    pt.alpha = pt.life;
    if (pt.life <= 0) particles.splice(i, 1);
  }

  if (screenShake > 0) screenShake *= 0.88;
  if (screenShake < 0.5) screenShake = 0;
}

function render() {
  ctx.save();
  if (screenShake > 0) {
    ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
  }

  ctx.fillStyle = "#060614";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#fff";
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#0f0f29";
  for (let i = 0; i < 7; i++) {
    const x = (i * 80) - ((frame * 0.4) % 80);
    ctx.fillRect(x, H - 180, 60, 180);
    ctx.fillStyle = "rgba(0, 243, 255, 0.15)";
    ctx.fillRect(x + 10, H - 150, 15, 20);
    ctx.fillRect(x + 35, H - 110, 15, 20);
    ctx.fillStyle = "#0f0f29";
  }

  pipes.forEach(p => {
    const gTop = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
    gTop.addColorStop(0, "#00f3ff");
    gTop.addColorStop(0.5, "#0066aa");
    gTop.addColorStop(1, "#002244");
    ctx.fillStyle = gTop;
    ctx.fillRect(p.x, 0, p.width, p.topHeight);

    ctx.fillStyle = "#00f3ff";
    ctx.shadowColor = "#00f3ff";
    ctx.shadowBlur = 12;
    ctx.fillRect(p.x - 3, p.topHeight - 20, p.width + 6, 20);
    ctx.shadowBlur = 0;

    const gBot = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
    gBot.addColorStop(0, "#ff007f");
    gBot.addColorStop(0.5, "#99004d");
    gBot.addColorStop(1, "#33001a");
    ctx.fillStyle = gBot;
    ctx.fillRect(p.x, p.bottomY, p.width, p.bottomHeight);

    ctx.fillStyle = "#ff007f";
    ctx.shadowColor = "#ff007f";
    ctx.shadowBlur = 12;
    ctx.fillRect(p.x - 3, p.bottomY, p.width + 6, 20);
    ctx.shadowBlur = 0;

    if (p.coin && !p.coin.collected) {
      ctx.save();
      ctx.shadowColor = "#ffe600";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#ffe600";
      ctx.beginPath();
      ctx.arc(p.coin.x, p.coin.y + Math.sin(frame * 0.1) * 6, p.coin.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🟡", p.coin.x, p.coin.y + Math.sin(frame * 0.1) * 6);
      ctx.restore();
    }
  });

  particles.forEach(pt => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, pt.alpha);
    ctx.fillStyle = pt.color;
    ctx.shadowColor = pt.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  const curSkin = SKINS.find(s => s.id === currentSkinId) || SKINS[0];
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  ctx.shadowColor = curSkin.trailColor;
  ctx.shadowBlur = 20;
  ctx.fillStyle = curSkin.color;
  ctx.beginPath();
  ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
  ctx.fill();

  const wingOffset = Math.sin(frame * 0.3) * 6;
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.beginPath();
  ctx.ellipse(-6, wingOffset, 10, 6, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(8, -6, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(10, -6, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff7700";
  ctx.beginPath();
  ctx.moveTo(14, -2);
  ctx.lineTo(24, 2);
  ctx.lineTo(14, 6);
  ctx.closePath();
  ctx.fill();

  if (curSkin.id === "golden") {
    ctx.font = "16px sans-serif";
    ctx.fillText("👑", -6, -18);
  } else if (curSkin.id === "cyber") {
    ctx.strokeStyle = "#00f3ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(-12, -12, 24, 24);
  } else if (curSkin.id === "sovereign") {
    ctx.font = "14px sans-serif";
    ctx.fillText("💎", -6, -18);
  }
  ctx.restore();

  ctx.fillStyle = "#14142d";
  ctx.fillRect(0, H - 15, W, 15);
  ctx.fillStyle = "#00f3ff";
  ctx.fillRect(0, H - 15, W, 2);

  ctx.restore();
}

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    jump();
  } else if (e.code === "KeyP" || e.code === "Escape") {
    e.preventDefault();
    togglePause();
  }
});

canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  jump();
});

document.getElementById("btnPlay").onclick = startGame;
document.getElementById("btnRestart").onclick = startGame;
document.getElementById("btnGoMainMenu").onclick = goToMainMenu;
document.getElementById("btnGameOverArcade").onclick = goToArcadeHub;

document.getElementById("btnPause").onclick = togglePause;
document.getElementById("btnResume").onclick = togglePause;
document.getElementById("btnPauseRestart").onclick = startGame;
document.getElementById("btnPauseHome").onclick = goToMainMenu;
document.getElementById("btnPauseArcade").onclick = goToArcadeHub;

document.getElementById("btnGoArcade").onclick = goToArcadeHub;

document.getElementById("btnSound").onclick = () => {
  sound.muted = !sound.muted;
  document.getElementById("btnSound").innerText = sound.muted ? "🔇" : "🔊";
};

function renderShop() {
  const container = document.getElementById("shopItemsContainer");
  container.innerHTML = "";
  const t = I18N[currentLang] || I18N.vi;

  SKINS.forEach(skin => {
    const card = document.createElement("div");
    card.className = `skin-card ${skin.id === currentSkinId ? "active" : ""}`;
    card.innerHTML = `
      <div class="skin-icon">${skin.icon}</div>
      <div class="skin-name">${skin.name}</div>
      <div class="skin-price">${skin.unlocked ? (skin.id === currentSkinId ? t.equipped : t.unlocked) : (typeof skin.price === "number" ? `🟡 ${skin.price}` : skin.price)}</div>
    `;
    card.onclick = () => {
      if (skin.unlocked) {
        currentSkinId = skin.id;
        saveState();
        document.getElementById("selectedSkinPreview").innerText = skin.icon;
        renderShop();
      } else if (typeof skin.price === "number" && coins >= skin.price) {
        coins -= skin.price;
        skin.unlocked = true;
        currentSkinId = skin.id;
        sound.playCoin();
        saveState();
        renderShop();
      } else {
        sound.playCrash();
        const msg = typeof skin.price === "number" ? t.needCoins.replace("{coins}", skin.price) : "Hãy kết nối Web3 để mở khóa skin này!";
        alert(msg);
      }
    };
    container.appendChild(card);
  });
}

const shopScreen = document.getElementById("shopScreen");
document.getElementById("btnOpenShop").onclick = () => {
  shopScreen.classList.remove("hidden");
  renderShop();
};
document.getElementById("btnCloseShop").onclick = () => {
  shopScreen.classList.add("hidden");
};

async function loadLeaderboard() {
  const container = document.getElementById("boardListContainer");
  container.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">Đang tải...</div>';
  let list = [];
  try {
    const res = await fetch("/api/leaderboard");
    if (res.ok) list = await res.json();
  } catch(e) {
    list = [
      { rank: 1, name: "CyberNinja", score: 142, skin: "Void Specter", country: "VN" },
      { rank: 2, name: "Satoshi_99", score: 118, skin: "Sovereign Agent", country: "US" },
      { rank: 3, name: "PhoenixKing", score: 95, skin: "Dragon Flame", country: "JP" },
      { rank: 4, name: "FlapMaster", score: 78, skin: "Golden Phoenix", country: "KR" },
      { rank: 5, name: "NeonRider", score: 64, skin: "Cyber Neon", country: "SG" }
    ];
  }

  container.innerHTML = "";
  list.slice(0, 10).forEach(item => {
    const row = document.createElement("div");
    row.className = "board-item";
    row.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span class="board-rank ${item.rank <= 3 ? "top" + item.rank : ""}">#${item.rank}</span>
        <span style="font-weight:700;">${item.name}</span>
        <span style="font-size:11px; color:#888;">[${item.country || "VN"}]</span>
      </div>
      <span class="board-score">${item.score} pts</span>
    `;
    container.appendChild(row);
  });
}

const leaderboardScreen = document.getElementById("leaderboardScreen");
document.getElementById("btnOpenLeaderboard").onclick = () => {
  leaderboardScreen.classList.remove("hidden");
  loadLeaderboard();
};
document.getElementById("btnCloseLeaderboard").onclick = () => {
  leaderboardScreen.classList.add("hidden");
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
        <button class="claim-btn" ${!isComplete || isClaimed ? "disabled" : ""} id="claim_fb_${q.id}">
          ${isClaimed ? "ĐÃ NHẬN" : (isComplete ? "NHẬN" : "CHƯA XONG")}
        </button>
      </div>
    `;

    const btn = item.querySelector(`#claim_fb_${q.id}`);
    if (isComplete && !isClaimed) {
      btn.onclick = () => {
        qp.claimed = qp.claimed || {};
        qp.claimed[q.id] = true;
        saveQuestProgress(qp);
        coins += q.reward;
        saveState();
        sound.playCoin();
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

document.getElementById("btnChangeName").onclick = () => {
  document.getElementById("nameInputBox").value = getPlayerName();
  document.getElementById("nameModal").classList.remove("hidden");
};
document.getElementById("btnSaveName").onclick = () => {
  const val = document.getElementById("nameInputBox").value;
  setPlayerName(val);
  document.getElementById("nameModal").classList.add("hidden");
  if (gameState === "START") startGame();
};

document.getElementById("btnPlay").onclick = requireNameAndStart;
document.getElementById("btnRestart").onclick = requireNameAndStart;
document.getElementById("btnPauseRestart").onclick = requireNameAndStart;

const web3Screen = document.getElementById("web3Screen");
document.getElementById("btnOpenWeb3").onclick = () => web3Screen.classList.remove("hidden");
document.getElementById("btnCloseWeb3").onclick = () => web3Screen.classList.add("hidden");
document.getElementById("btnCopyWallet").onclick = () => {
  navigator.clipboard.writeText("0x03533D3c88EF9a21FccEB5e98373d17fd07bE298");
  alert(I18N[currentLang].alertCopied);
};
document.getElementById("btnConnectMetaMask").onclick = async () => {
  if (typeof window.ethereum !== "undefined") {
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      alert(`Đã kết nối ví: ${accounts[0]}\nỦng hộ $1.00 để mở khóa skin VIP!`);
      const sov = SKINS.find(s => s.id === "sovereign");
      if (sov) {
        sov.unlocked = true;
        currentSkinId = "sovereign";
        saveState();
        alert("🎉 Chúc mừng! Đã mở khóa Skin VIP Sovereign Agent!");
      }
    } catch(err) {
      alert("Lỗi kết nối ví: " + err.message);
    }
  } else {
    alert("Chưa phát hiện tiện ích ví MetaMask. Bạn có thể sao chép địa chỉ ví để chuyển trực tiếp!");
  }
};

applyGameTranslations();
saveState();
updatePlayerDisplays();
document.getElementById("selectedSkinPreview").innerText = (SKINS.find(s => s.id === currentSkinId) || SKINS[0]).icon;