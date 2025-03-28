const { GAME_WIDTH, GAME_HEIGHT, PLAYER_SIZE, getRandomColor } = require('./constants');

function handleJoin(socket, data, gameState, io) {
  if (Object.keys(gameState.players).length === 0) {
    if (data.mode === "single") {
      gameState.mode = "single";
      gameState.npcConfigs = data.npcConfigs || [];
    } else {
      gameState.mode = "multi";
    }
  } else {
    if (gameState.mode === "single" && Object.values(gameState.players).some(p => !p.isNPC)) {
      socket.emit('joinError', { error: 'Game is in single player mode.' });
      return;
    }
  }
  if (Object.keys(gameState.players).length >= 4) {
    socket.emit('joinError', { error: 'Maximum players reached. Please wait for the next game.' });
    return;
  }
  for (let id in gameState.players) {
    if (gameState.players[id].name === data.name) {
      socket.emit('joinError', { error: 'Name already taken.' });
      return;
    }
  }
  gameState.players[socket.id] = {
    id: socket.id,
    name: data.name,
    x: Math.floor(Math.random() * (GAME_WIDTH - PLAYER_SIZE)),
    y: Math.floor(Math.random() * (GAME_HEIGHT - PLAYER_SIZE)),
    score: 0,
    lives: 3,
    alive: true,
    color: data.color || getRandomColor(),
    inputs: {}
  };
  if (data.mode === "single") {
    if (!Object.values(gameState.players).some(p => p.isNPC)) {
      gameState.npcConfigs.forEach((config, index) => {
        let npcId = "npc_" + (index + 1);
        gameState.players[npcId] = {
          id: npcId,
          name: config.name || ("NPC " + (index + 1)),
          x: Math.floor(Math.random() * (GAME_WIDTH - PLAYER_SIZE)),
          y: Math.floor(Math.random() * (GAME_HEIGHT - PLAYER_SIZE)),
          score: 0,
          lives: 3,
          alive: true,
          color: config.color || getRandomColor(),
          inputs: {},
          isNPC: true,
          difficulty: config.difficulty || "medium",
          customPersonality: config.customPersonality || null
        };
      });
    }
  }
  socket.emit('joinSuccess', gameState.players[socket.id]);
  io.emit('lobbyUpdate', gameState.players);
  io.emit('gameMessage', `${data.name} joined the lobby.`);
}

function handlePlayerInput(socket, input, gameState) {
  const player = gameState.players[socket.id];
  if (player && player.alive && gameState.gameStarted) {
    player.inputs[input.key] = input.state;
  }
}

function handleMenuAction(socket, data, gameState, io) {
  const player = gameState.players[socket.id];
  if (player && gameState.gameStarted) {
    io.emit('gameMessage', `${player.name} ${data.action} the game.`);
    if (data.action === 'pause') {
      gameState.paused = true;
    } else if (data.action === 'resume') {
      gameState.paused = false;
    } else if (data.action === 'restart') {
      gameState.paused = false;
      gameState.gameStarted = true;
      gameState.gameEnded = false;
      gameState.bullets = [];
      gameState.collectibles = [];
      gameState.gameStartTime = Date.now();
      Object.keys(gameState.players).forEach(id => {
        const p = gameState.players[id];
        p.score = 0;
        p.lives = 3;
        p.alive = true;
        p.x = Math.floor(Math.random() * (GAME_WIDTH - PLAYER_SIZE));
        p.y = Math.floor(Math.random() * (GAME_HEIGHT - PLAYER_SIZE));
        p.inputs = {};
      });
      io.emit('gameMessage', `${player.name} restarted the game.`);
      io.emit('gameStarted', gameState);
    } else if (data.action === 'quit') {
      let wasHuman = player && !player.isNPC;
      delete gameState.players[socket.id];
      io.emit('lobbyUpdate', gameState.players);
      if (wasHuman && Object.values(gameState.players).filter(p => !p.isNPC).length === 0) {
        for (let id in gameState.players) {
          if (gameState.players[id].isNPC) {
            delete gameState.players[id];
          }
        }
        gameState.paused = false;
        gameState.gameStarted = false;
        gameState.gameEnded = false;
        gameState.bullets = [];
        gameState.collectibles = [];
        gameState.gameStartTime = null;
        gameState.mode = "multi";
        gameState.npcConfigs = [];
        io.emit('lobbyUpdate', gameState.players);
      }
    }
  }
}

function handleLeaveLobby(socket, gameState, io) {
  if (gameState.players[socket.id]) {
    let wasHuman = !gameState.players[socket.id].isNPC;
    io.emit('gameMessage', `${gameState.players[socket.id].name} has left the lobby.`);
    delete gameState.players[socket.id];
    io.emit('lobbyUpdate', gameState.players);
    if (wasHuman && Object.values(gameState.players).filter(p => !p.isNPC).length === 0) {
      for (let id in gameState.players) {
        if (gameState.players[id].isNPC) {
          delete gameState.players[id];
        }
      }
      gameState.mode = "multi";
      gameState.npcConfigs = [];
      io.emit('lobbyUpdate', gameState.players);
    }
  }
}

function handleStartGame(socket, gameState, io) {
  if (gameState.mode === "multi" && Object.keys(gameState.players).length < 2) {
    socket.emit('gameMessage', 'Not enough players to start the game. Need at least 2 players.');
    return;
  }
  if (gameState.mode === "single" && Object.values(gameState.players).filter(p => !p.isNPC).length < 1) {
    socket.emit('gameMessage', 'No human player in single player mode.');
    return;
  }
  const leadId = Object.keys(gameState.players)[0];
  if (socket.id === leadId && !gameState.gameStarted) {
    gameState.gameStarted = true;
    gameState.gameStartTime = Date.now();
    io.emit('gameStarted', gameState);
    io.emit('gameMessage', 'Game has started!');
  }
}

function handleDisconnect(socket, gameState, io) {
  if (gameState.players[socket.id]) {
    io.emit('gameMessage', `${gameState.players[socket.id].name} has disconnected.`);
    delete gameState.players[socket.id];
    io.emit('lobbyUpdate', gameState.players);
    if (Object.values(gameState.players).filter(p => !p.isNPC).length === 0) {
      for (let id in gameState.players) {
        if (gameState.players[id].isNPC) {
          delete gameState.players[id];
        }
      }
      io.emit('lobbyUpdate', gameState.players);
    }
  }
}

function registerSocketHandlers(io, gameState) {
  io.on('connection', socket => {
    console.log('A new player connected:', socket.id);
    socket.on('join', data => handleJoin(socket, data, gameState, io));
    socket.on('playerInput', input => handlePlayerInput(socket, input, gameState));
    socket.on('menuAction', data => handleMenuAction(socket, data, gameState, io));
    socket.on('leaveLobby', () => handleLeaveLobby(socket, gameState, io));
    socket.on('startGame', () => handleStartGame(socket, gameState, io));
    socket.on('disconnect', () => handleDisconnect(socket, gameState, io));
  });
}

module.exports = {
  registerSocketHandlers
};