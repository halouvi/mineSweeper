'use strict';

function buildBoard(size) {
  var board = [];
  for (var i = 0; i < size; i++) {
    board.push([]);
    for (var j = 0; j < size; j++) {
      board[i][j] = {
        minesAround: 0,
        isShown: false,
        isMine: false,
        isMarked: false,
      }
    }
  }
  return board;
}

function renderBoard(board, selector, gameOver) {
  var strHTML = '<table class="board"><tbody oncontextmenu="return false;">';
  for (var i = 0; i < gLevel.size; i++) {
    strHTML += '<tr>';
    for (var j = 0; j < gLevel.size; j++) {
      var className = 'cell' + i + '-' + j;
      var currCell = board[i][j];
      if (gameOver) {
        if ((currCell.isMarked && !currCell.isMine) ||                                      //false marking
          (currCell.isShown && currCell.isMine)) className += '" id="red"'    //mine user clicked on
        if (currCell.isMarked && currCell.isMine) className += '" id="green"'   //correct marking
        if (currCell.isMine && gameOver) className += '" id="yellow"'                       //mines
      }
      strHTML += '<td class="cell ' + className + '" onmousedown="cellClicked(event, this)" onmouseup="cellClicked(event, this)">'
      if (gameOver) {
        if (currCell.isMarked && !currCell.isMine) {        //false marking
          strHTML += MARK_IMG;
        } else if (currCell.isMine && currCell.isShown) {   //mine user clicked on
          strHTML += BOOM_IMG;
        } else if (currCell.isMine && currCell.isMarked) {  //correct marking
          strHTML += MARK_IMG;
        } else if (currCell.isMine) {                       //mines
          strHTML += MINE_IMG;
        } else if (currCell.minesAround) {                  //numbers
          strHTML += currCell.minesAround;
        } else if (!currCell.minesAround) {                 //empty cells
          strHTML += EMPTY;
        }
      } else if (currCell.isShown) {
        if (currCell.isMine) {
          strHTML += MINE_IMG;
        } else if (currCell.minesAround) {
          strHTML += currCell.minesAround;
        } else if (!currCell.minesAround) {
          strHTML += EMPTY;
        }
      } else if (currCell.isMarked) strHTML += MARK_IMG;
      strHTML += '</td>';
    }
    strHTML += '</tr>'
  }
  strHTML += '</tbody></table>';
  var elContainer = document.querySelector(selector);
  elContainer.innerHTML = strHTML;
}

function formatTime(time) {
  return new Date(time).toISOString().slice(14, -5);
}

function renderTime(time) {
  var elTimer = document.querySelector('.timer');
  elTimer.innerText = 'Time: ' + formatTime(time);
  return;
}

function renderCell(pos, value, bgColor) {
  if (gGame.isOn) {
    var elCurrCell = document.querySelector(`.cell${pos.i}-${pos.j}`);
    elCurrCell.innerHTML = value;
    if (bgColor) elCurrCell.style.backgroundColor = bgColor;
    else if (!bgColor) elCurrCell.style.backgroundColor = BLANK;
  }
}

function renderSmiley(nextSmiley) {
  var elSmiley = document.querySelector('.smiley');
  elSmiley.innerHTML = nextSmiley;
}

function renderLivesCount() {
  var elLives = document.querySelector('.lives');
  elLives.innerText = 'Lives: ' + gLevel.lives;
}

function renderMinesCount(minesCount) {
  var elCounter = document.querySelector('.mines');
  elCounter.innerText = 'Mines: ' + minesCount;
}

function generateHints() {
  var elHints = document.querySelector('.hints')
  elHints.innerHTML = null;
  var htmlStr = '';
  for (var i = 0; i < gLevel.hints; i++) {
    htmlStr += '<button class="button hint" onclick="renderHint(this)">' + HINT + '</button>';
  }
  elHints.innerHTML += htmlStr
}

function generateSafeClicks() {
  var elSafeClicks = document.querySelector('.safe-clicks')
  elSafeClicks.innerHTML = null;
  var htmlStr = '';
  for (var i = 0; i < gLevel.safeClicks; i++) {
    htmlStr += '<button class="button safe" onclick="renderSafeClick(this)">' + SAFE + '</button>';
  }
  elSafeClicks.innerHTML += htmlStr
}

function renderHint(elHint) {
  if (elHint.innerHTML === HINT_CLICKED || !gGame.isOn) return;
  gLevel.hints--;
  elHint.innerHTML = HINT_CLICKED;
  gGame.specialMode = 1;
}

