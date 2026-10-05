const GAME_LEADERBOARDS = {
  flappy: [
    { rank: 1, name: "CyberNinja_99", skin: "Void Specter", score: 148 },
    { rank: 2, name: "Satoshi_Flap", skin: "Sovereign Agent", score: 124 },
    { rank: 3, name: "Phoenix_Pro", skin: "Golden Phoenix", score: 98 },
    { rank: 4, name: "NeonRider", skin: "Cyber Neon", score: 82 },
    { rank: 5, name: "CanaryMaster", skin: "Classic Canary", score: 65 }
  ],
  snake: [
    { rank: 1, name: "Satoshi_Snake", skin: "Golden Dragon", score: 95 },
    { rank: 2, name: "Viper_Base", skin: "Plasma Violet", score: 84 },
    { rank: 3, name: "NeonPython", skin: "Neon Cyan", score: 72 },
    { rank: 4, name: "CryptoCobra", skin: "Cyber Green", score: 58 },
    { rank: 5, name: "CyberWorm", skin: "Cyber Green", score: 45 }
  ],
  invaders: [
    { rank: 1, name: "NeonPilot_X", skin: "Quantum Phantom", score: 135 },
    { rank: 2, name: "AstroBot_01", skin: "Plasma Cruiser", score: 110 },
    { rank: 3, name: "StarHunter", skin: "Neon Striker", score: 92 },
    { rank: 4, name: "LaserCommander", skin: "Solar Destroyer", score: 74 },
    { rank: 5, name: "CosmicVoid", skin: "Neon Striker", score: 56 }
  ],
  brick: [
    { rank: 1, name: "NeonPaddle_99", skin: "Quantum Paddle", score: 280 },
    { rank: 2, name: "CyberBall_01", skin: "Plasma Ball", score: 210 },
    { rank: 3, name: "LaserBreaker", skin: "Laser Paddle", score: 165 },
    { rank: 4, name: "VoidCrusher", skin: "Neon Paddle", score: 120 },
    { rank: 5, name: "AIAgent_Brick", skin: "Neon Paddle", score: 85 }
  ]
};

let currentBoardTab = 'flappy';
let pendingGameUrl = null;

function getPlayerName() {
  return localStorage.getItem('arcade_player_name') || '';
}

function setPlayerName(name) {
  name = name.trim().slice(0, 14);
  if (!name) name = 'Player_' + Math.floor(Math.random() * 899 + 100);
  localStorage.setItem('arcade_player_name', name);
  updateUserDisplay();
  return name;
}

function promptChangePlayerName() {
  const cur = getPlayerName();
  document.getElementById('playerNameInputModal').value = cur || 'Player_' + Math.floor(Math.random() * 899 + 100);
  openModal('nameModal');
}

function savePlayerNameFromModal() {
  const val = document.getElementById('playerNameInputModal').value;
  setPlayerName(val);
  closeModal('nameModal');
  if (pendingGameUrl) {
    const dest = pendingGameUrl;
    pendingGameUrl = null;
    window.location.href = dest;
  }
}

function handleGameLaunch(e, url) {
  const name = getPlayerName();
  if (!name) {
    e.preventDefault();
    pendingGameUrl = `${url}?lang=${currentLang}`;
    document.getElementById('playerNameInputModal').value = 'Player_' + Math.floor(Math.random() * 899 + 100);
    openModal('nameModal');
  }
}

