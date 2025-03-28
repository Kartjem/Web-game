const socket = io({ transports: ['websocket'] });
const hitSound = new Audio('sounds/hit.mp3');
const gameOverSound = new Audio('sounds/gameover.mp3');
const collectibleSound = new Audio('sounds/collectible.mp3');
const landingScreen = document.getElementById('landingScreen');
const multiplayerBtn = document.getElementById('multiplayerBtn');
const singlePlayerBtn = document.getElementById('singlePlayerBtn');
const joinScreen = document.getElementById('joinScreen');
const joinForm = document.getElementById('joinForm');
const playerNameInput = document.getElementById('playerName');
const joinError = document.getElementById('joinError');
const npcOptions = document.getElementById('npcOptions');
const npcCountSelect = document.getElementById('npcCount');
const npcDifficultyContainer = document.getElementById('npcDifficultyContainer');
const npcCustomization = document.getElementById('npcCustomization');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const lobbyInfo = document.getElementById('lobbyInfo');
const lobbyPlayersDiv = document.getElementById('lobbyPlayers');
const startGameBtn = document.getElementById('startGame');
const exitLobbyBtn = document.getElementById('exitLobby');
const gameScreen = document.getElementById('gameScreen');
const gameArea = document.getElementById('gameArea');
const scoreboard = document.getElementById('scoreboard');
const timerDisplay = document.getElementById('timer');
const menu = document.getElementById('menu');
const messagesDiv = document.getElementById('messages');
const menuToggle = document.getElementById('menuToggle');
const resumeBtn = document.getElementById('resume');
const restartBtn = document.getElementById('restart');
const exitGameBtn = document.getElementById('exitGame');

let player = null;
let gameState = null;
let gameStartTime = null;
let pausedTimeAcc = 0;
let pauseStartTime = null;
let animationFrameId = null;
let inGame = false;
let mode = "multi";

function updateNpcDifficultyOptions() {
  npcDifficultyContainer.innerHTML = "";
  let count = parseInt(npcCountSelect.value);
  for(let i = 0; i < count; i++){
    let div = document.createElement('div');
    div.classList.add('legacy-npc-option');
    div.style.display = 'none';
    let label = document.createElement('label');
    label.textContent = "NPC " + (i+1) + " Difficulty:";
    let select = document.createElement('select');
    select.classList.add('npcDifficulty');
    let option1 = document.createElement('option');
    option1.value = "easy";
    option1.textContent = "Easy";
    let option2 = document.createElement('option');
    option2.value = "medium";
    option2.textContent = "Medium";
    let option3 = document.createElement('option');
    option3.value = "hard";
    option3.textContent = "Hard";
    let option4 = document.createElement('option');
    option4.value = "unfair";
    option4.textContent = "Unfair";
    select.appendChild(option1);
    select.appendChild(option2);
    select.appendChild(option3);
    select.appendChild(option4);
    div.appendChild(label);
    div.appendChild(select);
    npcDifficultyContainer.appendChild(div);
  }
}

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    button.classList.add('active');
    const tabId = button.getAttribute('data-tab');
    document.querySelector(`.tab-content[data-tab="${tabId}"]`).classList.add('active');
  });
});

function updateNpcTabs() {
  const count = parseInt(npcCountSelect.value);
  tabButtons.forEach(button => {
    const tabId = parseInt(button.getAttribute('data-tab'));
    if (tabId <= count) {
      button.style.display = 'block';
    } else {
      button.style.display = 'none';
    }
  });
  
  if (parseInt(document.querySelector('.tab-btn.active').getAttribute('data-tab')) > count) {
    tabButtons[0].click();
  }
}

function updatePersonalitySliders(npcIndex) {
  const difficultySelect = document.getElementById(`npc${npcIndex}-difficulty`);
  const difficulty = difficultySelect.value;
  
  let aggression, collector, cautious;
  
  switch(difficulty) {
    case 'easy':
      aggression = 20 + Math.floor(Math.random() * 10);
      collector = 20 + Math.floor(Math.random() * 10);
      cautious = 30 + Math.floor(Math.random() * 10);
      break;
    case 'medium':
      aggression = 40 + Math.floor(Math.random() * 10);
      collector = 40 + Math.floor(Math.random() * 10);
      cautious = 50 + Math.floor(Math.random() * 10);
      break;
    case 'hard':
      aggression = 70 + Math.floor(Math.random() * 10);
      collector = 60 + Math.floor(Math.random() * 10);
      cautious = 80 + Math.floor(Math.random() * 10);
      break;
    case 'unfair':
      aggression = 100;
      collector = 100;
      cautious = 100;
      break;
  }
  
  const aggressionSlider = document.getElementById(`npc${npcIndex}-aggression`);
  const collectorSlider = document.getElementById(`npc${npcIndex}-collector`);
  const cautiousSlider = document.getElementById(`npc${npcIndex}-cautious`);
  
  if (!aggressionSlider.classList.contains('customized')) {
    aggressionSlider.value = aggression;
    updateSliderLabel(aggressionSlider);
  }
  
  if (!collectorSlider.classList.contains('customized')) {
    collectorSlider.value = collector;
    updateSliderLabel(collectorSlider);
  }
  
  if (!cautiousSlider.classList.contains('customized')) {
    cautiousSlider.value = cautious;
    updateSliderLabel(cautiousSlider);
  }
}

