document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startButton').addEventListener('click', showTileSelection);
});
document.getElementById('shuffle-button').addEventListener('click', shuffleTiles);
document.getElementById('hint-button').addEventListener('click', showHint);
document.getElementById('pause-button').addEventListener('click', togglePause);
document.getElementById('close-modal').addEventListener('click', closePauseModal);

const startMenu = document.getElementById('start-menu');
const gameContainer = document.getElementById('game-container');
const gameBoard = document.getElementById('game-board');
const timerElement = document.getElementById('timer');
const scoreElement = document.getElementById('score-value');
const highScoreElement = document.getElementById('high-score-value');
const hintButton = document.getElementById('hint-button');
const shuffleButton = document.getElementById('shuffle-button');
const pauseButton = document.getElementById('pause-button');
const pauseModal = document.getElementById('pause-modal');
const pauseMessage = document.getElementById('pause-message');
const clickSound = new Audio('sounds/click.mp3');
const matchSound = new Audio('sounds/match.mp3');
const winSound = new Audio('sounds/win.mp3');
const lossSound = new Audio('sounds/loss.mp3');
const introSound = new Audio('sounds/intro.mp3');
const gameOverModal = document.getElementById('game-over-modal');
const finalScoreElement = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');

let currentLevel = 1;
let currentTileType = '';

restartButton.addEventListener('click', () => {
    gameOverModal.style.display = 'none';
    startGame();
});

let tiles = [];
let selectedTiles = [];
let timer;
let timeLeft = 300; // 5 minutes
let score = 0;
let hintsUsed = 0;
let shufflesUsed = 0;
const maxHints = 3;
const maxShuffles = 5; // Reduced number of shuffles
let isPaused = false;

function preload() {
    const images = [];
    for (let i = 0; i < 16; i++) {
        const img = new Image();
        img.src = `images/tile${i}.png`;
        images.push(img);
    }
    const sounds = [
        'sounds/intro.mp3',
        'sounds/click.mp3',
        'sounds/match.mp3',
        'sounds/win.mp3',
        'sounds/loss.mp3'
    ];
    sounds.forEach(sound => {
        const audio = new Audio();
        audio.src = sound;
    });
}

// Ensure this function is defined in alphaphasor.js
function showTileSelection() {
    startMenu.style.display = 'none';
    document.getElementById('tile-selection-menu').style.display = 'block';
}

// Ensure this function is defined in alphaphasor.js
function selectTileType(type) {
    currentTileType = type;
    document.getElementById('tile-selection-menu').style.display = 'none';
    gameContainer.style.display = 'block';
    initializeGameBoard(type);
}

function startGame() {
    console.log('startGame called with typeType:', tileType);
    const tileSelectionMenu = document.getElementById('tile-selection-menu');
    const gameContainer = document.getElementById('game-container');
    
    tileSelectionMenu.style.display = 'none';
    gameContainer.style.display = 'block';
    
    // Initialize the game board, timer, score, etc.
    initializeGameBoard(tileType);
}

function initializeGameBoard(tileType) {
    console.log('initializeGameBoard called with tileType:', tileType);
    resetGame();
    loadTileImages(tileType, () => {
        const tiles = generateTiles(tileType);
        renderTiles(tiles);
        startTimer();
        updateScore();
        updateButtonLabels();
        displayHighScore();
        updateLevelDisplay();
    });
}

document.querySelectorAll('.tile-group').forEach(group => {
    group.addEventListener('click', function() {
        const selectedType = this.getAttribute('data-type');
        startTileGame(selectedType);
    });
});

function startTileGame(tileType) {
    document.getElementById('tileTypeSelection').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    // Load the selected tile type images
    loadTileImages(tileType);
    startGame();
}

function loadTileImages(tileType, callback) {
    const images = [];
    let loadedImages = 0;
    for (let i = 0; i < 4; i++) {
        const img = new Image();
        img.src = `images/${tileType}/tile${i}.png`;
        img.onload = () => {
            loadedImages++;
            if (loadedImages === 4) {
                callback();
            }
        }
        images.push(img);
    }
}

function startGame() {
    introSound.loop = true; // Loop the intro sound
    introSound.play(); // Play intro sound
    startMenu.style.display = 'none';
    gameContainer.style.display = 'block';
    gameBoard.innerHTML = '';
    tiles = generateTiles();
    resetGame();
    renderTiles();
    startTimer();
}

