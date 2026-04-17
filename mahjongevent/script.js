function showMainContent() {
  const initialView = document.getElementById('initialView');
  const mainContent = document.getElementById('mainContent');
  initialView.classList.add('hidden');
  setTimeout(() => { initialView.style.display = 'none'; mainContent.classList.add('visible'); }, 500);
}

function resetData() {
  document.getElementById('inputData').value = '';
  document.getElementById('resultTable').style.display = 'none';
  document.getElementById('warningMessage').style.display = 'none';
}

function prosesData() {
  const input = document.getElementById('inputData').value;

  if (input.trim() === '') {
    document.getElementById('warningMessage').style.display = 'block';
    return;
  }

  document.getElementById('warningMessage').style.display = 'none';

  const lines = input.split('\n').map(line => line.trim()).filter(line => line !== '');
  const grouped = {};
  let currentPeriode = '', currentUser = '', currentGame = '';
  let totalCreditAll = 0, totalDebitAll = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (lines[i + 1] && lines[i + 1].toLowerCase().includes('pgsoft')) { currentGame = line; }
    if (line.toLowerCase().includes('ext. id')) {
      const match = line.match(/ext\. id\s*:\s*([a-z0-9\-]+)/i);
      if (match) {
        const parts = match[1].split('-');
        currentPeriode = parts[1] || match[1];
        if (!grouped[currentPeriode]) { grouped[currentPeriode] = { user: '', game: '', credit: 0, debit: 0 }; }
        let possibleUser = lines[i + 1] || '';
        if (/^[a-zA-Z0-9_\-]+$/.test(possibleUser)) { currentUser = possibleUser; } 
        else if (!possibleUser.includes(':') && !/\d{2}\s\w{3}/.test(possibleUser)) { currentUser = possibleUser.trim(); }
        grouped[currentPeriode].user = currentUser;
        grouped[currentPeriode].game = currentGame;
      }
    }
    if (line.toLowerCase().startsWith('credit')) {
      const nextLine = lines[i + 1] || '';
      const amount = parseInt(nextLine.replace(/[^\d]/g, ''), 10);
      if (!isNaN(amount) && grouped[currentPeriode]) { grouped[currentPeriode].credit += amount; totalCreditAll += amount; }
    }
    if (line.toLowerCase().startsWith('debit')) {
      const nextLine = lines[i + 1] || '';
      const amount = parseInt(nextLine.replace(/[^\d]/g, ''), 10);
      if (!isNaN(amount) && grouped[currentPeriode]) { grouped[currentPeriode].debit += amount; totalDebitAll += amount; }
    }
  }

  const formatKoma = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const table = document.getElementById('resultTable');
  const tbody = table.querySelector('tbody');
  tbody.innerHTML = '';
  table.style.display = 'table';

  Object.entries(grouped).forEach(([periode, data]) => {
    const row = document.createElement('tr');
    const rowData = [data.user || '-', '-', '-', data.game || '-', periode || '-', formatKoma(data.credit), formatKoma(data.debit)];
    row.innerHTML = rowData.map(col => `<td>${col}</td>`).join('');
    const salinTd = document.createElement('td');
    const salinBtn = document.createElement('button');
    salinBtn.textContent = 'Salin'; salinBtn.className = 'btn-table';
    salinBtn.onclick = () => navigator.clipboard.writeText(rowData.join('\t'));
    salinTd.appendChild(salinBtn); row.appendChild(salinTd);
    tbody.appendChild(row);
  });

  const totalKemenangan = totalCreditAll - totalDebitAll;
  const totalTaruhan = totalDebitAll;
  if (totalTaruhan > 0 && totalKemenangan / totalTaruhan >= 300) {
    showBonusAlert();
  }
}

function showBonusAlert() {
  document.getElementById('bonusAlert').style.display = 'flex';
}

function closeBonusAlert() {
  document.getElementById('bonusAlert').style.display = 'none';
}