function updateSliderLabel(slider) {
  slider.nextElementSibling.textContent = slider.value + '%';
}

function markAsCustomized(slider) {
  slider.classList.add('customized');
  slider.parentElement.classList.add('customized');
  updateSliderLabel(slider);
}

function resetCustomization(npcIndex) {
  const aggressionSlider = document.getElementById(`npc${npcIndex}-aggression`);
  const collectorSlider = document.getElementById(`npc${npcIndex}-collector`);
  const cautiousSlider = document.getElementById(`npc${npcIndex}-cautious`);
  
  aggressionSlider.classList.remove('customized');
  collectorSlider.classList.remove('customized');
  cautiousSlider.classList.remove('customized');
  
  aggressionSlider.parentElement.classList.remove('customized');
  collectorSlider.parentElement.classList.remove('customized');
  cautiousSlider.parentElement.classList.remove('customized');
  
  updatePersonalitySliders(npcIndex);
}

function addSliderListeners() {
  for (let i = 1; i <= 3; i++) {
    const aggSlider = document.getElementById(`npc${i}-aggression`);
    const colSlider = document.getElementById(`npc${i}-collector`);
    const cautSlider = document.getElementById(`npc${i}-cautious`);
    const difficultySelect = document.getElementById(`npc${i}-difficulty`);
    
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset to Preset';
    resetBtn.type = 'button';
    resetBtn.className = 'reset-btn';
    resetBtn.addEventListener('click', () => resetCustomization(i));
    
    const noteP = aggSlider.parentElement.parentElement.querySelector('.personality-note');
    noteP.parentElement.insertBefore(resetBtn, noteP.nextSibling);
    
    aggSlider.addEventListener('input', () => {
      markAsCustomized(aggSlider);
      updateSliderLabel(aggSlider);
    });
    
    colSlider.addEventListener('input', () => {
      markAsCustomized(colSlider);
      updateSliderLabel(colSlider);
    });
    
    cautSlider.addEventListener('input', () => {
      markAsCustomized(cautSlider);
      updateSliderLabel(cautSlider);
    });
    
    difficultySelect.addEventListener('change', () => {
      resetCustomization(i);
    });
  }
}

for (let i = 1; i <= 3; i++) {
  const difficultySelect = document.getElementById(`npc${i}-difficulty`);
  difficultySelect.addEventListener('change', () => updatePersonalitySliders(i));
  
  updatePersonalitySliders(i);
}

addSliderListeners();

npcCountSelect.addEventListener('change', () => {
  updateNpcDifficultyOptions();
  updateNpcTabs();
});

updateNpcTabs();

multiplayerBtn.addEventListener('click', () => {
  landingScreen.classList.add('hidden');
  joinScreen.classList.remove('hidden');
  joinForm.classList.remove('hidden');
  lobbyInfo.classList.add('hidden');
  npcOptions.classList.add('hidden');
  mode = "multi";
});

singlePlayerBtn.addEventListener('click', () => {
  landingScreen.classList.add('hidden');
  joinScreen.classList.remove('hidden');
  joinForm.classList.remove('hidden');
  lobbyInfo.classList.add('hidden');
  npcOptions.classList.remove('hidden');
  mode = "single";
  updateNpcDifficultyOptions();
});

joinForm.addEventListener('submit', (e) => {
  e.preventDefault();
  let name = playerNameInput.value.trim();
  if(name === '') return;
  let data = { name: name, mode: mode };
  if(mode === "single") {
    let npcConfigs = [];
    const count = parseInt(npcCountSelect.value);
    
    for(let i = 1; i <= count; i++){
      const npcName = document.getElementById(`npc${i}-name`).value.trim() || `NPC ${i}`;
      const npcDifficulty = document.getElementById(`npc${i}-difficulty`).value;
      const npcColor = document.getElementById(`npc${i}-color`).value;
      
      const aggression = parseInt(document.getElementById(`npc${i}-aggression`).value) / 100;
      const collector = parseInt(document.getElementById(`npc${i}-collector`).value) / 100;
      const cautious = parseInt(document.getElementById(`npc${i}-cautious`).value) / 100;
      
      npcConfigs.push({ 
        name: npcName,
        difficulty: npcDifficulty,
        color: npcColor,
        customPersonality: {
          aggression,
          collector,
          cautious
        }
      });
    }
    
    data.npcConfigs = npcConfigs;
  }
  socket.emit('join', data);
});

