const GAME_WIDTH = 1200;
const GAME_HEIGHT = 800;
const PLAYER_SIZE = 40;
const BULLET_SIZE = 10;
const COLLECTIBLE_SIZE = 20;
const BULLET_SPEED = 4;
const PLAYER_SPEED = 5;
const GAME_DURATION = 120000;

function getRandomColor() {
  const colors = [
    '#FF5733',
    '#33FF57',
    '#3357FF',
    '#FF33A8',
    '#FFD700',
    '#9D33FF',
    '#33FFF8',
    '#FF8733',
    '#94FF33',
    '#FF3333'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function checkCollision(a, aw, ah, b, bw, bh) {
  return a.x < b.x + bw && a.x + aw > b.x && a.y < b.y + bh && a.y + ah > b.y;
}

const DIFFICULTY_DESCRIPTIONS = {
  easy: "Weak strategy, occasionally fails to complete objectives",
  medium: "Good strategy, high chance of implementing their plan",
  hard: "Awesome strategy, and almost never fails to achieve objectives",
  unfair: "Perfect strategy and execution, extremely challenging to play against"
};

module.exports = {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAYER_SIZE,
  BULLET_SIZE,
  COLLECTIBLE_SIZE,
  BULLET_SPEED,
  PLAYER_SPEED,
  GAME_DURATION,
  getRandomColor,
  checkCollision,
  DIFFICULTY_DESCRIPTIONS
};