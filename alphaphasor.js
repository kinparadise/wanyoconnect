document.getElementById('startButton').addEventListener('click', showTileTypeSelection);
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
const clickSound = document.getElementById('click-sound');
const matchSound = document.getElementById('match-sound');
const winSound = document.getElementById('win-sound');
const lossSound = document.getElementById('loss-sound');
const introSound = document.getElementById('intro-sound');
const gameOverModal = document.getElementById('game-over-modal');
const finalScoreElement = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');

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

function showTileTypeSelection() {
    document.getElementById('startMenu').style.display = 'none';
    document.getElementById('tileTypeSelection').style.display = 'block';
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

function loadTileImages(tileType) {
    const images = [];
    for (let i = 1; i <= 4; i++) {
        const img = new Image();
        img.src = `images/${tileType}_${i}.png`;
        images.push(img);
    }
    // Use these images in the game
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

function generateTiles() {
    const tileImages = [];
    for (let i = 0; i < 16; i++) { // 16 unique images
        tileImages.push(`images/tile${i}.png`);
    }
    const tileValues = [
        ...tileImages, ...tileImages // Duplicate for pairs
    ];
    tileValues.sort(() => Math.random() - 0.5);
    return tileValues.map(image => ({ image, matched: false }));
}

function renderTiles() {
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
    clearInterval(timer);
    timeLeft = 300; // 5 minutes
    score = 0;
    hintsUsed = 0;
    shufflesUsed = 0;
    isPaused = false;
    hintButton.disabled = false;
    shuffleButton.disabled = false;
    updateScore();
    timerElement.textContent = `Time: ${formatTime(timeLeft)}`;
    updateButtonLabels();
    displayHighScore();
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