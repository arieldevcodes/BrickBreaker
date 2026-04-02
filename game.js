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

        // Colors
        colors: {
            background: '#0f0f23',
            paddle: '#e94560',
            paddleHighlight: '#ff6b6b',
            ball: '#00d9ff',
            ballGlow: '#00ffff'
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
        initPaddle();
        initBall();
        setupEventListeners();
        
        GameState.isRunning = true;
        gameLoop();
    }

    function setupCanvas() {
        const container = document.getElementById('game-container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calculate scale to fit mobile screen while maintaining aspect ratio
        const scaleX = containerWidth / GameConfig.baseWidth;
        const scaleY = containerHeight / GameConfig.baseHeight;
        const scale = Math.min(scaleX, scaleY, 1.5); // Max scale of 1.5

        GameConfig.scaleFactor = scale;

        // Set canvas size
        GameState.width = Math.floor(GameConfig.baseWidth * scale);
        GameState.height = Math.floor(GameConfig.baseHeight * scale);

        GameState.canvas.width = GameState.width;
        GameState.canvas.height = GameState.height;
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
    }

    function initBall() {
        const radius = GameConfig.ball.radius * GameConfig.scaleFactor;
        const speed = GameConfig.ball.speed * GameConfig.scaleFactor;
        const angle = GameConfig.ball.initialAngle;

        GameState.ball = {
            x: GameState.width / 2,
            y: GameState.height / 2,
            radius: radius,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            speed: speed,
            isActive: true,
            resetDelay: 0
        };
    }

    function resetBall() {
        GameState.ball.x = GameState.width / 2;
        GameState.ball.y = GameState.height / 2;
        GameState.ball.isActive = false;
        GameState.ball.resetDelay = 60; // ~1 second at 60fps
    }

    function activateBall() {
        const speed = GameConfig.ball.speed * GameConfig.scaleFactor;
        // Random angle between -3π/4 and -π/4 (upward directions)
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 2;
        
        GameState.ball.vx = Math.cos(angle) * speed;
        GameState.ball.vy = Math.sin(angle) * speed;
        GameState.ball.speed = speed;
        GameState.ball.isActive = true;
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
        initBall();
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
    function updateBall() {
        const ball = GameState.ball;

        // Handle reset delay
        if (!ball.isActive) {
            if (ball.resetDelay > 0) {
                ball.resetDelay--;
                if (ball.resetDelay === 0) {
                    activateBall();
                }
            }
            return;
        }

        // Update position
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Wall collision (left, right, top)
        // Left wall
        if (ball.x - ball.radius < 0) {
            ball.x = ball.radius;
            ball.vx = -ball.vx;
        }
        // Right wall
        if (ball.x + ball.radius > GameState.width) {
            ball.x = GameState.width - ball.radius;
            ball.vx = -ball.vx;
        }
        // Top wall
        if (ball.y - ball.radius < 0) {
            ball.y = ball.radius;
            ball.vy = -ball.vy;
        }

        // Bottom edge - reset ball
        if (ball.y + ball.radius > GameState.height) {
            resetBall();
            return;
        }

        // Paddle collision
        checkPaddleCollision();
    }

    function checkPaddleCollision() {
        const ball = GameState.ball;
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
        const ctx = GameState.ctx;
        const ball = GameState.ball;

        // Skip if ball is not active
        if (!ball.isActive) return;

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

    function render() {
        clearCanvas();
        drawPaddle();
        drawBall();
    }

    // ============================================
    // Game Loop
    // ============================================
    function gameLoop() {
        if (!GameState.isRunning) return;

        updatePaddle();
        updateBall();
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
