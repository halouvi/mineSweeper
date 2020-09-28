'use strict';

const gLevelEasy = {
    name: 1,
    size: 4,
    mines: 2,
    champion: {
        name: localStorage.championNameEasy,
        time: localStorage.championTimeEasy
    }
}

const gLevelMedium = {
    name: 2,
    size: 8,
    mines: 12,
    champion: {
        name: localStorage.championNameMedium,
        time: localStorage.championTimeMedium
    }
}

const gLevelHard = {
    name: 3,
    size: 12,
    mines: 30,
    champion: {
        name: localStorage.championNameHard,
        time: localStorage.championTimeHard
    }
}

var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    lives: 3,
    hints: 3,
    safeClicks: 3,
    specialMode: 0,  //  0 = false --- 1 = reveal mode --- 2 = manual mode
    manualMinesToPlace: 0
}
var gUndoLog = [];
var gLevel = {};
var gBoard = [];
var gStopWatchInterval;
var gSecsPassed = 0;
var gCurrHint;
var gCurrSafe;
var gCellsToCheck = [];
var smiley = {
    normal: '🙂',
    win: '😎',
    mine: '🤯',
    dead: '💀'
}

const MINE_IMG = '<img src="imgs/mine.png" alt="Mine">';
const BOOM_IMG = '<img src="imgs/boom.png" alt="BOOM">';
const MARK_IMG = '<img src="imgs/mark.png" alt="Mark">';
const EMPTY = '';
const NOT_SHOWN = null;

const HINT = 'Hint';
const HINT_CLICKED = '-';

const SAFE = 'Safe';
const SAFE_CLICKED = '-';

const RED = '#A50000';
const YELLOW = '#919100';
const GREEN = '#027F00';
const CYAN = '#008B8B'
const SHOWN = '#294F59'

function init(level) {
    gLevel = level;
    gUndoLog = [];
    gSecsPassed = 0;
    gGame = {
        isOn: false,
        shownCount: 0,
        markedCount: 0,
        lives: 3,
        hints: 3,
        safeClicks: 3,
        specialMode: 0,
        manualMinesToPlace: 0
    }
    resetInterface()
    gBoard = buildBoard(gLevel.size)
    renderBoard()
}

function resetInterface() {
    clearInterval(gStopWatchInterval);
    renderTime(0);
    renderSmiley(smiley.normal);
    renderLivesCount();
    renderMinesCount(gLevel.mines);
    renderManualMode();
    renderMessage('MINE SWEEPER!!!');
    generateHints();
    generateSafeClicks();
    renderChampion(gLevel.champion)
}

function revealNegs(currPos) {
    for (var i = currPos.i - 1; i <= currPos.i + 1; i++) {
        if (i < 0 || i > gLevel.size - 1) continue;
        for (var j = currPos.j - 1; j <= currPos.j + 1; j++) {
            var currNeg = gBoard[i][j]
            var negPos = { i: i, j: j }

            if (j < 0 || j > gLevel.size - 1 ||
                currNeg.isMine || currNeg.isMarked ||
                negPos === currPos || currNeg.isShown) continue;

            currNeg.isShown = true
            gGame.shownCount++;

            if (currNeg.minesAround) renderCell(negPos, currNeg.minesAround, SHOWN);
            else if (!currNeg.minesAround) {
                gCellsToCheck.push(negPos);
                renderCell(negPos, EMPTY, SHOWN);
            }
        }
    }
    if (gCellsToCheck.length) {
        setTimeout(function () {
            revealNegs(gCellsToCheck.pop())
        }, 7)
    }
}