function generateTiles(tileType) {
    const tiles = [];
    const numTiles = 16 + (currentLevel - 1) * 4;
    for (let i = 0; i < numTiles; i++) {
        tiles.push({
            id: i,
            type: tileType,
            image: `images/${tileType}/tile${i % 4}.png`
        });
    }
    return tiles;
}

function renderTiles(tiles) {
    tiles.forEach(tile => {
        const tileElement = document.createElement('div');
        tileElement.classList.add('tile');
        tileElement.style.backgroundImage = `url(${tile.image})`;
        tileElement.addEventListener('click', () => handleTileClick(tile));
        gameBoard.appendChild(tileElement);
    });
}

function renderTiles() {
    console.log('Rendering tiles');
    const totalTiles = tiles.length;
    const columns = 8; // Number of columns
    const rows = 4; // Number of rows

    gameBoard.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    gameBoard.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    gameBoard.innerHTML = ''; // Clear the board before rendering
    tiles.forEach((tile, index) => {
        const tileElement = document.createElement('div');
        tileElement.classList.add('tile');
        tileElement.dataset.index = index;
        if (tile.matched) {
            tileElement.classList.add('locked');
        } else {
            tileElement.style.backgroundImage = `url('${tile.image}')`;
            tileElement.addEventListener('click', () => selectTile(index));
        }
        gameBoard.appendChild(tileElement);
    });
}

function handleTileClick(tile) {
    clickSound.play();
    selectedTiles.push(tile);
    if (selectedTiles.length === 2) {
        if (selectedTiles[0].image === selectedTiles[1].image) {
            matchSound.play();
            selectedTiles.forEach(t => {
                const tileElement = document.querySelector(`.tile[style*="url(${t.image})"]`);
                tileElement.style.visibility = 'hidden';
            });
            score += 10;
            updateScore();
            selectedTiles = [];
            if (tiles.every(t => document.querySelector(`.tile[style*="url(${t.image})"]`).style.visibility === 'hidden')) {
                winSound.play();
                nextLevel();
            }
        } else {
            lossSound.play();
            selectedTiles = [];
        }
    }
}

function selectTile(index) {
    if (selectedTiles.length < 2 && !tiles[index].matched && !selectedTiles.includes(index)) {
        selectedTiles.push(index);
        updateTileSelection();
        clickSound.play(); // Play click sound
        if (selectedTiles.length === 2) {
            setTimeout(checkMatch, 500); // Delay to show the second tile before checking match
        }
    }
}

function updateTileSelection() {
    document.querySelectorAll('.tile').forEach((tile, index) => {
        tile.classList.toggle('selected', selectedTiles.includes(index));
    });
}

function checkMatch() {
    const [firstIndex, secondIndex] = selectedTiles;
    const firstTile = tiles[firstIndex];
    const secondTile = tiles[secondIndex];

    if (firstTile.image === secondTile.image && areAdjacent(firstIndex, secondIndex)) {
        firstTile.matched = true;
        secondTile.matched = true;
        score += 10;
        updateScore();
        matchSound.play(); // Play match sound
        document.querySelectorAll('.tile').forEach((tile, index) => {
            if (tiles[index].matched) {
                tile.classList.add('matched');
                setTimeout(() => {
                    tile.classList.add('locked'); // Lock the placeholder
                }, 500); // Delay to show the matched state before locking
            }
        });
        matchTiles(document.querySelector(`[data-index="${firstIndex}"]`), document.querySelector(`[data-index="${secondIndex}"]`));
    }
    selectedTiles = [];
    updateTileSelection();
    checkWinCondition();
}

function areAdjacent(index1, index2) {
    const columns = 8; // Number of columns

    const row1 = Math.floor(index1 / columns);
    const col1 = index1 % columns;
    const row2 = Math.floor(index2 / columns);
    const col2 = index2 % columns;

    return (row1 === row2 && Math.abs(col1 - col2) === 1) || (col1 === col2 && Math.abs(row1 - row2) === 1);
}

function checkWinCondition() {
    if (tiles.every(tile => tile.matched)) {
        clearInterval(timer);
        winSound.play(); // Play win sound
        introSound.pause(); // Stop intro sound
        alert('You win!');
        updateHighScore();
        resetToStartMenu();
    }
}

