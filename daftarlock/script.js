function parseDateTime(dateTimeStr) {
  const [date, time] = dateTimeStr.split(' ');
  const [day, month, year] = date.split('-').map(Number);
  const [hour, min, sec] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hour, min, sec);
}

function processData() {
  const raw = document.getElementById("inputData").value.trim();
  const lines = raw.split("\n");
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  const userPernahLocked = new Set();
  const userLastStatus = {};

  lines.forEach(line => {
    const cols = line.split("\t");
    if (cols.length < 6) return;

    const fullTime = cols[1].trim();
    const tanggal = fullTime.split(" ")[0];
    const statusText = cols[4].trim();
    const statusLower = statusText.toLowerCase();
    const userID = cols[5].trim();
    const timestamp = parseDateTime(fullTime).getTime();

    if (statusLower.startsWith("locked")) {
      userPernahLocked.add(userID);
    }

    if (!userLastStatus[userID] || timestamp > userLastStatus[userID].timestamp) {
      userLastStatus[userID] = {
        tanggal,
        statusText,
        statusLower,
        userID,
        timestamp
      };
    }
  });

  const blacklist = [
    "marketing", "ref", "struk", "admin", "4d", "3d", "2d",
    "savety bet", "hantu", "ulang", "mkt", "edit", "addmin",
    "memilih", "gunakan", "bermain", "ivnest", "reeff", "daftar",
    "kembali", "invest", "penipu", "pulsa", "staff", "pakai id","pilih", "kalah", "resign"
  ];

  const warningKeywords = ["kosong", "form", "isi"];
  const today = new Date();
  today.setHours(0,0,0,0);

  let results = [];
  userPernahLocked.forEach(userID => {
    const last = userLastStatus[userID];
    if (!last) return;

    if (
      last.statusLower.startsWith("locked") &&
      blacklist.some(keyword => last.statusLower.includes(keyword))
    ) {
      return;
    }

    const lockedDate = parseDateTime(`${last.tanggal} 00:00:00`);
    const diffInDays = Math.floor((today - lockedDate) / (1000 * 60 * 60 * 24));
    let peringatanHTML = "";

    const isLocked = last.statusLower.startsWith("locked");
    const hasKeyword = warningKeywords.some(k => last.statusLower.includes(k));

    if (isLocked && (diffInDays >= 2 || (hasKeyword && diffInDays >= 1))) {
      peringatanHTML = '<span class="peringatan icon-warning">Buka sekarang!</span>';
    }

    results.push({
      tanggal: last.tanggal,
      status: last.statusText,
      userID: last.userID,
      unlocked: last.statusLower.startsWith("unlocked") ? '<span class="icon-check">Done buka</span>' : '',
      peringatan: peringatanHTML
    });
  });

  results.sort((a, b) => {
    if (a.unlocked === "" && b.unlocked !== "") return -1;
    if (a.unlocked !== "" && b.unlocked === "") return 1;
    return 0;
  });

  results.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.tanggal}</td>
      <td>${row.status}</td>
      <td>${row.userID}</td>
      <td>${row.unlocked}</td>
      <td>${row.peringatan}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("resultTable").style.display = results.length ? "table" : "none";

}





