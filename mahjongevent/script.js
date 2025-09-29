function prosesData() {
  const input = document.getElementById('inputData').value;
  const lines = input.split('\n').map(line => line.trim()).filter(line => line !== '');

  const grouped = {};
  let currentPeriode = '';
  let currentUser = '';
  let currentGame = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    
    if (lines[i+1] && lines[i+1].toLowerCase().includes('pgsoft')) {
      currentGame = line;
    }

    
    if (line.includes('Ext. ID')) {
      const match = line.match(/Ext\. ID\s*:\s*([0-9\-]+)/);
      if (match) {
        const parts = match[1].split('-');
        currentPeriode = parts[1];

        if (!grouped[currentPeriode]) {
          grouped[currentPeriode] = {
            user: '',
            game: '',
            credit: 0,
            debit: 0
          };
        }

        
        let possibleUser = lines[i+1] || '';
        if (/^[a-zA-Z0-9_]+$/.test(possibleUser)) {
          currentUser = possibleUser;
        }

        grouped[currentPeriode].user = currentUser;
        grouped[currentPeriode].game = currentGame;
      }
    }

    
    if (line.startsWith('Credit')) {
      const nextLine = lines[i + 1] || '';
      const amount = parseInt(nextLine.replace(/[^\d]/g, ''), 10);
      if (!isNaN(amount) && grouped[currentPeriode]) {
        grouped[currentPeriode].credit += amount;
      }
    }

    
    if (line.startsWith('Debit')) {
      const nextLine = lines[i + 1] || '';
      const amount = parseInt(nextLine.replace(/[^\d]/g, ''), 10);
      if (!isNaN(amount) && grouped[currentPeriode]) {
        grouped[currentPeriode].debit += amount;
      }
    }
  }

  const table = document.getElementById('resultTable');
  const tbody = table.querySelector('tbody');
  tbody.innerHTML = '';
  table.style.display = 'table';

  Object.entries(grouped).forEach(([periode, data]) => {
    const selisih = data.credit - data.debit;
    const row = document.createElement('tr');

    const rowData = [
      data.user,
      '',
      '',
      data.game,
      periode,
      data.credit.toString(),
      data.debit.toString()
    ];

    row.innerHTML = rowData.map(col => `<td>${col}</td>`).join('');

    const salinTd = document.createElement('td');
    const salinBtn = document.createElement('button');
    salinBtn.textContent = 'Salin';
    salinBtn.className = 'btn-table';

    salinBtn.onclick = () => {
      navigator.clipboard.writeText(rowData.join('\t'));
    };
    salinTd.appendChild(salinBtn);
    row.appendChild(salinTd);

    const selisihTd = document.createElement('td');
    selisihTd.textContent = selisih.toString();
    row.appendChild(selisihTd);

    tbody.appendChild(row);
  });
}