function startTimer() {
    timeLeft = 300; // 5 minutes
    timerElement.textContent = `Time: ${formatTime(timeLeft)}`;
    timer = setInterval(() => {
        if (!isPaused) {
            timeLeft--;
            timerElement.textContent = `Time: ${formatTime(timeLeft)}`;
            if (timeLeft <= 0) {
                endGame();
            }
        }
    }, 1000);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

function updateScore() {
    scoreElement.textContent = `${score}`;
}

function resetGame() {
    gameBoard.innerHTML = '';
}

function shuffleTiles() {
    if (shufflesUsed >= maxShuffles) {
        alert('No more shuffles available!');
        return;
    }

    let hasMatches;
    do {
        const remainingTiles = tiles.filter(tile => !tile.matched);
        const remainingValues = remainingTiles.map(tile => tile.image);
        remainingValues.sort(() => Math.random() - 0.5);

        let valueIndex = 0;
        tiles.forEach(tile => {
            if (!tile.matched) {
                tile.image = remainingValues[valueIndex++];
            }
        });
        renderTiles();
        hasMatches = hasAvailableMatches();
    } while (!hasMatches);

    shufflesUsed++;
    updateButtonLabels();
    if (shufflesUsed >= maxShuffles) {
        shuffleButton.disabled = true;
    }
}

function showHint() {
    if (hintsUsed >= maxHints) {
        alert('No more hints available!');
        return;
    }

    for (let i = 0; i < tiles.length; i++) {
        for (let j = i + 1; j < tiles.length; j++) {
            if (tiles[i].image === tiles[j].image && !tiles[i].matched && !tiles[j].matched && areAdjacent(i, j)) {
                highlightHint(i, j);
                hintsUsed++;
                updateButtonLabels();
                if (hintsUsed >= maxHints) {
                    hintButton.disabled = true;
                }
                return;
            }
        }
    }
}

function highlightHint(index1, index2) {
    const tileElements = document.querySelectorAll('.tile');
    tileElements[index1].classList.add('hint');
    tileElements[index2].classList.add('hint');
    setTimeout(() => {
        tileElements[index1].classList.remove('hint');
        tileElements[index2].classList.remove('hint');
    }, 1000); // Highlight for 1 second
}

function togglePause() {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
    if (isPaused) {
        showPauseModal();
    } else {
        closePauseModal();
    }
}

function showPauseModal() {
    pauseMessage.innerHTML = `
        <p>Time Left: ${formatTime(timeLeft)}</p>
        <p>Stars Won: ${score}</p>
        <p>Hints Used: ${hintsUsed} / ${maxHints}</p>
        <p>Shuffles Used: ${shufflesUsed} / ${maxShuffles}</p>
    `;
    pauseModal.style.display = 'block';
}

function closePauseModal() {
    pauseModal.style.display = 'none';
}

function resetToStartMenu() {
    gameContainer.style.display = 'none';
    startMenu.style.display = 'block';
    gameBoard.innerHTML = '';
    timerElement.textContent = 'Time: 300';
    scoreElement.textContent = '0';
    hintButton.disabled = false;
    shuffleButton.disabled = false;
    pauseButton.textContent = 'Pause';
    updateButtonLabels();
    displayHighScore();
}

function updateButtonLabels() {
    hintButton.textContent = `Hint (${maxHints - hintsUsed})`;
    shuffleButton.textContent = `Shuffle (${maxShuffles - shufflesUsed})`;
}

function getHighScore() {
    return localStorage.getItem('highScore') || 0;
}

function setHighScore(newHighScore) {
    localStorage.setItem('highScore', newHighScore);
}

function updateHighScore() {
    const highScore = getHighScore();
    if (score > highScore) {
        setHighScore(score);
        alert(`New High Score: ${score}`);
    }
}

function displayHighScore() {
    const highScore = getHighScore();
    highScoreElement.textContent = `High Score: ${highScore}`;
}

// Initialize the high score display when the page loads
document.addEventListener('DOMContentLoaded', () => {
    displayHighScore();
});

function endGame() {
    clearInterval(timer);
    introSound.pause(); // Stop intro sound
    lossSound.play(); // Play loss sound
    finalScoreElement.textContent = score;
    gameOverModal.style.display = 'block';
}

function hasAvailableMatches() {
    for (let i = 0; i < tiles.length; i++) {
        for (let j = i + 1; j < tiles.length; j++) {
            if (tiles[i].image === tiles[j].image && !tiles[i].matched && !tiles[j].matched && areAdjacent(i, j)) {
                return true;
            }
        }
    }
    return false;
}

function drawLine(x1, y1, x2, y2) {
    const line = document.createElement('div');
    line.className = 'line';
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    line.style.width = `${length}px`;
    line.style.transform = `rotate(${angle}deg)`;
    line.style.left = `${x1}px`;
    line.style.top = `${y1}px`;
    document.body.appendChild(line);
}
function matchTiles(tile1, tile2) {
    tile1.classList.add('matched');
    tile2.classList.add('matched');
    setTimeout(() => {
        tile1.style.display = 'none';
        tile2.style.display = 'none';
    }, 1000);
}

function checkForMatches() {
    const tiles = getTiles(); // Assume this function gets all the tiles on the board
    const matchedTiles = [];

    for (let i = 0; i < tiles.length; i++) {
        for (let j = 0; j < tiles[i].length; j++) {
            const tile = tiles[i][j];

            // Check for L shape matches
            if (isLShapeMatch(tiles, i, j)) {
                matchedTiles.push(tile);
            }

            // Check for three-sided open rectangle matches
            if (isThreeSidedOpenRectangleMatch(tiles, i, j)) {
                matchedTiles.push(tile);
            }
        }
    }

    // Handle matched tiles (e.g., remove them, update score, etc.)
    handleMatchedTiles(matchedTiles);
}

function isLShapeMatch(tiles, row, col) {
    const tile = tiles[row][col];

    // Check all possible L shapes
    return (
        (tiles[row + 1] && tiles[row + 1][col] === tile && tiles[row + 1][col + 1] === tile) ||
        (tiles[row - 1] && tiles[row - 1][col] === tile && tiles[row - 1][col + 1] === tile) ||
        (tiles[row][col + 1] === tile && tiles[row + 1] && tiles[row + 1][col + 1] === tile) ||
        (tiles[row][col - 1] === tile && tiles[row + 1] && tiles[row + 1][col - 1] === tile) ||
        (tiles[row - 1] && tiles[row - 1][col] === tile && tiles[row - 1][col - 1] === tile) ||
        (tiles[row + 1] && tiles[row + 1][col] === tile && tiles[row + 1][col - 1] === tile) ||
        (tiles[row][col - 1] === tile && tiles[row - 1] && tiles[row - 1][col - 1] === tile) ||
        (tiles[row][col + 1] === tile && tiles[row - 1] && tiles[row - 1][col + 1] === tile)
    );
}

function isThreeSidedOpenRectangleMatch(tiles, row, col) {
    const tile = tiles[row][col];

    // Check all possible three-sided open rectangles
    return (
        (tiles[row + 1] && tiles[row + 1][col] === tile && tiles[row + 2] && tiles[row + 2][col] === tile && tiles[row + 1][col + 1] === tile) ||
        (tiles[row - 1] && tiles[row - 1][col] === tile && tiles[row - 2] && tiles[row - 2][col] === tile && tiles[row - 1][col + 1] === tile) ||
        (tiles[row][col + 1] === tile && tiles[row][col + 2] === tile && tiles[row + 1] && tiles[row + 1][col + 1] === tile) ||
        (tiles[row][col - 1] === tile && tiles[row][col - 2] === tile && tiles[row + 1] && tiles[row + 1][col - 1] === tile) ||
        (tiles[row + 1] && tiles[row + 1][col] === tile && tiles[row + 2] && tiles[row + 2][col] === tile && tiles[row + 1][col - 1] === tile) ||
        (tiles[row - 1] && tiles[row - 1][col] === tile && tiles[row - 2] && tiles[row - 2][col] === tile && tiles[row - 1][col - 1] === tile) ||
        (tiles[row][col + 1] === tile && tiles[row][col + 2] === tile && tiles[row - 1] && tiles[row - 1][col + 1] === tile) ||
        (tiles[row][col - 1] === tile && tiles[row][col - 2] === tile && tiles[row - 1] && tiles[row - 1][col - 1] === tile)
    );
}

function handleMatchedTiles(matchedTiles) {
    // Implement logic to handle matched tiles (e.g., remove them, update score, etc.)
}

// Add this function to your JavaScript file
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

function updateLevelDisplay() {
    document.getElementById('level-value').innerText = currentLevel;
}

function nextLevel() {
    currentLevel++;
    initializeGameBoard(currentTileType);
}

function showGameInfo() {
    document.getElementById('game-info-modal').style.display = 'block';
}

function closeGameInfo() {
    document.getElementById('game-info-modal').style.display = 'none';
}

toggleDarkMode();