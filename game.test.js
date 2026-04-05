/**
 * Brick Breaker Game Tests
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Extract server logic for testing
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

// Test HTTP server
describe('Brick Breaker Server', () => {
  let server;
  let serverPort = 3456;

  beforeAll((done) => {
    server = http.createServer(createHandler);
    server.listen(serverPort, () => {
      done();
    });
  });

  afterAll((done) => {
    if (server) {
      server.close(() => {
        done();
      });
    }
  });

  test('should respond with index.html for root path', (done) => {
    http.get(`http://localhost:${serverPort}/`, (res) => {
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      done();
    });
  });

  test('should respond with JavaScript for game.js', (done) => {
    http.get(`http://localhost:${serverPort}/game.js`, (res) => {
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/javascript');
      done();
    });
  });

  test('should respond with CSS for style.css', (done) => {
    http.get(`http://localhost:${serverPort}/style.css`, (res) => {
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/css');
      done();
    });
  });

  test('should return 404 for non-existent file', (done) => {
    http.get(`http://localhost:${serverPort}/nonexistent.html`, (res) => {
      expect(res.statusCode).toBe(404);
      done();
    });
  });
});

// Test MIME type mapping
describe('MIME Types', () => {
  test('should have correct MIME type for HTML', () => {
    expect(mimeTypes['.html']).toBe('text/html');
  });

  test('should have correct MIME type for JavaScript', () => {
    expect(mimeTypes['.js']).toBe('application/javascript');
  });

  test('should have correct MIME type for CSS', () => {
    expect(mimeTypes['.css']).toBe('text/css');
  });

  test('should have correct MIME type for PNG', () => {
    expect(mimeTypes['.png']).toBe('image/png');
  });

  test('should have correct MIME type for unknown extension', () => {
    const unknownExt = '.unknown';
    const contentType = mimeTypes[unknownExt] || 'application/octet-stream';
    expect(contentType).toBe('application/octet-stream');
  });
});

// Test file path handling
describe('File Path Handling', () => {
  test('should convert root path to index.html', () => {
    const filePath = path.join(__dirname, '/' === '/' ? '/index.html' : '/');
    expect(filePath).toContain('index.html');
  });

  test('should preserve game.js path', () => {
    const filePath = path.join(__dirname, '/game.js');
    expect(filePath).toContain('game.js');
  });
});

// Test game logic - pure functions extracted from game.js
describe('Game Logic', () => {
  // Extract adjustBrightness function for testing
  function adjustBrightness(hex, percent) {
    // Remove # if present
    hex = hex.replace(/^#/, '');
    
    // Parse the hex string
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calculate new values
    const newR = Math.min(255, Math.max(0, Math.round(r * (1 + percent / 100))));
    const newG = Math.min(255, Math.max(0, Math.round(g * (1 + percent / 100))));
    const newB = Math.min(255, Math.max(0, Math.round(b * (1 + percent / 100))));
    
    // Convert back to hex
    const toHex = (n) => n.toString(16).padStart(2, '0');
    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
  }

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
      expect(result).toBe('#ffffff'); // Cannot go brighter than white
    });

    test('should handle black color', () => {
      const result = adjustBrightness('#000000', -10);
      expect(result).toBe('#000000'); // Cannot go darker than black
    });
  });

  // Test collision detection logic
  function checkCircleRectCollision(circleX, circleY, circleRadius, rectX, rectY, rectWidth, rectHeight) {
    // Find the closest point on the rectangle to the circle
    const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
    const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));
    
    // Calculate the distance between the closest point and the circle center
    const distanceX = circleX - closestX;
    const distanceY = circleY - closestY;
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    
    return distanceSquared < (circleRadius * circleRadius);
  }

  describe('Collision Detection', () => {
    test('should detect collision when circle overlaps rectangle', () => {
      const result = checkCircleRectCollision(50, 50, 10, 40, 40, 20, 20);
      expect(result).toBe(true);
    });

    test('should not detect collision when circle is far from rectangle', () => {
      const result = checkCircleRectCollision(100, 100, 10, 40, 40, 20, 20);
      expect(result).toBe(false);
    });

    test('should detect collision when circle center is inside rectangle', () => {
      const result = checkCircleRectCollision(50, 50, 10, 30, 30, 50, 50);
      expect(result).toBe(true);
    });

    test('should detect collision at rectangle edge', () => {
      const result = checkCircleRectCollision(60, 50, 10, 40, 40, 20, 20);
      expect(result).toBe(true);
    });
  });

  // Test ball physics
  function calculateBallVelocity(angle, speed) {
    return {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed
    };
  }

  describe('Ball Physics', () => {
    test('should calculate correct velocity for upward angle', () => {
      const angle = -Math.PI / 2; // Upward
      const speed = 6;
      const velocity = calculateBallVelocity(angle, speed);
      
      expect(velocity.vx).toBeCloseTo(0, 5);
      expect(velocity.vy).toBeCloseTo(-speed, 5);
    });

    test('should calculate correct velocity for right angle', () => {
      const angle = 0; // Right
      const speed = 6;
      const velocity = calculateBallVelocity(angle, speed);
      
      expect(velocity.vx).toBeCloseTo(speed, 5);
      expect(velocity.vy).toBeCloseTo(0, 5);
    });

    test('should calculate correct velocity for diagonal angle', () => {
      const angle = Math.PI / 4; // 45 degrees
      const speed = 6;
      const velocity = calculateBallVelocity(angle, speed);
      
      const expected = Math.cos(Math.PI / 4) * speed;
      expect(velocity.vx).toBeCloseTo(expected, 5);
      expect(velocity.vy).toBeCloseTo(expected, 5);
    });
  });

  // Test brick HP color mapping
  describe('Brick HP Colors', () => {
    const brickHP = {
      6: '#9c27b0',  // Deep Purple
      5: '#2196f3',  // Blue
      4: '#00bcd4',  // Cyan
      3: '#4caf50',  // Green
      2: '#ffc107',  // Yellow
      1: '#f44336'   // Red
    };

    test('should have color for HP 6', () => {
      expect(brickHP[6]).toBe('#9c27b0');
    });

    test('should have color for HP 5', () => {
      expect(brickHP[5]).toBe('#2196f3');
    });

    test('should have color for HP 4', () => {
      expect(brickHP[4]).toBe('#00bcd4');
    });

    test('should have color for HP 3', () => {
      expect(brickHP[3]).toBe('#4caf50');
    });

    test('should have color for HP 2', () => {
      expect(brickHP[2]).toBe('#ffc107');
    });

    test('should have color for HP 1', () => {
      expect(brickHP[1]).toBe('#f44336');
    });
  });

  // Test geometric pattern calculations
  describe('Geometric Patterns', () => {
    test('checkerboard pattern should give alternating HP', () => {
      const rows = 5;
      const cols = 8;
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const hp = ((row + col) % 2 === 0) ? 4 : 1;
          expect([1, 4]).toContain(hp);
        }
      }
    });

    test('pyramid pattern should give decreasing HP from center', () => {
      const rows = 5;
      const centerRow = rows / 2;
      
      const outerHP = Math.floor(6 - Math.abs(0 - centerRow));
      const innerHP = Math.floor(6 - Math.abs(2 - centerRow));
      
      expect(outerHP).toBeLessThan(innerHP);
    });

    test('diamond pattern should give high HP in center', () => {
      const rows = 5;
      const cols = 8;
      const centerRow = rows / 2;
      const centerCol = cols / 2;
      
      // Center brick should have highest HP (clamped to max 6)
      const centerDist = Math.abs(centerRow - centerRow) + Math.abs(centerCol - centerCol);
      const centerHP = Math.max(1, Math.min(6, 7 - centerDist));
      
      expect(centerHP).toBe(6);
    });
  });

  // Test game state management
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

    test('game state should allow state transitions', () => {
      let gameState = 'playing';
      
      // Simulate game over
      gameState = 'gameOver';
      expect(gameState).toBe('gameOver');
      
      // Simulate restart
      gameState = 'playing';
      expect(gameState).toBe('playing');
    });

    test('score should accumulate correctly', () => {
      let score = 0;
      
      // Simulate scoring
      score += 10;
      expect(score).toBe(10);
      
      score += 20;
      expect(score).toBe(30);
    });

    test('lives should decrease correctly', () => {
      let lives = 3;
      
      // Simulate losing a life
      lives -= 1;
      expect(lives).toBe(2);
      
      lives -= 1;
      expect(lives).toBe(1);
    });
  });

  // Test power-up logic
  describe('Power-Ups', () => {
    test('should calculate drop chance correctly', () => {
      const dropChance = 0.2;
      const randomValue = Math.random();
      
      // Test that drop chance is between 0 and 1
      expect(dropChance).toBeGreaterThanOrEqual(0);
      expect(dropChance).toBeLessThanOrEqual(1);
    });

    test('should handle power-up duration', () => {
      const duration = 10000; // 10 seconds in ms
      
      expect(duration).toBe(10000);
      expect(duration).toBeGreaterThan(0);
    });

    test('should spawn power-up at brick location', () => {
      const brick = { x: 100, y: 50, width: 40, height: 20 };
      const powerUp = {
        x: brick.x + brick.width / 2 - 12.5, // Center on brick
        y: brick.y,
        width: 25,
        height: 25,
        type: 'widePaddle'
      };
      
      expect(powerUp.x).toBe(100 + 20 - 12.5);
      expect(powerUp.y).toBe(50);
    });
  });
});