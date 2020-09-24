'use strict';

var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    specialMode: 0  //  0 = false --- 1 = reveal mode --- 2 = manual mode
}

var gLevelEasy = {
    name: 1,
    size: 4,
    mines: 2,
    lives: 3,
    hints: 3,
    safeClicks: 3,
    champion: {
        name: localStorage.championNameEasy,
        time: localStorage.championTimeEasy
    }
}

var gLevelMedium = {
    name: 2,
    size: 8,
    mines: 12,
    lives: 3,
    hints: 3,
    safeClicks: 3,
    champion: {
        name: localStorage.championNameMedium,
        time: localStorage.championTimeMedium
    }
}

var gLevelHard = {
    name: 3,
    size: 12,
    mines: 30,
    lives: 3,
    hints: 3,
    safeClicks: 3,
    champion: {
        name: localStorage.championNameHard,
        time: localStorage.championTimeHard
    }
}

var gLevel = {};
var gBoard = [];
var gStopWatchInterval;

// const MINE = '@';
// const CLICKED_MINE = '#';
// const MARK = '+';
// const PRESSED = '*';
const MINE_IMG = '<img src="imgs/mine.png" alt="Mine">';
const BOOM_IMG = '<img src="imgs/boom.png" alt="BOOM">';
const MARK_IMG = '<img src="imgs/mark.png" alt="Mark">';
const EMPTY = '.';
const NOT_SHOWN = null;

const HINT = 'Hint'
const HINT_CLICKED = '-'

const SAFE = 'Safe'
const SAFE_CLICKED = '-'

const RED = '#A50000'
const YELLOW = '#919100'
const GREEN = '#027F00'
const BLANK = '#242526'

var smiley = {
    normal: '🙂',
    win: '😎',
    mine: '🤯',
    dead: '💀'
}

function init(level) {
    gLevel = level;
    gGame = {
        isOn: false,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
        specialMode: 0,
    }
    resetInterface()
    gBoard = buildBoard(gLevel.size)
    renderBoard(gBoard, '.container')
}

function resetInterface() {
    clearInterval(gStopWatchInterval);
    renderTime(0);
    renderSmiley(smiley.normal);
    renderLivesCount();
    renderMinesCount(gLevel.mines);
    renderMessage();
    generateHints();
    generateSafeClicks();
    renderChampion(gLevel.champion)
}

function minesInit(currCell) {
    placeRandomMines(currCell);
    setMinesNegsCount();
    renderBoard(gBoard, '.container', false);
}

function revealNegs(currPos) {
    for (var i = currPos.i - 1; i <= currPos.i + 1; i++) {
        if (i < 0 || i > gLevel.size - 1) continue;
        for (var j = currPos.j - 1; j <= currPos.j + 1; j++) {
            if (j < 0 || j > gLevel.size - 1) continue;
            var currNeg = gBoard[i][j]
            var negPos = [i, j]
            if (!currNeg.isShown && !currNeg.isMine && !currNeg.isMarked) {
                currNeg.isShown = true
                gGame.shownCount++;
                // revealNegs(negPos, currNeg)
            }
        }
    }
    renderBoard(gBoard, '.container', false)
}

function cellClicked(ev, elCell) {
    var currPos = {
        i: +elCell.className.substring(9, elCell.className.indexOf('-')),
        j: +elCell.className.substring(elCell.className.indexOf('-') + 1)
    };

    var currCell = gBoard[currPos.i][currPos.j];

    // if (gGame.specialMode === 2) {
    //     placeMines(currCell, currPos)
    //     return;
    // }
    // if (!gGame.isOn && gGame.specialMode === 0 && gGame.shownCount === 0) {
    if (!gGame.isOn && gGame.shownCount === 0) {
        minesInit(currCell)
        gGame.isOn = true;
        stopWatch();
    } else if (!gGame.isOn || currCell.isShown) return;

    if (gGame.specialMode === 1) {
        hintReveal(currPos);
        return;
    }

    if (ev.type === 'mouseup' && ev.button === 0) {
        if (currCell.isMarked) return;
        currCell.isShown = true;
        if (currCell.isMine) {
            if (gLevel.lives > 1) {
                gLevel.lives--;
                renderCell(currPos, MINE_IMG, YELLOW);
                renderSmiley(smiley.mine);
                setTimeout(function () {
                    currCell.isShown = false;
                    renderCell(currPos, NOT_SHOWN)
                    renderLivesCount();
                }, 1500);
                return
            } else {
                gLevel.lives--;
                renderLivesCount();
                renderCell(currPos, BOOM_IMG);
                gameFinished(false);
                return;
            }
        } else if (currCell.minesAround) {
            renderSmiley(smiley.normal);
            renderCell(currPos, currCell.minesAround);
            gGame.shownCount++;
            checkVictory()
        } else {
            gGame.shownCount++;
            renderSmiley(smiley.normal);
            revealNegs(currPos, currCell);
            checkVictory()
        }
    }

    if (ev.type === 'mouseup' && ev.button === 2) {
        if (!currCell.isMarked) {
            currCell.isMarked = true;
            renderCell(currPos, MARK_IMG);
            gGame.markedCount++;
            checkVictory()
            if (gGame.markedCount === gLevel.mines) checkVictory();
        } else if (currCell.isMarked) {
            currCell.isMarked = false;
            renderCell(currPos, NOT_SHOWN);
            gGame.markedCount--;
        }
        renderMinesCount(gLevel.mines - gGame.markedCount)
    }

    // if (ev.type === 'mousedown' && ev.button === 0)
    // if (ev.type === 'mousedown' && ev.button === 2)
}

function checkVictory() {
    if (gGame.markedCount + gGame.shownCount === Math.pow(gLevel.size, 2)) gameFinished(true);
}

function gameFinished(isWin) {
    clearInterval(gStopWatchInterval);
    gGame.isOn = false;
    renderBoard(gBoard, '.container', true);
    if (isWin) {
        renderMessage('VICTORY');
        renderSmiley(smiley.win);
        checkChampion(gGame.secsPassed)
    } else {
        renderMessage('GAME OVER');
        renderSmiley(smiley.dead);
    }
}

function checkChampion(secsPassed) {
    var newName;
    var champion = {
        name: '',
        time: '',
    };
    switch (gLevel.name) {
        case 1: // Easy Level Name
            if (+localStorage.championTimeEasy <= secsPassed) {
                champion.name = localStorage.championNameEasy
                champion.time = localStorage.championTimeEasy
                break;
            }
            newName = prompt('YOU ARE THE NEW EASY LEVEL CHAMPION!\nPlease enter your name:')
            champion.name = localStorage.championNameEasy = newName;
            champion.time = localStorage.championTimeEasy = secsPassed;
            break
        case 2: // Medium Level Name
            if (+localStorage.championTimeMedium <= secsPassed) {
                champion.name = localStorage.championNameMedium
                champion.time = localStorage.championTimeMedium
                break;
            }
            newName = prompt('YOU ARE THE NEW MEDIUM LEVEL CHAMPION!\nPlease enter your name:')
            champion.name = localStorage.championNameMedium = newName;
            champion.time = localStorage.championTimeMedium = secsPassed;
            break
        case 3: // Hard Level Name
            if (+localStorage.championTimeHard <= secsPassed) {
                champion.name = localStorage.championNameHard;
                champion.time = localStorage.championTimeHard;
                break;
            }
            newName = prompt('YOU ARE THE NEW HARD LEVEL CHAMPION!\nPlease enter your name:')
            champion.name = localStorage.championNameHard = newName;
            champion.time = localStorage.championTimeHard = secsPassed;
            break
    }
    renderChampion(champion);
}