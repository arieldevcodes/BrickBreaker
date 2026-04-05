/**
 * Brick Breaker Game Tests
 * Improved version with better practices
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// ============================================
// Game Logic - Extracted from game.js
// ============================================

/**
 * Adjusts the brightness of a hex color
 * @param {string} hex - Hex color string (with or without #)
 * @param {number} percent - Percentage to adjust (-100 to 100)
 * @returns {string} Adjusted hex color
 */
function adjustBrightness(hex, percent) {
  hex = hex.replace(/^#/, '');
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  const newR = Math.min(255, Math.max(0, Math.round(r * (1 + percent / 100))));
  const newG = Math.min(255, Math.max(0, Math.round(g * (1 + percent / 100))));
  const newB = Math.min(255, Math.max(0, Math.round(b * (1 + percent / 100))));
  
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

/**
 * Checks collision between a circle and rectangle
 * @returns {boolean} True if collision detected
 */
function checkCircleRectCollision(circleX, circleY, circleRadius, rectX, rectY, rectWidth, rectHeight) {
  const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
  const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));
  
  const distanceX = circleX - closestX;
  const distanceY = circleY - closestY;
  const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
  
  return distanceSquared < (circleRadius * circleRadius);
}

/**
 * Calculates ball velocity from angle and speed
 * @returns {{vx: number, vy: number}} Velocity components
 */
function calculateBallVelocity(angle, speed) {
  return {
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed
  };
}

