/**
 * Brick Smasher Game
 * Modular structure for easy extension
 */

(function() {
    'use strict';

    // ============================================
    // Game Configuration
    // ============================================
    const GameConfig = {
        // Canvas settings
        baseWidth: 400,
        baseHeight: 600,
        scaleFactor: 1,

        // Paddle settings
        paddle: {
            widthRatio: 0.25,
            height: 15,
            color: '#e94560',
            yOffset: 50
        },

        // Ball settings
        ball: {
            radius: 12,
            speed: 6,
            speedIncrease: 0,
            initialAngle: -Math.PI / 2 // Start moving upward
        },

        // Brick settings
        bricks: {
            rowCount: 5,
            columnCount: 8,
            width: 0,      // Calculated based on canvas width
            height: 20,
            padding: 10,
            offsetTop: 60,
            offsetLeft: 0  // Calculated to center bricks
        },

        // Power-up settings
        powerUps: {
            dropChance: 0.2,        // 20% chance
            fallSpeed: 3,
            width: 25,
            height: 25,
            duration: 10000          // 10 seconds in ms
        },

        // Colors
        colors: {
            background: '#0f0f23',
            paddle: '#e94560',
            paddleHighlight: '#ff6b6b',
            ball: '#00d9ff',
            ballGlow: '#00ffff',
            brick: '#ff6b6b',
            brickHighlight: '#ff8888',
            text: '#ffffff',
            textHighlight: '#00d9ff',
            brickHP: {
                6: '#9c27b0',  // Deep Purple - 6 HP (center of formations)
                5: '#2196f3',  // Blue - 5 HP
                4: '#00bcd4',  // Cyan - 4 HP
                3: '#4caf50',  // Green - 3 HP
                2: '#ffc107',  // Yellow - 2 HP
                1: '#f44336'   // Red - 1 HP
            },
            powerUpWidePaddle: '#e040fb',  // Neon Purple
            powerUpMultiBall: '#ff6d00'     // Neon Orange
        }
    };

    // ============================================
    // Game State
    // ============================================
    const GameState = {
        canvas: null,
        ctx: null,
        width: 0,
        height: 0,
        paddle: {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            targetX: null
        },
        ball: {
            x: 0,
            y: 0,
            radius: 0,
            vx: 0,
            vy: 0,
            speed: 0,
            isActive: false,
            resetDelay: 0
        },
        bricks: [],  // 2D array of brick objects
        powerUps: [],  // Array of falling power-ups
        balls: [],  // Array of balls (for multi-ball)
        score: 0,
        lives: 3,
        currentLevelIndex: 0,  // Current level in GameLevels array
        gameState: 'playing',  // 'playing', 'gameOver', 'levelComplete', 'levelTransition'
        paddleBaseWidth: 0,  // Store base paddle width
        widePaddleTimerId: null,  // Timer ID for wide paddle power-up
        isRunning: false
    };

    // ============================================
    // Initialization
    // ============================================
    function init() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }

        GameState.canvas = canvas;
        GameState.ctx = canvas.getContext('2d');

        setupCanvas();
        console.log('Canvas size:', GameState.width, 'x', GameState.height);
        
        // Reset game state
        GameState.score = 0;
        GameState.lives = 3;
        GameState.gameState = 'playing';
        GameState.powerUps = [];
        GameState.balls = [];
        GameState.paddleBaseWidth = 0;
        if (GameState.widePaddleTimerId) {
            clearTimeout(GameState.widePaddleTimerId);
            GameState.widePaddleTimerId = null;
        }
        
        initPaddle();
        initBalls();
        initBricks();
        setupEventListeners();
        
        // Add tap/click listener for game restart
        GameState.canvas.addEventListener('click', handleGameTap);
        GameState.canvas.addEventListener('touchstart', handleGameTap);
        
        GameState.isRunning = true;
        gameLoop();
    }
    
    function handleGameTap(e) {
        e.preventDefault();
        
        if (GameState.gameState === 'gameOver' || GameState.gameState === 'levelComplete') {
            // Comprehensive reset - restart from level 1
            GameState.score = 0;
            GameState.lives = 3;
            GameState.currentLevelIndex = 0;
            GameState.gameState = 'playing';
            
            // Clear power-ups and timers
            GameState.powerUps = [];
            if (GameState.widePaddleTimerId) {
                clearTimeout(GameState.widePaddleTimerId);
                GameState.widePaddleTimerId = null;
            }
            
            // Rebuild paddle, ball, and bricks
            initPaddle();
            initBalls();
            initBricks();
        } else if (GameState.gameState === 'levelTransition') {
            // Load the next level
            loadNextLevel();
        }
    }

    function setupCanvas() {
        const container = document.getElementById('game-container');
        const containerWidth = container.clientWidth || 400;
        const containerHeight = container.clientHeight || 600;

        // Calculate scale to fit mobile screen while maintaining aspect ratio
        const scaleX = containerWidth / GameConfig.baseWidth;
        const scaleY = containerHeight / GameConfig.baseHeight;
        
        // Always scale to fill the container
        const scale = Math.min(scaleX, scaleY, 1.5);

        GameConfig.scaleFactor = scale;

        // Set canvas size
        GameState.width = Math.floor(GameConfig.baseWidth * scale);
        GameState.height = Math.floor(GameConfig.baseHeight * scale);

        GameState.canvas.width = GameState.width;
        GameState.canvas.height = GameState.height;
        
        // Set explicit canvas style dimensions to match
        GameState.canvas.style.width = GameState.width + 'px';
        GameState.canvas.style.height = GameState.height + 'px';
    }

    function initPaddle() {
        const paddleWidth = GameState.width * GameConfig.paddle.widthRatio;
        const paddleHeight = GameConfig.paddle.height * GameConfig.scaleFactor;

        GameState.paddle = {
            width: paddleWidth,
            height: paddleHeight,
            x: (GameState.width - paddleWidth) / 2,
            y: GameState.height - (GameConfig.paddle.yOffset * GameConfig.scaleFactor),
            targetX: null
        };
        
        // Store base width for power-ups
        GameState.paddleBaseWidth = paddleWidth;
    }

    function initBalls() {
        const radius = GameConfig.ball.radius * GameConfig.scaleFactor;
        const speed = GameConfig.ball.speed * GameConfig.scaleFactor;
        const angle = GameConfig.ball.initialAngle;

        // Create the main ball
        const mainBall = {
            x: GameState.width / 2,
            y: GameState.height / 2,
            radius: radius,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            speed: speed,
            isActive: true,
            resetDelay: 0
        };
        
        GameState.balls = [mainBall];
        GameState.ball = mainBall;  // Keep reference for backward compatibility
    }

    function initBricks() {
        const config = GameConfig.bricks;
        const rows = config.rowCount;
        const cols = config.columnCount;
        
        // Get current level data
        const levelData = GameLevels[GameState.currentLevelIndex];
        
        // Calculate brick width to fit canvas with padding
        const totalPadding = (cols + 1) * config.padding;
        const brickWidth = (GameState.width - totalPadding) / cols;
        config.width = brickWidth;
        
        // Calculate offsetLeft to center the bricks
        config.offsetLeft = config.padding;
        
        // Create 2D array of bricks from level data
        GameState.bricks = [];
        for (let row = 0; row < rows; row++) {
            GameState.bricks[row] = [];
            for (let col = 0; col < cols; col++) {
                const hp = levelData[row][col];
                
                // 0 means empty space - don't create a brick
                if (hp === 0) {
                    GameState.bricks[row][col] = null;
                    continue;
                }
                
                const brickX = config.offsetLeft + col * (brickWidth + config.padding);
                const brickY = config.offsetTop + row * (config.height + config.padding);
                
                GameState.bricks[row][col] = {
                    x: brickX,
                    y: brickY,
                    width: brickWidth,
                    height: config.height,
                    status: 1,  // 1 = active, 0 = broken
                    hp: hp      // Hit points (1-6)
                };
            }
        }
    }

    function resetBall() {
        if (GameState.balls.length === 0) return;
        
        const ball = GameState.balls[0];
        ball.x = GameState.width / 2;
        ball.y = GameState.height / 2;
        ball.isActive = false;
        ball.resetDelay = 60; // ~1 second at 60fps
    }

    function activateBall() {
        const speed = GameConfig.ball.speed * GameConfig.scaleFactor;
        // Random angle between -3π/4 and -π/4 (upward directions)
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 2;
        
        const ball = GameState.balls[0];
        ball.vx = Math.cos(angle) * speed;
        ball.vy = Math.sin(angle) * speed;
        ball.speed = speed;
        ball.isActive = true;
    }

    // ============================================
    // Event Listeners
    // ============================================
    function setupEventListeners() {
        // Mouse events
        GameState.canvas.addEventListener('mousemove', handleMouseMove);
        GameState.canvas.addEventListener('mouseenter', handleMouseEnter);
        GameState.canvas.addEventListener('mouseleave', handleMouseLeave);

        // Touch events
        GameState.canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        GameState.canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        GameState.canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

        // Window resize
        window.addEventListener('resize', handleResize);
    }

    function handleMouseMove(e) {
        const rect = GameState.canvas.getBoundingClientRect();
        const scaleX = GameState.canvas.width / rect.width;
        const mouseX = (e.clientX - rect.left) * scaleX;
        
        updatePaddleTarget(mouseX);
    }

    function handleMouseEnter(e) {
        // Optional: Start tracking on mouse enter
    }

    function handleMouseLeave(e) {
        // Optional: Stop tracking on mouse leave
    }

    function handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = GameState.canvas.getBoundingClientRect();
        const scaleX = GameState.canvas.width / rect.width;
        const touchX = (touch.clientX - rect.left) * scaleX;
        
        updatePaddleTarget(touchX);
    }

    function handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = GameState.canvas.getBoundingClientRect();
        const scaleX = GameState.canvas.width / rect.width;
        const touchX = (touch.clientX - rect.left) * scaleX;
        
        updatePaddleTarget(touchX);
    }

    function handleTouchEnd(e) {
        e.preventDefault();
    }

    function handleResize() {
        setupCanvas();
        initPaddle();
        initBalls();
    }

    // ============================================
    // Paddle Logic
    // ============================================
    function updatePaddleTarget(inputX) {
        const paddleCenter = GameState.paddle.width / 2;
        let targetX = inputX - paddleCenter;

        // Constrain paddle within canvas bounds
        targetX = Math.max(0, Math.min(GameState.width - GameState.paddle.width, targetX));

        GameState.paddle.targetX = targetX;
    }

    function updatePaddle() {
        if (GameState.paddle.targetX === null) return;

        // Smooth paddle movement (lerp)
        const smoothing = 0.15;
        GameState.paddle.x += (GameState.paddle.targetX - GameState.paddle.x) * smoothing;

        // Snap to target when close enough
        if (Math.abs(GameState.paddle.targetX - GameState.paddle.x) < 0.5) {
            GameState.paddle.x = GameState.paddle.targetX;
        }
    }

    // ============================================
    // Ball Logic
    // ============================================
    // Updated function for multiple balls
    function updateBalls() {
        if (GameState.gameState !== 'playing') return;
        
        // Process each ball
        for (let i = GameState.balls.length - 1; i >= 0; i--) {
            const ball = GameState.balls[i];
            
            if (!ball.isActive) {
                if (ball.resetDelay > 0) {
                    ball.resetDelay--;
                    if (ball.resetDelay === 0) {
                        activateBall();
                    }
                }
                continue;
            }
            
            ball.x += ball.vx;
            ball.y += ball.vy;
            
            // Wall collision
            if (ball.x - ball.radius < 0) { ball.x = ball.radius; ball.vx = -ball.vx; }
            if (ball.x + ball.radius > GameState.width) { ball.x = GameState.width - ball.radius; ball.vx = -ball.vx; }
            if (ball.y - ball.radius < 0) { ball.y = ball.radius; ball.vy = -ball.vy; }
            
            if (ball.y + ball.radius > GameState.height) {
                // Ball hit bottom - remove from array
                GameState.balls.splice(i, 1);
                continue;
            }
            
            checkPaddleCollision(ball);
            checkBrickCollision(ball);
        }
        
        // Update main ball reference
        if (GameState.balls.length > 0) {
            GameState.ball = GameState.balls[0];
        }
        
        // Only lose life when NO balls remain AND lives > 0
        if (GameState.balls.length === 0 && GameState.lives > 0) {
            GameState.lives -= 1;
            if (GameState.lives <= 0) {
                GameState.gameState = 'gameOver';
            } else {
                respawnBall();
            }
        }
        
        // Game over only when no balls AND no lives left to respawn
        if (GameState.balls.length === 0 && GameState.lives <= 0) {
            GameState.gameState = 'gameOver';
        }
    }
    
    // Respawn a ball after all balls are lost
    function respawnBall() {
        // Clear any existing power-up timers
        if (GameState.widePaddleTimerId) {
            clearTimeout(GameState.widePaddleTimerId);
            GameState.widePaddleTimerId = null;
        }
        
        // Clear falling power-ups
        GameState.powerUps = [];
        
        // Reset paddle width to base
        GameState.paddle.width = GameState.paddleBaseWidth;
        
        // Reset paddle position
        GameState.paddle.x = (GameState.width - GameState.paddle.width) / 2;
        GameState.paddle.targetX = GameState.paddle.x;
        
        // Initialize ball but keep it inactive until it launches
        const radius = GameConfig.ball.radius * GameConfig.scaleFactor;
        const speed = GameConfig.ball.speed * GameConfig.scaleFactor;
        
        const newBall = {
            x: GameState.paddle.x + GameState.paddle.width / 2,
            y: GameState.paddle.y - radius - 2,
            radius: radius,
            vx: 0,
            vy: 0,
            speed: speed,
            isActive: false,
            resetDelay: 30 // Brief delay before launching
        };
        
        GameState.balls = [newBall];
        GameState.ball = newBall;
    }

    function checkPaddleCollision(ball) {
        const paddle = GameState.paddle;

        // Circle-rectangle collision detection
        // Find the closest point on the paddle to the ball center
        const closestX = Math.max(paddle.x, Math.min(ball.x, paddle.x + paddle.width));
        const closestY = Math.max(paddle.y, Math.min(ball.y, paddle.y + paddle.height));

        // Calculate distance from ball center to closest point
        const distanceX = ball.x - closestX;
        const distanceY = ball.y - closestY;
        const distanceSquared = distanceX * distanceX + distanceY * distanceY;

        // Check if collision occurred
        if (distanceSquared < ball.radius * ball.radius) {
            // Determine collision side
            const overlapX = ball.radius - Math.abs(distanceX);
            const overlapY = ball.radius - Math.abs(distanceY);

            // Only handle top collision (ball coming from above)
            if (distanceY < 0 && Math.abs(distanceY) >= Math.abs(distanceX)) {
                // Position ball above paddle
                ball.y = paddle.y - ball.radius;
                
                // Reflect vertical velocity with slight speed increase
                ball.vy = -Math.abs(ball.vy);
                
                // Add horizontal velocity based on where ball hit paddle
                const hitPosition = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
                ball.vx += hitPosition * 2; // Add some horizontal influence

                // Normalize to maintain consistent speed
                const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                const targetSpeed = ball.speed * 1.02; // Slight speed increase
                ball.vx = (ball.vx / currentSpeed) * targetSpeed;
                ball.vy = (ball.vy / currentSpeed) * targetSpeed;
                ball.speed = targetSpeed;
            }
        }
    }

    function checkBrickCollision(ball) {
        const bricks = GameState.bricks;
        
        for (let row = 0; row < bricks.length; row++) {
            for (let col = 0; col < bricks[row].length; col++) {
                const brick = bricks[row][col];
                
                // Skip broken bricks
                if (brick.status === 0) continue;
                
                // Check collision with brick (simple AABB collision)
                if (ball.x + ball.radius > brick.x &&
                    ball.x - ball.radius < brick.x + brick.width &&
                    ball.y + ball.radius > brick.y &&
                    ball.y - ball.radius < brick.y + brick.height) {
                    
                    // Hit a brick - reverse ball direction
                    ball.vy = -ball.vy;
                    
                    // Decrease brick HP
                    brick.hp -= 1;
                    
                    // Check if brick is destroyed
                    if (brick.hp <= 0) {
                        brick.status = 0;
                        // Award points only when brick is fully broken
                        GameState.score += 10;
                        // Try to spawn power-up
                        spawnPowerUp(brick);
                        // Check if all bricks are broken
                        checkLevelComplete();
                    }
                    
                    return; // Only handle one brick collision per frame
                }
            }
        }
    }
    
    // Power-up System
    function spawnPowerUp(brick) {
        // 20% chance to spawn a power-up
        if (Math.random() > GameConfig.powerUps.dropChance) return;
        
        // Randomly choose power-up type
        const types = ['widePaddle', 'multiBall'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const powerUp = {
            x: brick.x + brick.width / 2 - GameConfig.powerUps.width / 2,
            y: brick.y + brick.height / 2 - GameConfig.powerUps.height / 2,
            width: GameConfig.powerUps.width,
            height: GameConfig.powerUps.height,
            type: type,
            vy: GameConfig.powerUps.fallSpeed,
            rotation: 0
        };
        
        GameState.powerUps.push(powerUp);
    }
    
    function updatePowerUps() {
        if (GameState.gameState !== 'playing') return;
        
        for (let i = GameState.powerUps.length - 1; i >= 0; i--) {
            const powerUp = GameState.powerUps[i];
            
            // Move power-up down
            powerUp.y += powerUp.vy;
            
            // Spin the power-up as it falls
            powerUp.rotation += 0.05;
            
            // Check paddle collision
            const paddle = GameState.paddle;
            if (powerUp.x + powerUp.width > paddle.x &&
                powerUp.x < paddle.x + paddle.width &&
                powerUp.y + powerUp.height > paddle.y &&
                powerUp.y < paddle.y + paddle.height) {
                
                // Activate power-up
                activatePowerUp(powerUp.type);
                GameState.powerUps.splice(i, 1);
                continue;
            }
            
            // Remove if off screen
            if (powerUp.y > GameState.height) {
                GameState.powerUps.splice(i, 1);
            }
        }
    }
    
    function activatePowerUp(type) {
        if (type === 'widePaddle') {
            // Clear any existing timer
            if (GameState.widePaddleTimerId) {
                clearTimeout(GameState.widePaddleTimerId);
            }
            
            // Calculate new width: 1.5x base width, max 90% canvas
            const newWidth = Math.min(GameState.paddleBaseWidth * 1.5, GameState.width * 0.9);
            GameState.paddle.width = newWidth;
            
            // Keep paddle in bounds
            if (GameState.paddle.x + GameState.paddle.width > GameState.width) {
                GameState.paddle.x = GameState.width - GameState.paddle.width;
                GameState.paddle.targetX = GameState.paddle.x;
            }
            
            // Set timer to revert after 10 seconds
            GameState.widePaddleTimerId = setTimeout(function() {
                GameState.paddle.width = GameState.paddleBaseWidth;
                GameState.widePaddleTimerId = null;
            }, 10000);
        } else if (type === 'multiBall') {
            // Spawn two additional balls at paddle location
            const paddle = GameState.paddle;
            const speed = GameConfig.ball.speed * GameConfig.scaleFactor;
            
            // Create two new balls with different angles
            for (let i = 0; i < 2; i++) {
                const angle = -Math.PI / 2 + (i === 0 ? -0.5 : 0.5);
                const newBall = {
                    x: paddle.x + paddle.width / 2,
                    y: paddle.y - 20,
                    radius: GameConfig.ball.radius * GameConfig.scaleFactor,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    speed: speed,
                    isActive: true,
                    resetDelay: 0
                };
                GameState.balls.push(newBall);
            }
        }
    }
    
    function drawPowerUps() {
        const ctx = GameState.ctx;
        const scale = GameConfig.scaleFactor;
        
        for (let i = 0; i < GameState.powerUps.length; i++) {
            const powerUp = GameState.powerUps[i];
            
            // Save context for rotation
            ctx.save();
            
            // Translate to center of power-up for rotation
            const centerX = powerUp.x + powerUp.width / 2;
            const centerY = powerUp.y + powerUp.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate(powerUp.rotation);
            
            // Set colors based on type
            let color, glowColor, gradientColor1, gradientColor2;
            if (powerUp.type === 'widePaddle') {
                color = '#e040fb';
                glowColor = '#e040fb';
                gradientColor1 = '#e040fb';
                gradientColor2 = '#7c4dff';
            } else {
                color = '#ff6d00';
                glowColor = '#ff6d00';
                gradientColor1 = '#ff6d00';
                gradientColor2 = '#ffab00';
            }
            
            // Create glowing effect
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 20;
            
            // Create gradient for gem effect
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, powerUp.width / 2);
            gradient.addColorStop(0, gradientColor1);
            gradient.addColorStop(0.5, color);
            gradient.addColorStop(1, gradientColor2);
            
            ctx.fillStyle = gradient;
            
            // Draw hexagon gem shape
            const size = powerUp.width / 2;
            ctx.beginPath();
            for (let j = 0; j < 6; j++) {
                const angle = (Math.PI / 3) * j - Math.PI / 6;
                const x = Math.cos(angle) * size * 0.9;
                const y = Math.sin(angle) * size * 0.9;
                if (j === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();
            
            // Inner highlight
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            for (let j = 0; j < 6; j++) {
                const angle = (Math.PI / 3) * j - Math.PI / 6;
                const x = Math.cos(angle) * size * 0.4;
                const y = Math.sin(angle) * size * 0.4;
                if (j === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();
            
            // Draw letter (unrotated relative to gem, but we've already rotated context)
            ctx.fillStyle = 'white';
            ctx.font = 'bold ' + (14 * scale) + 'px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 10;
            const letter = powerUp.type === 'widePaddle' ? 'W' : 'M';
            ctx.fillText(letter, 0, 0);
            
            ctx.restore();
        }
    }
    
    function checkLevelComplete() {
        const bricks = GameState.bricks;
        for (let row = 0; row < bricks.length; row++) {
            for (let col = 0; col < bricks[row].length; col++) {
                // Skip null bricks (empty spaces in level)
                if (!bricks[row][col]) continue;
                if (bricks[row][col].status === 1) return; // Found active brick
            }
        }
        
        // All bricks destroyed!
        // Check if there are more levels
        if (GameState.currentLevelIndex < GameLevels.length - 1) {
            // More levels available - trigger level transition
            GameState.gameState = 'levelTransition';
            GameState.ball.isActive = false;
        } else {
            // Final level completed - show game over (win)
            GameState.gameState = 'levelComplete';
            GameState.ball.isActive = false;
        }
    }
    
    // Load the next level
    function loadNextLevel() {
        GameState.currentLevelIndex++;
        
        // Clear power-ups and reset paddle
        GameState.powerUps = [];
        if (GameState.widePaddleTimerId) {
            clearTimeout(GameState.widePaddleTimerId);
            GameState.widePaddleTimerId = null;
        }
        
        // Reset paddle width
        GameState.paddle.width = GameState.paddleBaseWidth;
        
        // Reinitialize bricks for new level
        initBalls();
        initBricks();
        
        // Reset paddle position
        GameState.paddle.x = (GameState.width - GameState.paddle.width) / 2;
        GameState.paddle.targetX = GameState.paddle.x;
        
        // Resume playing
        GameState.gameState = 'playing';
    }

    // ============================================
    // Rendering
    // ============================================
    function clearCanvas() {
        const ctx = GameState.ctx;
        ctx.fillStyle = GameConfig.colors.background;
        ctx.fillRect(0, 0, GameState.width, GameState.height);
    }

    function drawPaddle() {
        const ctx = GameState.ctx;
        const paddle = GameState.paddle;

        // Main paddle body
        ctx.fillStyle = GameConfig.colors.paddle;
        ctx.beginPath();
        ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 8);
        ctx.fill();

        // Highlight effect on top
        ctx.fillStyle = GameConfig.colors.paddleHighlight;
        ctx.beginPath();
        ctx.roundRect(
            paddle.x + 4, 
            paddle.y + 2, 
            paddle.width - 8, 
            paddle.height / 3, 
            4
        );
        ctx.fill();
    }

    function drawBall() {
        // Draw all balls
        const ctx = GameState.ctx;
        
        for (let i = 0; i < GameState.balls.length; i++) {
            const ball = GameState.balls[i];
            
            // Skip if ball is not active
            if (!ball.isActive) continue;
    
            // Draw glow effect
            ctx.save();
            ctx.shadowColor = GameConfig.colors.ballGlow;
            ctx.shadowBlur = 15;
            
            // Draw ball
            ctx.fillStyle = GameConfig.colors.ball;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
    
            // Inner highlight
            ctx.fillStyle = GameConfig.colors.ballGlow;
            ctx.beginPath();
            ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawBricks() {
        const ctx = GameState.ctx;
        const bricks = GameState.bricks;
        
        for (let row = 0; row < bricks.length; row++) {
            for (let col = 0; col < bricks[row].length; col++) {
                const brick = bricks[row][col];
                
                // Skip broken bricks
                if (brick.status === 0) continue;
                
                // Get color based on HP
                const brickColor = GameConfig.colors.brickHP[brick.hp] || GameConfig.colors.brick;
                const highlightColor = adjustBrightness(brickColor, 30);
                
                // Draw brick body
                ctx.fillStyle = brickColor;
                ctx.beginPath();
                ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
                ctx.fill();
                
                // Draw highlight
                ctx.fillStyle = highlightColor;
                ctx.beginPath();
                ctx.roundRect(brick.x + 2, brick.y + 2, brick.width - 4, brick.height / 3, 2);
                ctx.fill();
            }
        }
    }
    
    // Helper function to adjust color brightness
    function adjustBrightness(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, Math.max(0, (num >> 16) + amt));
        const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
        const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    function render() {
        clearCanvas();
        drawBricks();
        drawPaddle();
        drawBall();
        drawPowerUps();
        
        // Draw score and lives
        drawUI();
        
        // Draw game over / level complete screens
        drawGameState();
        
        // Debug: Show canvas dimensions in top-left corner
        const ctx = GameState.ctx;
        ctx.fillStyle = 'white';
        ctx.font = '14px monospace';
        ctx.fillText('Canvas: ' + GameState.width + ' x ' + GameState.height, 10, 20);
    }
    
    function drawUI() {
        const ctx = GameState.ctx;
        const scale = GameConfig.scaleFactor;
        
        ctx.fillStyle = GameConfig.colors.text;
        ctx.font = 'bold ' + (18 * scale) + 'px sans-serif';
        
        // Draw score on the left
        ctx.textAlign = 'left';
        ctx.fillText('Score: ' + GameState.score, 15 * scale, 30 * scale);
        
        // Draw level in the center
        ctx.textAlign = 'center';
        ctx.fillText('Level: ' + (GameState.currentLevelIndex + 1), GameState.width / 2, 30 * scale);
        
        // Draw lives on the right
        ctx.textAlign = 'right';
        ctx.fillText('Lives: ' + GameState.lives, GameState.width - 15 * scale, 30 * scale);
    }
    
    function drawGameState() {
        const ctx = GameState.ctx;
        const scale = GameConfig.scaleFactor;
        
        if (GameState.gameState === 'gameOver') {
            // Darken background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, GameState.width, GameState.height);
            
            // Draw game over text
            ctx.fillStyle = GameConfig.colors.text;
            ctx.textAlign = 'center';
            ctx.font = 'bold ' + (40 * scale) + 'px sans-serif';
            ctx.fillText('Game Over', GameState.width / 2, GameState.height / 2 - 20 * scale);
            
            ctx.font = (20 * scale) + 'px sans-serif';
            ctx.fillText('Score: ' + GameState.score, GameState.width / 2, GameState.height / 2 + 20 * scale);
            ctx.fillText('Tap to Restart', GameState.width / 2, GameState.height / 2 + 60 * scale);
        } else if (GameState.gameState === 'levelComplete') {
            // Darken background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, GameState.width, GameState.height);
            
            // Draw win text
            ctx.fillStyle = GameConfig.colors.textHighlight;
            ctx.textAlign = 'center';
            ctx.font = 'bold ' + (40 * scale) + 'px sans-serif';
            ctx.fillText('You Win!', GameState.width / 2, GameState.height / 2 - 20 * scale);
            
            ctx.fillStyle = GameConfig.colors.text;
            ctx.font = (20 * scale) + 'px sans-serif';
            ctx.fillText('Score: ' + GameState.score, GameState.width / 2, GameState.height / 2 + 20 * scale);
            ctx.fillText('Tap to Play Again', GameState.width / 2, GameState.height / 2 + 60 * scale);
        } else if (GameState.gameState === 'levelTransition') {
            // Darken background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, GameState.width, GameState.height);
            
            // Draw level complete text
            ctx.fillStyle = GameConfig.colors.textHighlight;
            ctx.textAlign = 'center';
            ctx.font = 'bold ' + (40 * scale) + 'px sans-serif';
            ctx.fillText('Level Complete!', GameState.width / 2, GameState.height / 2 - 20 * scale);
            
            ctx.fillStyle = GameConfig.colors.text;
            ctx.font = (20 * scale) + 'px sans-serif';
            ctx.fillText('Next: Level ' + (GameState.currentLevelIndex + 2), GameState.width / 2, GameState.height / 2 + 20 * scale);
            ctx.fillText('Tap for Next Level', GameState.width / 2, GameState.height / 2 + 60 * scale);
        }
    }

    // ============================================
    // Game Loop
    // ============================================
    function gameLoop() {
        if (!GameState.isRunning) return;

        updatePaddle();
        updateBalls();
        updatePowerUps();
        render();

        requestAnimationFrame(gameLoop);
    }

    // ============================================
    // Public API (for future extension)
    // ============================================
    window.BrickSmasher = {
        GameState: GameState,
        GameConfig: GameConfig,
        
        // Future methods will be added here
        addBall: function() { /* TODO */ },
        addBricks: function() { /* TODO */ },
        start: function() { /* TODO */ },
        pause: function() { /* TODO */ },
        reset: function() { /* TODO */ }
    };

    // ============================================
    // Start Game
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
