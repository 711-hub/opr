function prosesData() {
  const input = document.getElementById("inputData").value;
  const lines = input.trim().split("\n");
  const userSet = new Set();

  lines.forEach(line => {
    const parts = line.split("\t");
    if (parts.length >= 6) {
      const operator = parts[2].toLowerCase();
      const keterangan = parts[4].trim().toLowerCase();
      const userId = parts[5].trim();

      if (keterangan.startsWith("bank :") && !operator.includes("ks")) {
        userSet.add(userId);
      }
    }
  });

  const output = Array.from(userSet).join("\n") || "Tidak ditemukan user ID yang cocok.";
  document.getElementById("output").textContent = output;
}

function resetSemua() {
  document.getElementById("inputData").value = "";
  document.getElementById("output").textContent = "Belum ada hasil...";
}

// Efek salju
function createSnowflake() {
  const snowflake = document.createElement("div");
  snowflake.className = "snowflake";
  snowflake.innerHTML = "❄";
  snowflake.style.left = Math.random() * window.innerWidth + "px";
  snowflake.style.fontSize = Math.random() * 10 + 10 + "px";
  snowflake.style.animationDuration = Math.random() * 5 + 5 + "s";
  document.body.appendChild(snowflake);
  setTimeout(() => snowflake.remove(), 10000);
}
setInterval(createSnowflake, 200);