function updateUserDisplay() {
  const name = getPlayerName() || 'Player';
  document.getElementById('hubPlayerDisplay').innerText = name;
  document.querySelectorAll('.cardPlayerName').forEach(el => el.innerText = name);

  const fbScore = parseInt(localStorage.getItem('fb_high_score') || '0', 10);
  const fbCoins = parseInt(localStorage.getItem('fb_coins') || '40', 10);
  document.getElementById('fbCardScore').innerText = fbScore;
  document.getElementById('fbCardCoins').innerText = fbCoins;
  document.getElementById('fbCardRank').innerText = fbScore > 0 ? (fbScore > 100 ? '#2' : '#8') : '#--';

  const snakeScore = parseInt(localStorage.getItem('snake_highscore') || '0', 10);
  const snakeCoins = parseInt(localStorage.getItem('snake_coins') || '0', 10);
  document.getElementById('snakeCardScore').innerText = snakeScore;
  document.getElementById('snakeCardCoins').innerText = snakeCoins;
  document.getElementById('snakeCardRank').innerText = snakeScore > 0 ? (snakeScore > 70 ? '#3' : '#12') : '#--';

  const invScore = parseInt(localStorage.getItem('void_highscore') || '0', 10);
  const invCoins = parseInt(localStorage.getItem('void_coins') || '0', 10);
  document.getElementById('invadersCardScore').innerText = invScore;
  document.getElementById('invadersCardCoins').innerText = invCoins;
  document.getElementById('invadersCardRank').innerText = invScore > 0 ? (invScore > 90 ? '#4' : '#15') : '#--';

  const brickScore = parseInt(localStorage.getItem('brick_highscore') || '0', 10);
  const brickCoins = parseInt(localStorage.getItem('arcade_coins') || '0', 10);
  if (document.getElementById('brickCardScore')) document.getElementById('brickCardScore').innerText = brickScore;
  if (document.getElementById('brickCardCoins')) document.getElementById('brickCardCoins').innerText = brickCoins;
  if (document.getElementById('brickCardRank')) document.getElementById('brickCardRank').innerText = brickScore > 0 ? (brickScore > 150 ? '#3' : '#9') : '#--';
}

function switchLeaderboardTab(tab) {
  currentBoardTab = tab;
  const tabs = document.querySelectorAll('.board-tab');
  tabs.forEach(t => t.classList.remove('active'));
  const activeIdx = tab === 'flappy' ? 0 : (tab === 'snake' ? 1 : (tab === 'invaders' ? 2 : 3));
  if (tabs[activeIdx]) tabs[activeIdx].classList.add('active');

  renderLeaderboardTab(tab);
}

async function connectWeb3Wallet() {
  const statusEl = document.getElementById('walletStatusMsg');
  if (typeof window.ethereum !== 'undefined') {
    try {
      statusEl.innerHTML = '<span style="color:#ffe600;">⏳ Đang kết nối ví Web3...</span>';
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        const userAddr = accounts[0];
        const shortAddr = userAddr.slice(0, 6) + '...' + userAddr.slice(-4);
        statusEl.innerHTML = `🟢 <strong>Đã kết nối:</strong> <span style="font-family:monospace; color:#00ffaa;">${shortAddr}</span><br>
        <button class="play-btn" style="margin-top:8px; padding:8px 16px; font-size:12px; background:linear-gradient(135deg, #ff007f, #ffe600); color:#000;" onclick="sendCryptoTip()">
          ⚡ TẶNG 0.001 ETH TIẾP SỨC CHO BOT
        </button>`;
        document.getElementById('btnConnectWeb3').innerText = '✅ ' + shortAddr;
      }
    } catch (err) {
      statusEl.innerHTML = `<span style="color:#ff007f;">❌ Lỗi kết nối: ${err.message || 'Người dùng đã hủy'}</span>`;
    }
  } else {
    statusEl.innerHTML = '<span style="color:#ffe600;">⚠️ Chưa phát hiện MetaMask / Web3 trên trình duyệt. Bạn có thể quét mã QR hoặc bấm [SAO CHÉP VÍ] để chuyển qua app Binance / OKX / TrustWallet!</span>';
  }
}

async function sendCryptoTip() {
  const statusEl = document.getElementById('walletStatusMsg');
  try {
    if (!window.ethereum) return;
    const botWallet = "0x03533D3c88EF9a21FccEB5e98373d17fd07bE298";
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (!accounts || accounts.length === 0) return;
    const tx = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        to: botWallet,
        from: accounts[0],
        value: '0x38D7EA4C68000'
      }]
    });
    statusEl.innerHTML = `🎉 <strong>Gửi tip thành công!</strong> TX: <span style="font-family:monospace; font-size:11px;">${tx.slice(0, 10)}...</span><br>Bot AI cảm ơn bạn đã tiếp thêm compute power!`;
  } catch (e) {
    statusEl.innerHTML = `<span style="color:#ff007f;">Giao dịch chưa hoàn tất: ${e.message}</span>`;
  }
}

