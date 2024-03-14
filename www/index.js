import { Universe, Cell } from "wasm-game-of-life";
import { memory } from "wasm-game-of-life/wasm_game_of_life_bg";

const CELL_SIZE = 5; // px
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

// Construct the universe, and get its width and height.
const universe = Universe.new();
universe.reset_to_mod_2_mod_7();
const width = universe.width();
const height = universe.height();

// Give the canvas room for all of our cells and a 1px border
// around each of them.
const canvas = document.getElementById("game-of-life-canvas");
canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;

canvas.addEventListener("click", event => {
  const boundingRect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / boundingRect.width;
  const scaleY = canvas.height / boundingRect.height;

  const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
  const canvasTop = (event.clientY - boundingRect.top) * scaleY;

  const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
  const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

  universe.toggle_cell(row, col);

  drawGrid();
  drawCells();
})

const ctx = canvas.getContext('2d');

let animationId = null;
let tickAccumulator = 0;

const renderLoop = () => {
  drawGrid();
  drawCells();

  tickAccumulator += ticksPerFrame();
  while (tickAccumulator > 1) {
    universe.tick();
    tickAccumulator -= 1;
  }

  animationId = requestAnimationFrame(renderLoop);
};

const drawGrid = () => {
  ctx.beginPath();
  ctx.strokeStyle = GRID_COLOR;

  // Vertical lines.
  for (let i = 0; i <= width; i++) {
    ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
    ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
  }

  // Horizontal lines.
  for (let j = 0; j <= height; j++) {
    ctx.moveTo(0,                           j * (CELL_SIZE + 1) + 1);
    ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
  }

  ctx.stroke();
};

const getIndex = (row, column) => {
  return row * width + column;
};

const drawCells = () => {
  const cellsPtr = universe.cells();
  const cells = new Uint8Array(memory.buffer, cellsPtr, width * height);

  ctx.beginPath();

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = getIndex(row, col);

      ctx.fillStyle = cells[idx] === Cell.Dead
        ? DEAD_COLOR
        : ALIVE_COLOR;

      ctx.fillRect(
        col * (CELL_SIZE + 1) + 1,
        row * (CELL_SIZE + 1) + 1,
        CELL_SIZE,
        CELL_SIZE
      );
    }
  }

  ctx.stroke();
};

const isPaused = () => {
  return animationId === null;
}

const playPauseButton = document.getElementById("play-pause");

const play = () => {
  playPauseButton.textContent = "⏸";
  renderLoop();
}

const pause = () => {
  playPauseButton.textContent = "▶️";
  cancelAnimationFrame(animationId);
  animationId = null;
}

playPauseButton.addEventListener("click", event => {
  if (isPaused()) {
    play();
  } else {
    pause();
  }
});

const ticksPerFrameWidget = document.getElementById("ticks-per-frame-widget");

const ticksPerFrame = () => {
  return 10 ** ticksPerFrameWidget.value
}

const ticksPerFrameValue = document.getElementById("ticks-per-frame-value");

const updateTicksPerFrameValue = () => {
  ticksPerFrameValue.textContent = ticksPerFrame().toFixed(3);
}

ticksPerFrameWidget.addEventListener("input", event => {
  updateTicksPerFrameValue();
});

const resetToRandomButtom = document.getElementById("reset-random");
resetToRandomButtom.textContent = "Random";

resetToRandomButtom.addEventListener("click", event => {
  universe.reset_to_random();
  drawCells();
})

const resetToDeadButtom = document.getElementById("reset-dead");
resetToDeadButtom.textContent = "Clear";

resetToDeadButtom.addEventListener("click", event => {
  universe.reset_to_dead();
  drawCells();
})

drawGrid();
drawCells();
updateTicksPerFrameValue();
play();
