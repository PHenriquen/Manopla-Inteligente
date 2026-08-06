const stateValue = document.getElementById('stateValue');
const gestureValue = document.getElementById('gestureValue');
const powerValue = document.getElementById('powerValue');
const feedbackText = document.getElementById('feedbackText');
const logList = document.getElementById('logList');
const powerButton = document.getElementById('powerButton');
const gestureSelect = document.getElementById('gestureSelect');
const ledRing = document.getElementById('ledRing');

function addLog(message) {
  const item = document.createElement('li');
  item.textContent = message;
  logList.prepend(item);
  if (logList.children.length > 6) {
    logList.removeChild(logList.lastChild);
  }
}

powerButton.addEventListener('click', () => {
  stateValue.textContent = 'Ativo';
  powerValue.textContent = '87%';
  feedbackText.textContent = 'Sistema ligado com feedback tátil ativado';
  addLog('Manopla ligada');
});

gestureSelect.addEventListener('change', (event) => {
  gestureValue.textContent = event.target.value;
  feedbackText.textContent = `Gesto detectado: ${event.target.value}`;
  addLog(`Gesto alterado para ${event.target.value}`);
});

addLog('Sistema inicializado');
addLog('Pronto para demonstração');
