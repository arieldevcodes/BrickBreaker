# Brick Smasher

A browser-based breakout-style game built with vanilla JavaScript, HTML5 Canvas, and CSS.

## Project Structure

- `index.html` - Entry point, sets up the canvas and links assets
- `game.js` - Core game logic (IIFE): game loop, paddle movement, input handling (mouse + touch), responsive canvas sizing
- `style.css` - Visual styling, responsive layout, touch behavior
- `server.js` - Simple Node.js static file server for development

## Tech Stack

- **Languages:** Vanilla JavaScript (ES6+), HTML5, CSS3
- **Rendering:** HTML5 Canvas API
- **Server:** Node.js built-in `http` module (no external dependencies)

## Running the Project

The app is served via a Node.js static server on port 5000:

```
node server.js
```

## Deployment

Configured as a **static** deployment — the project root (`.`) is the public directory. No build step required.

## Game Features

- Smooth paddle movement with lerp interpolation
- Mouse and touch input support
- Responsive canvas that adapts to window size
- Dark gradient theme with a neon pink paddle