function renderLeaderboardTab(tab) {
  const tbody = document.getElementById('boardTableBody');
  const list = GAME_LEADERBOARDS[tab] || [];
  const myName = getPlayerName();
  
  tbody.innerHTML = '';
  list.forEach(item => {
    const tr = document.createElement('tr');
    const isMe = myName && item.name.toLowerCase() === myName.toLowerCase();
    if (isMe) tr.style.background = 'rgba(0, 255, 170, 0.15)';

    tr.innerHTML = `
      <td style="${item.rank === 1 ? 'color:#ffe600; font-weight:800;' : (item.rank === 2 ? 'color:#cccccc; font-weight:800;' : (item.rank === 3 ? 'color:#cd7f32; font-weight:800;' : ''))}">
        ${item.rank === 1 ? '🥇 1' : (item.rank === 2 ? '🥈 2' : (item.rank === 3 ? '🥉 3' : item.rank))}
      </td>
      <td style="font-weight:700;">${item.name} ${isMe ? '<span style="font-size:10px; color:#00ffaa;">(BẠN)</span>' : ''}</td>
      <td style="color:#a8b0d3; font-size:12px;">${item.skin}</td>
      <td style="text-align: right; color:#00f3ff; font-weight:800;">${item.score}</td>
    `;
    tbody.appendChild(tr);
  });
}

let currentLang = localStorage.getItem('game_lang') || 'vi';

