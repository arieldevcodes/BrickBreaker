/**
 * Level Definitions for Brick Smasher
 * Each level is a 5x8 grid (5 rows, 8 columns)
 * 0 = empty space, 1-6 = HP values
 */

const GameLevels = [
    // Level 1: Checkerboard pattern - easy introduction
    [
        [1, 0, 1, 0, 1, 0, 1, 0],
        [0, 2, 0, 2, 0, 2, 0, 2],
        [1, 0, 1, 0, 1, 0, 1, 0],
        [0, 2, 0, 2, 0, 2, 0, 2],
        [1, 0, 1, 0, 1, 0, 1, 0]
    ],
    // Level 2: Diamond pattern - medium difficulty
    [
        [3, 0, 0, 4, 4, 0, 0, 3],
        [0, 0, 4, 5, 5, 4, 0, 0],
        [0, 4, 5, 6, 6, 5, 4, 0],
        [0, 0, 4, 5, 5, 4, 0, 0],
        [3, 0, 0, 4, 4, 0, 0, 3]
    ],
    // Level 3: Ring pattern - harder
    [
        [4, 4, 4, 4, 4, 4, 4, 4],
        [4, 3, 3, 3, 3, 3, 3, 4],
        [4, 3, 0, 0, 0, 0, 3, 4],
        [4, 3, 0, 0, 0, 0, 3, 4],
        [4, 4, 4, 4, 4, 4, 4, 4]
    ],
    // Level 4: Pyramid pattern - escalating difficulty
    [
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 2, 2, 2, 2, 0, 0],
        [0, 3, 3, 3, 3, 3, 3, 0],
        [0, 4, 4, 4, 4, 4, 4, 0],
        [5, 5, 5, 5, 5, 5, 5, 5]
    ],
    // Level 5: Wave pattern - final challenge
    [
        [1, 2, 3, 4, 4, 3, 2, 1],
        [2, 3, 4, 5, 5, 4, 3, 2],
        [3, 4, 5, 6, 6, 5, 4, 3],
        [4, 5, 6, 6, 6, 6, 5, 4],
        [5, 6, 6, 6, 6, 6, 6, 5]
    ],
    // Level 6: Full assault - boss level
    [
        [6, 5, 6, 5, 5, 6, 5, 6],
        [5, 6, 5, 6, 6, 5, 6, 5],
        [6, 5, 6, 6, 6, 6, 5, 6],
        [5, 6, 5, 6, 6, 5, 6, 5],
        [6, 5, 6, 5, 5, 6, 5, 6]
    ]
];