socket.on('joinSuccess', (data) => {
  player = data;
  joinForm.classList.add('hidden');
  npcOptions.classList.add('hidden');
  lobbyInfo.classList.remove('hidden');
});

socket.on('joinError', (data) => {
  joinError.textContent = data.error;
});

socket.on('lobbyUpdate', (players) => {
  lobbyPlayersDiv.innerHTML = "";
  const ids = Object.keys(players);
  ids.forEach(id => {
    const p = document.createElement('div');
    p.textContent = players[id].name;
    lobbyPlayersDiv.appendChild(p);
  });
  if(player && ids.length > 0 && ids[0] === player.id) {
    startGameBtn.classList.remove('hidden');
  } else {
    startGameBtn.classList.add('hidden');
  }
});

exitLobbyBtn.addEventListener('click', () => {
  socket.emit('leaveLobby');
  player = null;
  joinForm.classList.remove('hidden');
  lobbyInfo.classList.add('hidden');
  joinForm.reset();
  landingScreen.classList.remove('hidden');
});

startGameBtn.addEventListener('click', () => {
  socket.emit('startGame');
});

socket.on('gameStarted', (state) => {
  joinScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  gameStartTime = state.gameStartTime;
  pausedTimeAcc = 0;
  pauseStartTime = null;
  inGame = true;
  menu.classList.add('hidden');
  if(!animationFrameId) {
    animationFrameId = requestAnimationFrame(gameLoop);
  }
});

socket.on('playSound', (data) => {
  if(data.sound === 'hit'){
    hitSound.play();
  } else if(data.sound === 'gameover'){
    gameOverSound.play();
  } else if(data.sound === 'collectible'){
    collectibleSound.play();
  }
});

menuToggle.addEventListener('click', () => {
  if(inGame) {
    socket.emit('menuAction', { action: 'pause' });
    menu.classList.remove('hidden');
  }
});

resumeBtn.addEventListener('click', () => {
  socket.emit('menuAction', { action: 'resume' });
  menu.classList.add('hidden');
});

restartBtn.addEventListener('click', () => {
  socket.emit('menuAction', { action: 'restart' });
  menu.classList.add('hidden');
});

exitGameBtn.addEventListener('click', () => {
  socket.emit('menuAction', { action: 'quit' });
  cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  gameStartTime = null;
  pausedTimeAcc = 0;
  pauseStartTime = null;
  inGame = false;
  gameScreen.classList.add('hidden');
  joinScreen.classList.add('hidden');
  landingScreen.classList.remove('hidden');
  joinForm.reset();
  player = null;
  gameState = null;
});

socket.on('gameMessage', (msg) => {
  const p = document.createElement('p');
  p.textContent = msg;
  messagesDiv.appendChild(p);
  setTimeout(() => {
    messagesDiv.removeChild(p);
  }, 5000);
});

socket.on('gameState', (state) => {
  gameState = state;
  Renderer.updatePlayers();
  Renderer.updateBullets();
  Renderer.updateCollectibles();
  Renderer.updateScoreboard();
});

socket.on('gameOver', (data) => {
  timerDisplay.textContent = "00:00";
  cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  gameStartTime = null;
  menu.classList.add('hidden');
  socket.emit('leaveLobby');
  setTimeout(() => {
    inGame = false;
    gameScreen.classList.add('hidden');
    joinScreen.classList.add('hidden');
    landingScreen.classList.remove('hidden');
    joinForm.reset();
    player = null;
    gameState = null;
  }, 5000);
});

document.addEventListener('keydown', (event) => {
  socket.emit('playerInput', { key: event.key, state: 'down' });
});
document.addEventListener('keyup', (event) => {
  socket.emit('playerInput', { key: event.key, state: 'up' });
});