function changeHubLanguage(lang) {
  if (typeof I18N === 'undefined' || !I18N[lang]) lang = 'vi';
  currentLang = lang;
  localStorage.setItem('game_lang', lang);
  document.getElementById('hubLangSelect').value = lang;

  if (typeof I18N !== 'undefined' && I18N[lang]) {
    const t = I18N[lang];
    if (document.getElementById('txtRuntimeVer')) document.getElementById('txtRuntimeVer').innerText = t.runtimeVer;
    if (document.getElementById('txtNavPlayer')) document.getElementById('txtNavPlayer').innerText = t.navPlayer;
    if (document.getElementById('txtNavStory')) document.getElementById('txtNavStory').innerText = t.navStory;
    if (document.getElementById('txtNavWeb3')) document.getElementById('txtNavWeb3').innerText = t.navWeb3;
    if (document.getElementById('txtNavBoard')) document.getElementById('txtNavBoard').innerText = t.navBoard;

    if (document.getElementById('txtHubTitle')) document.getElementById('txtHubTitle').innerText = t.hubTitle;
    if (document.getElementById('txtHubSubtitle')) document.getElementById('txtHubSubtitle').innerText = t.hubSubtitle;

    if (document.getElementById('txtBannerAiTitle')) document.getElementById('txtBannerAiTitle').innerText = t.bannerAiTitle;
    if (document.getElementById('txtBannerAiSub')) document.getElementById('txtBannerAiSub').innerText = t.bannerAiSub;
    if (document.getElementById('txtBannerAiBtn')) document.getElementById('txtBannerAiBtn').innerText = t.bannerAiBtn;

    if (document.getElementById('txtBannerWeb3Title')) document.getElementById('txtBannerWeb3Title').innerText = t.bannerWeb3Title;
    if (document.getElementById('txtBannerWeb3Sub')) document.getElementById('txtBannerWeb3Sub').innerText = t.bannerWeb3Sub;
    if (document.getElementById('txtBannerWeb3Btn')) document.getElementById('txtBannerWeb3Btn').innerText = t.bannerWeb3Btn;

    if (document.getElementById('txtTagFlappy')) document.getElementById('txtTagFlappy').innerText = t.tagFlappy;
    if (document.getElementById('txtTitleFlappy')) document.getElementById('txtTitleFlappy').innerText = t.titleFlappy;
    if (document.getElementById('txtDescFlappy')) document.getElementById('txtDescFlappy').innerText = t.descFlappy;

    if (document.getElementById('txtTagSnake')) document.getElementById('txtTagSnake').innerText = t.tagSnake;
    if (document.getElementById('txtTitleSnake')) document.getElementById('txtTitleSnake').innerText = t.titleSnake;
    if (document.getElementById('txtDescSnake')) document.getElementById('txtDescSnake').innerText = t.descSnake;

    if (document.getElementById('txtTagInvaders')) document.getElementById('txtTagInvaders').innerText = t.tagInvaders;
    if (document.getElementById('txtTitleInvaders')) document.getElementById('txtTitleInvaders').innerText = t.titleInvaders;
    if (document.getElementById('txtDescInvaders')) document.getElementById('txtDescInvaders').innerText = t.descInvaders;

    document.querySelectorAll('.txtPlayBtn').forEach(el => el.innerText = t.playBtn);

    if (document.getElementById('txtStatusTitle')) document.getElementById('txtStatusTitle').innerText = t.statusTitle;
    if (document.getElementById('txtStatVisits')) document.getElementById('txtStatVisits').innerText = t.statVisits;
    if (document.getElementById('txtStatPlays')) document.getElementById('txtStatPlays').innerText = t.statPlays;
    if (document.getElementById('txtStatUsers')) document.getElementById('txtStatUsers').innerText = t.statUsers;
    if (document.getElementById('txtStatRunning')) document.getElementById('txtStatRunning').innerText = t.statRunning;
    if (document.getElementById('statRunning')) document.getElementById('statRunning').innerText = t.runningGamesVal;

    if (document.getElementById('txtWalletLabel')) document.getElementById('txtWalletLabel').innerText = t.walletLabel;
    if (document.getElementById('txtCopyBtn')) document.getElementById('txtCopyBtn').innerText = t.copyBtn;
    if (document.getElementById('txtFooter')) document.getElementById('txtFooter').innerHTML = t.footer;

    if (document.getElementById('txtModalStoryTitle')) document.getElementById('txtModalStoryTitle').innerText = t.modalStoryTitle;
    if (document.getElementById('txtModalStoryBody')) document.getElementById('txtModalStoryBody').innerHTML = t.modalStoryBody;

    if (document.getElementById('txtModalWeb3Title')) document.getElementById('txtModalWeb3Title').innerText = t.modalWeb3Title;
    if (document.getElementById('txtModalWeb3Desc')) document.getElementById('txtModalWeb3Desc').innerText = t.modalWeb3Desc;

    if (document.getElementById('txtModalBoardTitle')) document.getElementById('txtModalBoardTitle').innerText = t.modalBoardTitle;
  }

  document.querySelectorAll('.game-link').forEach(link => {
    const baseHref = link.getAttribute('href').split('?')[0];
    link.setAttribute('href', `${baseHref}?lang=${lang}`);
  });
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
  if (id === 'leaderboardModal') {
    renderLeaderboardTab(currentBoardTab);
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

function closeModalOnBg(e, id) {
  if (e.target.id === id) closeModal(id);
}

function copyWallet() {
  const addr = document.getElementById('walletAddr').innerText.trim();
  const t = (typeof I18N !== 'undefined' && I18N[currentLang]) ? I18N[currentLang] : { copyAlert: "Đã sao chép địa chỉ ví!" };
  navigator.clipboard.writeText(addr).then(() => {
    alert(t.copyAlert + "\n\nEVM: " + addr);
  }).catch(() => {
    prompt("Sao chép ví bên dưới:", addr);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!getPlayerName()) {
    setPlayerName('CyberPilot_' + Math.floor(Math.random() * 899 + 100));
  }
  updateUserDisplay();
  changeHubLanguage(currentLang);

  fetch('/api/stats')
    .then(res => res.json())
    .then(data => {
      if (data.totalVisits) document.getElementById('statVisits').innerText = data.totalVisits.toLocaleString();
      if (data.totalGamesPlayed) document.getElementById('statPlays').innerText = data.totalGamesPlayed.toLocaleString();
      if (data.uniqueUsers) document.getElementById('statUsers').innerText = data.uniqueUsers.toLocaleString();
    })
    .catch(() => {});
});