function cellClicked(ev, elCell) {
    var currPos = {
        i: +elCell.className.substring(9, elCell.className.indexOf('-')),
        j: +elCell.className.substring(elCell.className.indexOf('-') + 1)
    };
    var currCell = gBoard[currPos.i][currPos.j];

    if (ev.type === 'mouseup') {

        if (!gGame.isOn && !gGame.shownCount) {

            if (gGame.specialMode === 2 && gGame.manualMinesToPlace) {
                addToUndoLog()
                placeManualMines(currCell, currPos);
                return;
            }

            if (!gGame.specialMode) {
                placeRandomMines(currCell);
            }

            gGame.isOn = true;
            stopWatch();
        }

        if (gGame.isOn) {

            if (ev.button === 0) {

                if (currCell.isShown || currCell.isMarked) return;

                if (gGame.specialMode === 1) {
                    addToUndoLog();
                    hintReveal(currPos);
                    return;
                }

                addToUndoLog();
                currCell.isShown = true;
                gGame.shownCount++;

                if (currCell.isMine) {

                    if (gGame.lives > 1) {
                        gGame.lives--;
                        renderCell(currPos, MINE_IMG, RED);
                        renderSmiley(smiley.mine);
                        renderLivesCount();
                        setTimeout(function () {
                            currCell.isShown = false;
                            gGame.shownCount--;
                            renderSmiley(smiley.normal);
                            renderCell(currPos, NOT_SHOWN)
                        }, 1000);
                    } else {
                        gGame.lives--;
                        renderLivesCount();
                        renderCell(currPos, BOOM_IMG, RED);
                        gameFinished(currCell, false);
                    }
                    return;

                } else if (currCell.minesAround) {
                    renderCell(currPos, currCell.minesAround, SHOWN);
                    renderSmiley(smiley.normal);
                    checkVictory(currCell)
                    return;

                } else {
                    renderCell(currPos, EMPTY, SHOWN);
                    renderSmiley(smiley.normal);
                    revealNegs(currPos);
                    checkVictory(currCell)
                    return;
                }
            }

            else if (ev.button === 2) {

                if (currCell.isShown) return;

                addToUndoLog();

                if (!currCell.isMarked && gGame.markedCount < gLevel.mines) {
                    currCell.isMarked = true;
                    renderCell(currPos, MARK_IMG, YELLOW);
                    gGame.markedCount++;
                    if (gGame.markedCount === gLevel.mines) {
                        checkVictory();
                    }
                } else if (currCell.isMarked) {
                    currCell.isMarked = false;
                    renderCell(currPos, NOT_SHOWN);
                    gGame.markedCount--;
                }
                renderMinesCount(gLevel.mines - gGame.markedCount)
            }
        }
    }
    // if (ev.type === 'mousedown' && ev.button === 0)
    // if (ev.type === 'mousedown' && ev.button === 2)
}

function checkVictory(currCell) {
    if (gGame.markedCount + gGame.shownCount === Math.pow(gLevel.size, 2)) gameFinished(currCell, true);
}

function gameFinished(currCell, isWin) {
    clearInterval(gStopWatchInterval);
    renderBoard(currCell);
    gGame.isOn = false;
    if (isWin) {
        renderMessage('VICTORY');
        renderSmiley(smiley.win);
        setTimeout(function () {
            checkChampion(gSecsPassed)
        }, 100)
    } else {
        renderMessage('GAME OVER');
        renderSmiley(smiley.dead);
    }
}

function checkChampion(secsPassed) {
    var champion = {
        name: '',
        time: '',
    };
    switch (gLevel.name) {
        case 1:
            if (+localStorage.championTimeEasy <= secsPassed) {
                champion.name = localStorage.championNameEasy
                champion.time = localStorage.championTimeEasy
            } else {
                champion.name = localStorage.championNameEasy = prompt('YOU ARE THE NEW EASY LEVEL CHAMPION!\nPlease enter your name:')
                champion.time = localStorage.championTimeEasy = secsPassed;
            }
            break;
        case 2:
            if (+localStorage.championTimeMedium <= secsPassed) {
                champion.name = localStorage.championNameMedium
                champion.time = localStorage.championTimeMedium
            } else {
                champion.name = localStorage.championNameMedium = prompt('YOU ARE THE NEW MEDIUM LEVEL CHAMPION!\nPlease enter your name:')
                champion.time = localStorage.championTimeMedium = secsPassed;
            }
            break;
        case 3:
            if (+localStorage.championTimeHard <= secsPassed) {
                champion.name = localStorage.championNameHard;
                champion.time = localStorage.championTimeHard;
            } else {
                champion.name = championNameHard = prompt('YOU ARE THE NEW HARD LEVEL CHAMPION!\nPlease enter your name:')
                champion.time = localStorage.championTimeHard = secsPassed;
            }
            break;
    }
    gLevel.champion = champion;
    renderChampion(champion);
}