// function renderManualMode() {
//   if (elManual.innerHTML === HINT_CLICKED || !gGame.isOn) return;gLevel.hints--;
//   elManual.innerHTML = HINT_CLICKED;
//   gGame.specialMode = 2;
  
// }

// function placeMines(currCell, currPos) {
//   debugger;
//   var mines = gLevel.mines;
//   if (mines) {
//     currCell.isMine = true;
//     renderCell(currPos, MINE_IMG, YELLOW)
//     gLevel.mines--;
//     renderMinesCount(mines)
//   } else game.specialMode = 0;
// }

function renderSafeClick(elSafeClick) {
  if (elSafeClick.innerHTML === SAFE_CLICKED || !gGame.isOn) return;
  gLevel.safeClicks--;
  elSafeClick.innerHTML = SAFE_CLICKED;
  safeClick();

}

function renderMessage(message) {
  var elMessage = document.querySelector('.message');
  if (message) {
    elMessage.style.display = 'inline';
    elMessage.innerText = message;
  } else elMessage.style.display = 'none';
}

function renderChampion(champion) {
  var elChampion = document.querySelector('.champion');
  if (champion.time) elChampion.innerText = champion.name + ' ' + formatTime(+champion.time);
}

function safeClick() {
  var count = 0;
  while (count < 1) {
    var randomI = getRandomIntInclusive(0, (gLevel.size) - 1)
    var randomJ = getRandomIntInclusive(0, (gLevel.size) - 1)
    var currCell = gBoard[randomI][randomJ]
    var currPos = { i: randomI, j: randomJ }
    if (currCell.isShown || currCell.isMarked || currCell.isMine) continue;
    else {
      currCell.isShown = true;
      var value = currCell.minesAround ? currCell.minesAround : EMPTY;
      renderCell(currPos, value, GREEN)
      count++
    }
    setTimeout(function () {
      currCell.isShown = false;
      renderCell(currPos, NOT_SHOWN, BLANK)
    }, 1500)
  }
}

function hintReveal(currPos) {
  var currNeg;
  var negPos = {};
  var negs = []
  for (var k = currPos.i - 1; k <= currPos.i + 1; k++) {
    if (k < 0 || k > gLevel.size - 1) continue;
    for (var l = currPos.j - 1; l <= currPos.j + 1; l++) {
      currNeg = gBoard[k][l];
      negPos = { i: k, j: l };
      if (l < 0 || l > gLevel.size - 1 || currNeg.isShown) continue;
      negs.push(negPos)
      currNeg.isShown = true;
      if (currNeg.isMine) renderCell(negPos, MINE_IMG);
      else if (currNeg.minesAround) renderCell(negPos, currNeg.minesAround);
      else if (!currNeg.minesAround) renderCell(negPos, EMPTY);

    }
  }
  setTimeout(function () {
    for (var i = 0; i < negs.length; i++) {
      currNeg = gBoard[negs[i].i][negs[i].j];
      negPos = { i: negs[i].i, j: negs[i].j };
      currNeg.isShown = false;
      gGame.specialMode = 0
      if (currNeg.isMarked) renderCell(negPos, MARK_IMG);
      else renderCell(negPos, NOT_SHOWN);
    }
  }, 500);
}

function setMinesNegsCount() {
  for (var i = 0; i < gLevel.size; i++) {
    for (var j = 0; j < gLevel.size; j++) {
      for (var k = i - 1; k <= i + 1; k++) {
        if (k < 0 || k > gLevel.size - 1) continue;
        for (var l = j - 1; l <= j + 1; l++) {
          if (l < 0 || l > gLevel.size - 1) continue;
          var currCell = gBoard[i][j];
          var currNeg = gBoard[k][l];
          if (currNeg.isMine && !currNeg.isMarked && currCell !== currNeg) currCell.minesAround++;
        }
      }
    }
  }
}

function stopWatch() {
  gStopWatchInterval = setInterval(function () {
    gGame.secsPassed += 1000;
    renderTime(gGame.secsPassed);
  }, 1000);
}

function placeRandomMines(currCell) {
  var count = 0
  while (count < gLevel.mines) {
    var randomI = getRandomIntInclusive(0, (gLevel.size) - 1)
    var randomJ = getRandomIntInclusive(0, (gLevel.size) - 1)
    var currMine = gBoard[randomI][randomJ]
    if ((currMine === currCell) || currMine.isMine) continue;
    else {
      currMine.isMine = true;
      count++
    }
  }
}

function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}