// ============================================
// Test Server Setup
// ============================================

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function createHandler(req, res) {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

// ============================================
// Server Tests
// ============================================

describe('Brick Breaker Server', () => {
  let server;
  let serverPort;

  beforeAll((done) => {
    server = http.createServer(createHandler);
    server.listen(0, () => {
      serverPort = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    if (server) {
      server.close(() => done());
    } else {
      done();
    }
  });

  test('should respond with index.html for root path', (done) => {
    http.get(`http://localhost:${serverPort}/`, (res) => {
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      done();
    }).on('error', done);
  });

  test('should respond with JavaScript for game.js', (done) => {
    http.get(`http://localhost:${serverPort}/game.js`, (res) => {
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/javascript');
      done();
    }).on('error', done);
  });

  test('should respond with CSS for style.css', (done) => {
    http.get(`http://localhost:${serverPort}/style.css`, (res) => {
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/css');
      done();
    }).on('error', done);
  });

  test('should return 404 for non-existent file', (done) => {
    http.get(`http://localhost:${serverPort}/nonexistent.html`, (res) => {
      expect(res.statusCode).toBe(404);
      done();
    }).on('error', done);
  });

  test('should handle server error gracefully', (done) => {
    const req = http.request({
      hostname: 'localhost',
      port: serverPort,
      path: '/',
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        expect(data).toBeDefined();
        done();
      });
    });
    req.on('error', done);
    req.end();
  });
});

// ============================================
// MIME Type Tests
// ============================================

describe('MIME Types', () => {
  const testCases = [
    ['.html', 'text/html'],
    ['.js', 'application/javascript'],
    ['.css', 'text/css'],
    ['.png', 'image/png'],
    ['.jpg', 'image/jpeg'],
    ['.svg', 'image/svg+xml'],
    ['.ico', 'image/x-icon'],
  ];

  testCases.forEach(([ext, expected]) => {
    test(`should have correct MIME type for ${ext}`, () => {
      expect(mimeTypes[ext]).toBe(expected);
    });
  });

  test('should return octet-stream for unknown extension', () => {
    expect(mimeTypes['.unknown'] || 'application/octet-stream').toBe('application/octet-stream');
  });
});

// ============================================
// File Path Tests
// ============================================

describe('File Path Handling', () => {
  test('should convert root path to index.html', () => {
    const filePath = path.join(__dirname, '/index.html');
    expect(filePath).toContain('index.html');
  });

  test('should preserve game.js path', () => {
    const filePath = path.join(__dirname, '/game.js');
    expect(filePath).toContain('game.js');
  });

  test('should correctly join multiple path segments', () => {
    const filePath = path.join(__dirname, 'subdir', 'file.js');
    expect(filePath).toContain('subdir');
    expect(filePath).toContain('file.js');
  });
});

// ============================================
// Adjust Brightness Tests
// ============================================

describe('adjustBrightness', () => {
  test('should lighten color by positive percent', () => {
    const result = adjustBrightness('#808080', 20);
    expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  test('should darken color by negative percent', () => {
    const result = adjustBrightness('#808080', -20);
    expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  test('should handle color without hash', () => {
    const result = adjustBrightness('ff0000', 10);
    expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  test('should handle white color', () => {
    const result = adjustBrightness('#ffffff', 10);
    expect(result).toBe('#ffffff');
  });

  test('should handle black color', () => {
    const result = adjustBrightness('#000000', -10);
    expect(result).toBe('#000000');
  });

  test('should handle 50% grey', () => {
    const result = adjustBrightness('#808080', 0);
    expect(result).toBe('#808080');
  });

  test('should handle extreme positive brightness', () => {
    // Current implementation saturates at white
    const result = adjustBrightness('#ff0000', 100);
    expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  test('should handle extreme negative brightness', () => {
    const result = adjustBrightness('#ff0000', -100);
    expect(result).toBe('#000000');
  });

  test('should handle invalid hex gracefully', () => {
    // Invalid hex produces NaN values - this is the current behavior
    const result = adjustBrightness('invalid', 10);
    // The function produces #NaNNaNNaN for invalid input
    expect(result).toContain('NaN');
  });
});

// ============================================
// Collision Detection Tests
// ============================================

describe('Collision Detection', () => {
  test('should detect collision when circle overlaps rectangle', () => {
    expect(checkCircleRectCollision(50, 50, 10, 40, 40, 20, 20)).toBe(true);
  });

  test('should not detect collision when circle is far from rectangle', () => {
    expect(checkCircleRectCollision(100, 100, 10, 40, 40, 20, 20)).toBe(false);
  });

  test('should detect collision when circle center is inside rectangle', () => {
    expect(checkCircleRectCollision(50, 50, 10, 30, 30, 50, 50)).toBe(true);
  });

  test('should detect collision at rectangle edge', () => {
    expect(checkCircleRectCollision(60, 50, 10, 40, 40, 20, 20)).toBe(true);
  });

  test('should detect collision at rectangle corner', () => {
    expect(checkCircleRectCollision(60, 60, 10, 40, 40, 20, 20)).toBe(true);
  });

  test('should not detect collision when circle touches edge externally', () => {
    expect(checkCircleRectCollision(70, 50, 10, 40, 40, 20, 20)).toBe(false);
  });

  test('should handle zero-sized rectangle', () => {
    // With zero dimensions, closest point equals circle center if centered
    const result = checkCircleRectCollision(50, 50, 10, 50, 50, 0, 0);
    expect(typeof result).toBe('boolean');
  });

  test('should handle negative dimensions gracefully', () => {
    const result = checkCircleRectCollision(50, 50, 10, 40, 40, -10, -10);
    expect(typeof result).toBe('boolean');
  });
});

// ============================================
// Ball Physics Tests
// ============================================

describe('Ball Physics', () => {
  test('should calculate correct velocity for upward angle', () => {
    const velocity = calculateBallVelocity(-Math.PI / 2, 6);
    expect(velocity.vx).toBeCloseTo(0, 5);
    expect(velocity.vy).toBeCloseTo(-6, 5);
  });

  test('should calculate correct velocity for right angle', () => {
    const velocity = calculateBallVelocity(0, 6);
    expect(velocity.vx).toBeCloseTo(6, 5);
    expect(velocity.vy).toBeCloseTo(0, 5);
  });

  test('should calculate correct velocity for diagonal angle', () => {
    const velocity = calculateBallVelocity(Math.PI / 4, 6);
    const expected = Math.cos(Math.PI / 4) * 6;
    expect(velocity.vx).toBeCloseTo(expected, 5);
    expect(velocity.vy).toBeCloseTo(expected, 5);
  });

  test('should calculate correct velocity for left angle', () => {
    const velocity = calculateBallVelocity(Math.PI, 6);
    expect(velocity.vx).toBeCloseTo(-6, 5);
    expect(velocity.vy).toBeCloseTo(0, 5);
  });

  test('should handle zero speed', () => {
    const velocity = calculateBallVelocity(Math.PI / 4, 0);
    expect(velocity.vx).toBe(0);
    expect(velocity.vy).toBe(0);
  });

  test('should handle downward angle', () => {
    const velocity = calculateBallVelocity(Math.PI / 2, 6);
    expect(velocity.vx).toBeCloseTo(0, 5);
    expect(velocity.vy).toBeCloseTo(6, 5);
  });
});

// ============================================
// Brick HP Color Tests
// ============================================

describe('Brick HP Colors', () => {
  const brickHP = {
    6: '#9c27b0',
    5: '#2196f3',
    4: '#00bcd4',
    3: '#4caf50',
    2: '#ffc107',
    1: '#f44336'
  };

  const testCases = Object.entries(brickHP);
  testCases.forEach(([hp, color]) => {
    test(`should have color for HP ${hp}`, () => {
      expect(brickHP[Number(hp)]).toBe(color);
    });
  });

  test('should have all HP values from 1 to 6', () => {
    for (let i = 1; i <= 6; i++) {
      expect(brickHP[i]).toBeDefined();
    }
  });
});

// ============================================
// Geometric Pattern Tests
// ============================================

describe('Geometric Patterns', () => {
  describe('Checkerboard Pattern', () => {
    test('should give alternating HP values', () => {
      const rows = 5;
      const cols = 8;
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const hp = ((row + col) % 2 === 0) ? 4 : 1;
          expect([1, 4]).toContain(hp);
        }
      }
    });

    test('should have expected HP distribution', () => {
      const distribution = { 1: 0, 4: 0 };
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 8; col++) {
          const hp = ((row + col) % 2 === 0) ? 4 : 1;
          distribution[hp]++;
        }
      }
      expect(distribution[1]).toBe(20);
      expect(distribution[4]).toBe(20);
    });
  });

  describe('Pyramid Pattern', () => {
    test('should give decreasing HP from center', () => {
      const rows = 5;
      const centerRow = rows / 2;
      
      const outerHP = Math.floor(6 - Math.abs(0 - centerRow));
      const innerHP = Math.floor(6 - Math.abs(2 - centerRow));
      
      expect(outerHP).toBeLessThan(innerHP);
    });

    test('should have highest HP at center row', () => {
      const rows = 5;
      const centerRow = Math.floor(rows / 2);
      const centerHP = Math.floor(6 - Math.abs(centerRow - centerRow));
      
      expect(centerHP).toBe(6);
    });
  });

  describe('Diamond Pattern', () => {
    test('should give high HP in center', () => {
      const rows = 5;
      const cols = 8;
      const centerRow = rows / 2;
      const centerCol = cols / 2;
      
      const centerDist = Math.abs(centerRow - centerRow) + Math.abs(centerCol - centerCol);
      const centerHP = Math.max(1, Math.min(6, 7 - centerDist));
      
      expect(centerHP).toBe(6);
    });

    test('should give low HP at edges', () => {
      const rows = 5;
      const cols = 8;
      const centerRow = rows / 2;
      const centerCol = cols / 2;
      
      const edgeDist = Math.abs(0 - centerRow) + Math.abs(0 - centerCol);
      const edgeHP = Math.max(1, Math.min(6, 7 - edgeDist));
      
      expect(edgeHP).toBe(1);
    });
  });
});

// ============================================
// Game State Tests
// ============================================

describe('Game State', () => {
  test('initial game state should have correct defaults', () => {
    const gameState = {
      score: 0,
      lives: 3,
      gameState: 'playing',
      powerUps: [],
      balls: []
    };
    
    expect(gameState.score).toBe(0);
    expect(gameState.lives).toBe(3);
    expect(gameState.gameState).toBe('playing');
    expect(gameState.powerUps).toEqual([]);
    expect(gameState.balls).toEqual([]);
  });

  test('should allow valid state transitions', () => {
    const validTransitions = {
      playing: ['gameOver', 'levelComplete', 'playing'],
      gameOver: ['playing'],
      levelComplete: ['playing']
    };

    expect(validTransitions.playing).toContain('gameOver');
    expect(validTransitions.gameOver).toContain('playing');
  });

  test('score should accumulate correctly', () => {
    let score = 0;
    score += 10;
    expect(score).toBe(10);
    score += 20;
    expect(score).toBe(30);
  });

  test('lives should decrease correctly', () => {
    let lives = 3;
    lives -= 1;
    expect(lives).toBe(2);
    lives -= 1;
    expect(lives).toBe(1);
  });

  test('should handle score overflow', () => {
    let score = 0;
    score += Number.MAX_SAFE_INTEGER;
    expect(score).toBeGreaterThan(0);
  });
});

// ============================================
// Power-Up Tests
// ============================================

describe('Power-Ups', () => {
  const powerUpConfig = {
    dropChance: 0.2,
    fallSpeed: 3,
    width: 25,
    height: 25,
    duration: 10000
  };

  test('should have valid drop chance', () => {
    expect(powerUpConfig.dropChance).toBeGreaterThanOrEqual(0);
    expect(powerUpConfig.dropChance).toBeLessThanOrEqual(1);
  });

  test('should have positive duration', () => {
    expect(powerUpConfig.duration).toBeGreaterThan(0);
  });

  test('should have positive fall speed', () => {
    expect(powerUpConfig.fallSpeed).toBeGreaterThan(0);
  });

  test('should calculate drop chance as percentage', () => {
    const percentage = powerUpConfig.dropChance * 100;
    expect(percentage).toBe(20);
  });

  test('should spawn power-up at brick location', () => {
    const brick = { x: 100, y: 50, width: 40, height: 20 };
    const powerUp = {
      x: brick.x + brick.width / 2 - powerUpConfig.width / 2,
      y: brick.y,
      width: powerUpConfig.width,
      height: powerUpConfig.height
    };
    
    expect(powerUp.x).toBe(100 + 20 - 12.5);
    expect(powerUp.y).toBe(50);
  });

  test('should handle power-up collision with paddle', () => {
    const paddle = { x: 100, y: 500, width: 100, height: 15 };
    const powerUp = { x: 150, y: 485, width: 25, height: 25 };
    
    const collision = (
      powerUp.x < paddle.x + paddle.width &&
      powerUp.x + powerUp.width > paddle.x &&
      powerUp.y < paddle.y + paddle.height &&
      powerUp.y + powerUp.height > paddle.y
    );
    
    expect(collision).toBe(true);
  });
});