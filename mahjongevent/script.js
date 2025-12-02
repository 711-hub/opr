function prosesData() {
  const input = document.getElementById('inputData').value;
  const lines = input.split('\n').map(line => line.trim()).filter(line => line !== '');

  const grouped = {};
  let currentPeriode = '';
  let currentUser = '';
  let currentGame = '';

  // ==== VARIABEL UNTUK LOGIKA ALERT BONUS ====
  let totalCreditAll = 0;   // total semua credit
  let totalDebitAll = 0;    // total semua debit
  let jumlahBettingan = 0;  // jumlah bettingan (jumlah baris "Debit")

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // --- Deteksi nama game (baris sebelum "PGSoft")
    if (lines[i + 1] && lines[i + 1].toLowerCase().includes('pgsoft')) {
      currentGame = line;
    }

    // --- Deteksi Ext. ID
    if (line.toLowerCase().includes('ext. id')) {
      const match = line.match(/ext\. id\s*:\s*([a-z0-9\-]+)/i);
      if (match) {
        const parts = match[1].split('-');
        currentPeriode = parts[1] || match[1];

        if (!grouped[currentPeriode]) {
          grouped[currentPeriode] = {
            user: '',
            game: '',
            credit: 0,
            debit: 0
          };
        }

        // --- Ambil nama user (baris setelah Ext. ID)
        let possibleUser = lines[i + 1] || '';
        if (/^[a-zA-Z0-9_\-]+$/.test(possibleUser)) {
          currentUser = possibleUser;
        } else if (
          !possibleUser.includes(':') &&
          !/\d{2}\s\w{3}/.test(possibleUser)
        ) {
          currentUser = possibleUser.trim();
        }

        grouped[currentPeriode].user = currentUser;
        grouped[currentPeriode].game = currentGame;
      }
    }

    // --- Deteksi Credit
    if (line.toLowerCase().startsWith('credit')) {
      const nextLine = lines[i + 1] || '';
      const amount = parseInt(nextLine.replace(/[^\d]/g, ''), 10);
      if (!isNaN(amount) && grouped[currentPeriode]) {
        grouped[currentPeriode].credit += amount;

        // >>> TAMBAHAN UNTUK ALERT
        totalCreditAll += amount;
      }
    }

    // --- Deteksi Debit
    if (line.toLowerCase().startsWith('debit')) {
      const nextLine = lines[i + 1] || '';
      const amount = parseInt(nextLine.replace(/[^\d]/g, ''), 10);
      if (!isNaN(amount) && grouped[currentPeriode]) {
        grouped[currentPeriode].debit += amount;

        // >>> TAMBAHAN UNTUK ALERT
        totalDebitAll += amount;
        jumlahBettingan += 1;  // 1 baris "Debit" = 1 bettingan
      }
    }
  }

  // --- Format angka
  const formatKoma = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // --- Tampilkan tabel
  const table = document.getElementById('resultTable');
  const tbody = table.querySelector('tbody');
  tbody.innerHTML = '';
  table.style.display = 'table';

  Object.entries(grouped).forEach(([periode, data]) => {
    const selisih = data.credit - data.debit;
    const row = document.createElement('tr');

    const rowData = [
      data.user || '-',
      '-',
      '-',
      data.game || '-',
      periode || '-',
      formatKoma(data.credit),
      formatKoma(data.debit)
    ];

    row.innerHTML = rowData.map(col => `<td>${col}</td>`).join('');

    // Tombol salin
    const salinTd = document.createElement('td');
    const salinBtn = document.createElement('button');
    salinBtn.textContent = 'Salin';
    salinBtn.className = 'btn-table';
    salinBtn.onclick = () => {
      navigator.clipboard.writeText(rowData.join('\t'));
    };
    salinTd.appendChild(salinBtn);
    row.appendChild(salinTd);

    // Kolom selisih
    const selisihTd = document.createElement('td');
    selisihTd.textContent = formatKoma(selisih);
    row.appendChild(selisihTd);

    tbody.appendChild(row);
  });

  /* ============================================================
     🔥 LOGIKA ALERT BONUS (DIPERBAIKI, TETAP DI BAGIAN AKHIR)
     ============================================================ */

  const totalKemenangan = totalCreditAll - totalDebitAll;

  if (jumlahBettingan > 0) {
    const rataRata = totalKemenangan / jumlahBettingan;
    // console.log({ totalKemenangan, jumlahBettingan, rataRata }); // kalau mau cek
    if (rataRata >= 300) {
      showBonusAlert();
    }
  }
}



/* ============================================================
   🔥 SCRIPT BOX ALERT
   ============================================================ */

function showBonusAlert() {
  const el = document.getElementById('bonusAlert');
  if (el) {
    el.style.display = 'flex';
  }
}

function closeBonusAlert() {
  const el = document.getElementById('bonusAlert');
  if (el) {
    el.style.display = 'none';
  }
}
