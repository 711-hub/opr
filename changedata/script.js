function prosesData() {
  const input = document.getElementById("inputData").value;
  const lines = input.trim().split("\n");
  const userSet = new Set();

  lines.forEach(line => {
  const parts = line.split(/\t+/); // split tab atau tab ganda
  if (parts.length >= 6) {
    const operator = parts[2].toLowerCase();
    const keterangan = parts[4].trim().toLowerCase();
    const userId = parts[5].trim();

    // filter operator ks atau vip
    if (!operator.includes("ks") && !operator.includes("vip")) {
      // filter keterangan bank : atau rek :
      if (keterangan.includes("bank :") || keterangan.includes("rek :")) {
        userSet.add(userId);
      }
    }
  }
});


  const userList = Array.from(userSet);
  const output = userList.length > 0
    ? userList.map((id, i) => `${i + 1}. ${id}`).join("\n")
    : "Tidak ditemukan user ID yang cocok.";

  document.getElementById("output").textContent = output;
}

function resetSemua() {
  document.getElementById("inputData").value = "";
  document.getElementById("output").textContent = "Belum ada hasil...";
}