const Renderer = (function() {
  const playerElements = {};
  const bulletElements = {};
  const collectibleElements = {};
  function updatePlayers() {
    for(const id in playerElements) {
      if(!gameState.players[id]){
        playerElements[id].remove();
        delete playerElements[id];
      }
    }
    for(const id in gameState.players) {
      const pData = gameState.players[id];
      if(!playerElements[id]){
        const playerElem = document.createElement('div');
        playerElem.classList.add('player');
        playerElem.setAttribute('data-id', id);
        playerElem.textContent = pData.name;
        playerElem.style.backgroundColor = pData.color || 'red';
        gameArea.appendChild(playerElem);
        playerElements[id] = playerElem;
        playerElem.lastX = null;
        playerElem.lastY = null;
        playerElem.lastAlive = null;
      }
      const playerElem = playerElements[id];
      if(playerElem.lastX !== pData.x || playerElem.lastY !== pData.y){
        playerElem.style.transform = `translate(${pData.x}px, ${pData.y}px)`;
        playerElem.lastX = pData.x;
        playerElem.lastY = pData.y;
      }
      if(playerElem.lastAlive !== pData.alive){
        playerElem.style.opacity = pData.alive ? 1 : 0.5;
        playerElem.lastAlive = pData.alive;
      }
    }
  }

  function updateBullets() {
    for(const id in bulletElements) {
      if(!gameState.bullets.some(bullet => bullet.id === id)){
        bulletElements[id].remove();
        delete bulletElements[id];
      }
    }
    gameState.bullets.forEach(bullet => {
      if(!bulletElements[bullet.id]){
        const bulletElem = document.createElement('div');
        bulletElem.classList.add('bullet');
        bulletElem.setAttribute('data-id', bullet.id);
        gameArea.appendChild(bulletElem);
        bulletElements[bullet.id] = bulletElem;
        bulletElem.lastX = null;
        bulletElem.lastY = null;
      }
      const bulletElem = bulletElements[bullet.id];
      if(bulletElem.lastX !== bullet.x || bulletElem.lastY !== bullet.y){
        bulletElem.style.transform = `translate(${bullet.x}px, ${bullet.y}px)`;
        bulletElem.lastX = bullet.x;
        bulletElem.lastY = bullet.y;
      }
    });
  }

  function updateCollectibles() {
    for(const id in collectibleElements) {
      if(!gameState.collectibles.some(collectible => collectible.id === id)){
        collectibleElements[id].remove();
        delete collectibleElements[id];
      }
    }
    gameState.collectibles.forEach(collectible => {
      if(!collectibleElements[collectible.id]){
        const collectibleElem = document.createElement('div');
        collectibleElem.classList.add('collectible');
        collectibleElem.setAttribute('data-id', collectible.id);
        gameArea.appendChild(collectibleElem);
        collectibleElements[collectible.id] = collectibleElem;
        collectibleElem.lastX = null;
        collectibleElem.lastY = null;
      }
      const collectibleElem = collectibleElements[collectible.id];
      if(collectibleElem.lastX !== collectible.x || collectibleElem.lastY !== collectible.y){
        collectibleElem.style.transform = `translate(${collectible.x}px, ${collectible.y}px)`;
        collectibleElem.lastX = collectible.x;
        collectibleElem.lastY = collectible.y;
      }
    });
  }

  function updateScoreboard() {
    scoreboard.innerHTML = "";
    for(let id in gameState.players) {
      const pData = gameState.players[id];
      const scoreItem = document.createElement('div');
      scoreItem.textContent = `${pData.name}: ${pData.score} | Lives: ${pData.lives}`;
      scoreboard.appendChild(scoreItem);
    }
  }

  function updateTimer() {
    if(!gameState) {
      timerDisplay.textContent = "00:00";
      return;
    }
    if(!gameStartTime || (gameState && gameState.gameEnded)) {
      timerDisplay.textContent = "00:00";
      return;
    }
    if(gameState.paused) {
      if(pauseStartTime === null) {
        pauseStartTime = Date.now();
      }
      const elapsed = pauseStartTime - gameStartTime - pausedTimeAcc;
      const minutes = String(Math.floor(elapsed / 60000)).padStart(2, '0');
      const seconds = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
      timerDisplay.textContent = `${minutes}:${seconds}`;
    } else {
      if(pauseStartTime !== null) {
        pausedTimeAcc += Date.now() - pauseStartTime;
        pauseStartTime = null;
      }
      const elapsed = Date.now() - gameStartTime - pausedTimeAcc;
      const minutes = String(Math.floor(elapsed / 60000)).padStart(2, '0');
      const seconds = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
      timerDisplay.textContent = `${minutes}:${seconds}`;
    }
  }
  return {
    updatePlayers,
    updateBullets,
    updateCollectibles,
    updateScoreboard,
    updateTimer
  };
})();

let lastFrameTime = 0;
const fpsInterval = 1000 / 60;

function gameLoop(timestamp) {
  if(!lastFrameTime) lastFrameTime = timestamp;
  const elapsed = timestamp - lastFrameTime;
  if(elapsed > fpsInterval) {
    lastFrameTime = timestamp - (elapsed % fpsInterval);
    Renderer.updateTimer();
  }
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);