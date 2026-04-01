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

        // Colors
        colors: {
            background: '#0f0f23',
            paddle: '#e94560',
            paddleHighlight: '#ff6b6b'
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

    function render() {
        clearCanvas();
        drawPaddle();
    }

    // ============================================
    // Game Loop
    // ============================================
    function gameLoop() {
        if (!GameState.isRunning) return;

        updatePaddle();
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
