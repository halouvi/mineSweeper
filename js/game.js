'use strict';


// var gBoard = [
//     [

//     ],
//     {

//         minesAroundCount: 4,
//         isShown: true,
//         isMine: false,
//         isMarked: true
//     }
// ];

var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0
}

var gLevelEasy = {
    size: 2,
    mines: 1
}

var gLevelMedium = {
    size: 8,
    mines: 12
}

var gLevelHard = {
    size: 12,
    mines: 30
}

var gLevel = {};
var gBoard = [];
var gStopWatchInterval;
var gTimeElapsed;

const MINE = '@';
const CLICKED_MINE = '#';
const FLAG = '+';
const EMPTY = '.';
const PRESSED = '*';
const NOT_SHOWN = '';

function init(level) {
    clearInterval(gStopWatchInterval);
    gGame.isOn = false;
    gLevel = level;
    renderTime(0);
    gBoard = buildBoard(gLevel.size)
    console.table(gBoard);
    renderBoard(gBoard, '.container')
}

function stopWatch() {
    var milSecElapsed = 0;
    gStopWatchInterval = setInterval(function () {
        milSecElapsed += 5;
        renderTime(milSecElapsed);
    }, 5);
}

function minesInit(currCell) {
    placeRandomMines(currCell);
    negsLoop(setMinesNegsCount);
    renderBoard(gBoard, '.container');
}

function buildBoard(size) {
    var board = [];
    for (var i = 0; i < size; i++) {
        board.push([]);
        for (var j = 0; j < size; j++) {
            board[i][j] = {
                minesAround: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
        }
    }
    return board;
}

function placeRandomMines(currCell) {
    var count = 0
    while (count < gLevel.mines) {
        var randomI = getRandomIntInclusive(0, (gLevel.size) - 1)
        var randomJ = getRandomIntInclusive(0, (gLevel.size) - 1)
        if (gBoard[randomI][randomJ] === currCell) continue;
        else {
            gBoard[randomI][randomJ].isMine = true;
            count++
        }
    }
}



function revealNegs(currPos, currCell) {
    for (var i = currPos[0] - 1; i <= currPos[0] + 1; i++) {
        if (i < 0 || i > gLevel.size - 1) continue;
        for (var j = currPos[1] - 1; j <= currPos[1] + 1; j++) {
            if (j < 0 || j > gLevel.size - 1) continue;
            var currNeg = gBoard[i][j]
            var negPos = [i, j]
            if (currNeg.isShown === false && currNeg.isMine === false) {
                currNeg.isShown = true
                gGame.shownCount++;
                // revealNegs(negPos, currNeg)
            }
        }
    }
    renderBoard(gBoard, '.container')
}

function negsLoop(func) {
    for (var i = 0; i < gLevel.size; i++) {
        for (var j = 0; j < gLevel.size; j++) {
            for (var k = i - 1; k <= i + 1; k++) {
                if (k < 0 || k > gLevel.size - 1) continue;
                for (var l = j - 1; l <= j + 1; l++) {
                    if (l < 0 || l > gLevel.size - 1) continue;
                    var currCell = gBoard[i][j];
                    var currNeg = gBoard[k][l];
                    if (func === setMinesNegsCount) setMinesNegsCount(currCell, currNeg);
                }
            }
        }
    }
}

function setMinesNegsCount(currCell, currNeg) {
    if (currNeg.isMine && currCell !== currNeg) currCell.minesAround++;
}

function renderBoard(board, selector) {
    var strHTML = '<table class="board"><tbody oncontextmenu="return false;">';
    for (var i = 0; i < gLevel.size; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < gLevel.size; j++) {
            var className = 'cell' + i + '-' + j;
            var currCell = board[i][j];
            strHTML += '<td class="cell ' + className + '" onmousedown="cellClicked(event)" onmouseup="cellClicked(event)">'
            if (currCell.isShown) {
                if (currCell.isMine) strHTML += MINE;
                else if (currCell.minesAround) strHTML += currCell.minesAround;
                else if (!currCell.minesAround) strHTML += EMPTY;
                else if (currCell.isMarked) strHTML += FLAG;
            }
            strHTML += '</td>';
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody></table>';
    var elContainer = document.querySelector(selector);
    elContainer.innerHTML = strHTML;
}

function renderCell(pos, value) {
    var elCell = document.querySelector(`.cell${pos[0]}-${pos[1]}`);
    elCell.innerHTML = value;
}

function cellClicked(ev) {
    var currPos = ev.target.className.match(/[0-9]/g).map(Number);
    var currCell = gBoard[currPos[0]][currPos[1]];

    if (!gGame.isOn) {
        minesInit(currCell)
        gGame.isOn = true;
        stopWatch();
    }
    if (currCell.isShown) return;

    if (ev.type === 'mousedown' && ev.button === 0) {
        if (currCell.isMarked) return;
        // renderCell(currPos, PRESSED)
        return;
    }

    if (ev.type === 'mouseup' && ev.button === 0) {
        if (currCell.isMarked) return;
        currCell.isShown = true;
        if (currCell.isMine) {
            gameFinished(false);
            renderCell(currPos, CLICKED_MINE);
        } else if (currCell.minesAround) {
            renderCell(currPos, currCell.minesAround);
            gGame.shownCount++;
            checkVictory()
        } else {
            gGame.shownCount++;
            revealNegs(currPos, currCell);
            checkVictory()
        }
    }
    if (ev.type === 'mousedown' && ev.button === 2);

    if (ev.type === 'mouseup' && ev.button === 2) {
        if (!currCell.isMarked) {
            currCell.isMarked = true;
            renderCell(currPos, FLAG);
            gGame.markedCount++;
            if (gGame.markedCount === gLevel.mines) checkVictory();
        } else if (currCell.isMarked) {
            currCell.isMarked = false;
            renderCell(currPos, NOT_SHOWN);
            gGame.markedCount--;
        }
        var elCounter = document.querySelector('.counter');
        elCounter.innerText = 'Mines Left: ' + (gLevel.mines - gGame.markedCount);
    }
}

function checkVictory() {
    if (gGame.markedCount + gGame.shownCount === Math.pow(gLevel.size, 2)) gameFinished(true);
}

// function checkVictory() {
//     for (var i = 0; i < gLevel.size; i++) {
//         for (var j = 0; j < gLevel.size; j++) {
//             var currCell = gBoard[i][j];
//             if (!currCell.isShown || !currCell.isMarked) return;
//             else gameFinished(true);
//         }
//     }
// }

function gameFinished(isWin) {
    clearInterval(gStopWatchInterval);
    gGame.isOn = false;
    // renderBoard(gBoard, '.container');
    var elMessage = document.querySelector('.message');
    if (isWin) {
        elMessage.innerText = 'VICTORY';

    } else {
        elMessage.innerText = 'GAME OVER';

    }
    elMessage.style.display = 'block';
}

function cellMarked(pos) {
    var currCell = gBoard[pos[0]][pos[1]];
    currCell.isMarked = true;
    renderCell(pos, FLAG)
}