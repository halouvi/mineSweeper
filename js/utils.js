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

function renderBoard(lastCellClicked) {
  // var strHTML = '<table class="board"><tbody oncontextmenu="return false;">';
  var strHTML = '<table><tbody>';
  for (var i = 0; i < gLevel.size; i++) {
    strHTML += '<tr>';
    for (var j = 0; j < gLevel.size; j++) {
      var className = 'cell' + i + '-' + j;
      strHTML += '<td class="cell ' + className + '" onmousedown="cellClicked(event, this)" onmouseup="cellClicked(event, this)"'
      if (gGame.isOn) {
        var currCell = gBoard[i][j];
        if (currCell.isMine && currCell.isMarked) strHTML += 'style="background-color:' + GREEN + '">' + MARK_IMG + '</td>';
        else if (!currCell.isMine && currCell.isMarked) strHTML += 'style="background-color:' + RED + '">' + MARK_IMG + '</td>';
        else if (currCell.isMine && currCell === lastCellClicked) strHTML += 'style="background-color:' + RED + '">' + BOOM_IMG + '</td>';
        else if (currCell.isMine && !currCell.isMarked) strHTML += 'style="background-color:' + YELLOW + '">' + MINE_IMG + '</td>';
        else if (currCell.minesAround && currCell.isShown) strHTML += 'style="background-color:' + SHOWN + '">' + currCell.minesAround + '</td>';
        else if (!currCell.minesAround && currCell.isShown) strHTML += 'style="background-color:' + SHOWN + '">' + EMPTY + '</td>';
        else if (currCell.minesAround) strHTML += '>' + currCell.minesAround + '</td>';
        else if (!currCell.minesAround) strHTML += '>' + EMPTY + '</td>';

      } else strHTML += '></td>';
    }
    strHTML += '</tr>'
  }
  strHTML += '</tbody></table>';
  var elContainer = document.querySelector('.board');
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
  if (gGame.isOn || gGame.specialMode === 2) {
    var elCurrCell = document.querySelector(`.cell${pos.i}-${pos.j}`);
    elCurrCell.innerHTML = value;
    if (bgColor) elCurrCell.style.backgroundColor = bgColor;
    else if (!bgColor) elCurrCell.style.removeProperty('background-color');
  }
}

function renderSmiley(nextSmiley) {
  var elSmiley = document.querySelector('.smiley');
  elSmiley.innerHTML = nextSmiley;
}

function renderLivesCount() {
  var elLives = document.querySelector('.lives');
  elLives.innerText = 'Lives: ' + gGame.lives;
}

function renderMinesCount(minesCount) {
  var elCounter = document.querySelector('.mines');
  elCounter.innerText = '| Mines: ' + minesCount;
}

function generateHints() {
  var elHints = document.querySelector('.hints')
  elHints.innerHTML = null;
  var htmlStr = '';
  for (var i = 0; i < gGame.hints; i++) {
    htmlStr += '<button class="hint" onclick="renderHint(this)">' + HINT + '</button>';
  }
  elHints.innerHTML += htmlStr
}

function generateSafeClicks() {
  var elSafeClicks = document.querySelector('.safe-clicks')
  elSafeClicks.innerHTML = null;
  var htmlStr = '';
  for (var i = 0; i < gGame.safeClicks; i++) {
    htmlStr += '<button class="safe" onclick="renderSafeClick(this)">' + SAFE + '</button>';
  }
  elSafeClicks.innerHTML += htmlStr
}

function renderHint(elHint) {
  if (!gCurrHint) gCurrHint = elHint;

  if (elHint !== gCurrHint) {
    gCurrHint.style.removeProperty('background-color');
    gCurrHint = elHint;
  }

  if (gCurrHint.innerHTML === HINT_CLICKED || !gGame.isOn) return;

  if (!gCurrHint.style.backgroundColor) {
    gGame.specialMode = 1;
    gCurrHint.style.backgroundColor = CYAN

  } else {
    gGame.hints--;
    gCurrHint.innerHTML = HINT_CLICKED;
    gCurrHint.style.removeProperty('background-color');
    gGame.specialMode = 0;
    gCurrHint = null;
  }
}

