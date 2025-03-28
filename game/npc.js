function updateNPC(npc, gameState) {
  if (!npc.personality) {
    npc.personality = {};
    
    if (npc.customPersonality) {
      npc.personality.aggression = npc.customPersonality.aggression;
      npc.personality.collector = npc.customPersonality.collector;
      npc.personality.cautious = npc.customPersonality.cautious;
      
      npc.personality.erratic = npc.difficulty === 'unfair' ? 0.05 :
                               npc.difficulty === 'hard' ? 0.2 + Math.random() * 0.1 :
                               npc.difficulty === 'medium' ? 0.3 + Math.random() * 0.2 :
                               0.5 + Math.random() * 0.3;
      
      npc.personality.adaptability = npc.difficulty === 'unfair' ? 0.1 :
                                    npc.difficulty === 'hard' ? 0.1 + Math.random() * 0.1 :
                                    npc.difficulty === 'medium' ? 0.2 + Math.random() * 0.1 :
                                    0.3 + Math.random() * 0.2;
    } else {
      npc.personality.aggression = npc.difficulty === 'unfair' ? 1.0 :
                                  npc.difficulty === 'hard' ? 0.7 + Math.random() * 0.2 :
                                  npc.difficulty === 'medium' ? 0.4 + Math.random() * 0.3 :
                                  0.2 + Math.random() * 0.2;
      
      npc.personality.collector = npc.difficulty === 'unfair' ? 1.0 :
                                 npc.difficulty === 'hard' ? 0.6 + Math.random() * 0.3 :
                                 npc.difficulty === 'medium' ? 0.4 + Math.random() * 0.3 :
                                 0.2 + Math.random() * 0.3;
                  
      npc.personality.cautious = npc.difficulty === 'unfair' ? 1.0 :
                                npc.difficulty === 'hard' ? 0.8 + Math.random() * 0.2 :
                                npc.difficulty === 'medium' ? 0.5 + Math.random() * 0.3 :
                                0.3 + Math.random() * 0.3;
                  
      npc.personality.erratic = npc.difficulty === 'unfair' ? 0.05 :
                               npc.difficulty === 'hard' ? 0.2 + Math.random() * 0.1 :
                               npc.difficulty === 'medium' ? 0.3 + Math.random() * 0.2 :
                               0.5 + Math.random() * 0.3;
                  
      npc.personality.adaptability = npc.difficulty === 'unfair' ? 0.1 :
                                    npc.difficulty === 'hard' ? 0.1 + Math.random() * 0.1 :
                                    npc.difficulty === 'medium' ? 0.2 + Math.random() * 0.1 :
                                    0.3 + Math.random() * 0.2;
    }
    
    if (npc.difficulty === 'unfair') {
      npc.decisionInterval = 50 + Math.random() * 20;
    } else {
      npc.decisionInterval = 100 + 
        (npc.difficulty === 'easy' ? 150 : 
         npc.difficulty === 'medium' ? 100 : 70) + 
        Math.random() * 50;
    }
    
    npc.lastDecisionTime = Date.now();
    npc.currentStrategy = 'collect';
    npc.strategyChangeTime = Date.now() + (5000 + Math.random() * 10000) / npc.personality.adaptability;
  }
  
  if (Date.now() - npc.lastDecisionTime < npc.decisionInterval) return;
  npc.lastDecisionTime = Date.now();
  
  if (npc.difficulty === 'unfair') {
    npc.decisionInterval = 50 + Math.random() * 20;
  } else {
    npc.decisionInterval = 100 + 
      (npc.difficulty === 'easy' ? 150 : 
       npc.difficulty === 'medium' ? 100 : 70) + 
      Math.random() * 50;
  }
  
  if (npc.velX === undefined || npc.velY === undefined) {
    npc.velX = 0;
    npc.velY = 0;
  }
  
  if (Date.now() > npc.strategyChangeTime) {
    const strategies = ['collect', 'avoid', 'chase', 'wander'];
    const newStrategies = strategies.filter(s => s !== npc.currentStrategy);
    npc.currentStrategy = newStrategies[Math.floor(Math.random() * newStrategies.length)];
    npc.strategyChangeTime = Date.now() + (5000 + Math.random() * 10000) / npc.personality.adaptability;
  }
  
  let moveX = 0;
  let moveY = 0;
  
  const dodgeThreshold = 120;
  gameState.bullets.forEach(bullet => {
    let dx = npc.x - bullet.x;
    let dy = npc.y - bullet.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < dodgeThreshold && dist > 0) {
      let factor = 1 - (dist / dodgeThreshold);
      
      moveX += (dx / dist) * factor;
      moveY += (dy / dist) * factor;
    }
  });
  
  moveX *= npc.personality.cautious;
  moveY *= npc.personality.cautious;
  
  if (npc.currentStrategy === 'collect' || Math.random() < npc.personality.collector) {
    let closest = null;
    let minDist = Infinity;
    
    gameState.collectibles.forEach(col => {
      let dx = col.x - npc.x;
      let dy = col.y - npc.y;
      let d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist) {
        minDist = d;
        closest = col;
      }
    });
    
    if (closest) {
      let dx = closest.x - npc.x;
      let dy = closest.y - npc.y;
      let d = Math.sqrt(dx * dx + dy * dy);
      
      if (d > 0) {
        dx /= d;
        dy /= d;
        
        let weightCollect = npc.personality.collector;
        
        gameState.bullets.forEach(bullet => {
          let bx = bullet.x - closest.x;
          let by = bullet.y - closest.y;
          let bd = Math.sqrt(bx * bx + by * by);
          if (bd < 100) weightCollect *= (1 - npc.personality.cautious * 0.5);
        });
        
        moveX += dx * weightCollect;
        moveY += dy * weightCollect;
      }
    }
  }
  
  if (npc.currentStrategy === 'chase' && npc.personality.aggression > 0.3) {
    let target = null;
    let closestDist = Infinity;
    
    Object.values(gameState.players).forEach(player => {
      if (player.id !== npc.id && player.alive) {
        let dx = player.x - npc.x;
        let dy = player.y - npc.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < closestDist) {
          closestDist = dist;
          target = player;
        }
      }
    });
    
    if (target) {
      let dx = target.x - npc.x;
      let dy = target.y - npc.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        moveX += (dx / dist) * npc.personality.aggression;
        moveY += (dy / dist) * npc.personality.aggression;
      }
    }
  }
  
  if (npc.currentStrategy === 'wander' || Math.random() < npc.personality.erratic) {
    let randomAngle = Math.random() * 2 * Math.PI;
    let randomStrength = npc.difficulty === 'easy' ? 0.5 : 
                         npc.difficulty === 'medium' ? 0.3 : 
                         npc.difficulty === 'hard' ? 0.2 : 0.1;
    
    moveX += Math.cos(randomAngle) * randomStrength;
    moveY += Math.sin(randomAngle) * randomStrength;
  }
  
  if (Math.abs(moveX) < 0.1 && Math.abs(moveY) < 0.1) {
    let randomAngle = Math.random() * 2 * Math.PI;
    moveX += Math.cos(randomAngle) * 0.5;
    moveY += Math.sin(randomAngle) * 0.5;
  }
  
  if (npc.difficulty !== 'unfair') {
    let mistakeChance = npc.difficulty === 'easy' ? 0.3 : 
                        npc.difficulty === 'medium' ? 0.15 : 0.05;
    
    if (Math.random() < mistakeChance) {
      if (Math.random() < 0.7) {
        let randomAngle = Math.random() * 2 * Math.PI;
        moveX = Math.cos(randomAngle) * 0.5;
        moveY = Math.sin(randomAngle) * 0.5;
      } else {
        moveX = 0;
        moveY = 0;
      }
    }
  }
  
  let desiredX = moveX;
  let desiredY = moveY;
  let desiredMag = Math.sqrt(desiredX * desiredX + desiredY * desiredY);
  
  if (desiredMag > 1) {
    desiredX /= desiredMag;
    desiredY /= desiredMag;
  }
  
  let alpha = 0.3;
  npc.velX = npc.velX + (desiredX - npc.velX) * alpha;
  npc.velY = npc.velY + (desiredY - npc.velY) * alpha;
  
  const threshold = 0.1;
  npc.inputs = { 'ArrowUp': 'up', 'ArrowDown': 'up', 'ArrowLeft': 'up', 'ArrowRight': 'up' };
  
  if (npc.velX > threshold) {
    npc.inputs['ArrowRight'] = 'down';
  } else if (npc.velX < -threshold) {
    npc.inputs['ArrowLeft'] = 'down';
  }
  
  if (npc.velY > threshold) {
    npc.inputs['ArrowDown'] = 'down';
  } else if (npc.velY < -threshold) {
    npc.inputs['ArrowUp'] = 'down';
  }
}

module.exports = { updateNPC };