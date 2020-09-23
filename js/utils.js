'use strict';



function renderTime(time) {
  var elTimer = document.querySelector('.timer');
  gTimeElapsed = new Date(time).toISOString().slice(14, -5);
  elTimer.innerText = 'Time: ' + gTimeElapsed;
}

// function resetInterface() {
// }

function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}