function initManualMode() {
  if (gGame.isOn) return;
  if (!gGame.specialMode) {
    gGame.manualMinesToPlace = JSON.parse(JSON.stringify(gLevel.mines))
    gGame.specialMode = 2;
  } else if (gGame.specialMode === 2) {
    gGame.manualMinesToPlace = 0;
    gGame.specialMode = 0;
  }
  renderManualMode()
}

function renderManualMode() {
  var elManual = document.querySelector('.manual button')
  gGame.specialMode === 2 ? elManual.style.backgroundColor = GREEN : elManual.style.removeProperty('background-color');
}

function placeManualMines(currCell, currPos) {

  if (currCell.isMine) return;

  if (gGame.manualMinesToPlace) {
    currCell.isMine = true;
    gGame.manualMinesToPlace--;
    renderCell(currPos, MINE_IMG, YELLOW)
    renderMinesCount(gGame.manualMinesToPlace)
  }
  if (!gGame.manualMinesToPlace) {
    setMinesNegsCount();
    setTimeout(function () {
      renderBoard();
      renderMinesCount(gLevel.mines)
    }, 500)
  }
}

function renderSafeClick(elSafeClick) {
  if (elSafeClick.innerHTML === SAFE_CLICKED || !gGame.isOn) return;
  if (gGame.isOn) addToUndoLog();
  gGame.safeClicks--;
  elSafeClick.innerHTML = SAFE_CLICKED;
  safeClick();
}

function renderMessage(message) {
  var elMessage = document.querySelector('h1');
  elMessage.innerText = message;
  // if (message) {
  // elMessage.style.display = 'inline';
  // } else elMessage.style.display = 'none';
}

function renderChampion(champion) {
  var elChampion = document.querySelector('.champion');
  if (!champion.name) champion.name = 'Almoni';
  if (!champion.time) elChampion.innerHTML = '&#8203';
  else elChampion.innerText = 'Champion: ' + champion.name + ' - ' + formatTime(+champion.time);
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
      gGame.shownCount++;
      var value = currCell.minesAround ? currCell.minesAround : EMPTY;
      renderCell(currPos, value, GREEN)
      count++
    }
    setTimeout(function () {
      currCell.isShown = false;
      gGame.shownCount--;
      renderCell(currPos, NOT_SHOWN)
    }, 500)
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
      gGame.shownCount++;
      if (currNeg.isMine) renderCell(negPos, MINE_IMG, YELLOW);
      else if (currNeg.minesAround) renderCell(negPos, currNeg.minesAround, GREEN);
      else if (!currNeg.minesAround) renderCell(negPos, EMPTY, GREEN);
    }
  }
  setTimeout(function () {
    for (var i = 0; i < negs.length; i++) {
      currNeg = gBoard[negs[i].i][negs[i].j];
      negPos = { i: negs[i].i, j: negs[i].j };
      currNeg.isShown = false;
      gGame.shownCount--;
      if (currNeg.isMarked) renderCell(negPos, MARK_IMG);
      else renderCell(negPos, NOT_SHOWN);
    }
    renderHint(gCurrHint);
  }, 250);
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
    gSecsPassed += 10;
    renderTime(gSecsPassed);
  }, 10);
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
  setMinesNegsCount();
}

function addToUndoLog() {
  var currLogEntry = {};
  currLogEntry.game = JSON.parse(JSON.stringify(gGame));
  currLogEntry.board = JSON.parse(JSON.stringify(gBoard));
  currLogEntry.interface = document.querySelector('.container').innerHTML;
  gUndoLog.push(currLogEntry);
}

function undo() {
  if (!gUndoLog[0]) {
    init(gLevel);
    return;
  }
  if (!gGame.isOn) stopWatch();
  var currLogEntry = gUndoLog.pop();
  gBoard = JSON.parse(JSON.stringify(currLogEntry.board));
  gGame = JSON.parse(JSON.stringify(currLogEntry.game));
  document.querySelector('.container').innerHTML = currLogEntry.interface;
}

function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}