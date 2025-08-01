function createSnowflake() {
  const snowflake = document.createElement('div');
  snowflake.classList.add('snowflake');
  snowflake.textContent = '❄';
  snowflake.style.left = Math.random() * window.innerWidth + 'px';
  snowflake.style.animationDuration = (4 + Math.random() * 6) + 's';
  snowflake.style.opacity = Math.random() * 0.6 + 0.2;
  snowflake.style.fontSize = (10 + Math.random() * 6) + 'px';
  document.body.appendChild(snowflake);
  setTimeout(() => snowflake.remove(), 10000);
}
setInterval(createSnowflake, 300);


const dropZone = document.getElementById("dropZone");
const resultTable = document.querySelector("#resultTable tbody");
const copyBtn = document.getElementById("copyBtn");
const resetBtn = document.getElementById("resetBtn");
const hiddenImg = document.getElementById("hiddenPreview");

function cleanName(name) {
  let cleaned = name.replace(/^[^A-Za-z]+/, '').replace(/[^A-Za-z\s]/g, '').replace(/\s+/g, ' ').trim();
  if (cleaned.toLowerCase().startsWith('e ') && cleaned.split(' ').length === 2) {
    cleaned = cleaned.substring(2).trim();
  }
  return cleaned;
}

function formatNominal(value) {
  return value.replace(/\./g, '').replace(/,/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

async function processImage(imageData) {
  const { data: { text } } = await Tesseract.recognize(imageData, 'eng', { logger: m => console.log(m) });
  const cleaned = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  resultTable.innerHTML = '';
  const blocks = cleaned.split(/(?=Rp[\s]?\d)/gi);
  blocks.forEach(block => {
    const nominalMatch = block.match(/Rp[\s]?([\d.,]+)/i);
    const nominalRaw = nominalMatch ? nominalMatch[1].replace(/[^\d.,]/g, '') : null;
    const nominal = nominalRaw ? formatNominal(nominalRaw) : null;
    const fromIndex = block.toLowerCase().indexOf('dari ');
    let name = '';
    if (fromIndex !== -1) {
      let afterFrom = block.substring(fromIndex + 5).split(/\s/).slice(0, 5).join(' ');
      afterFrom = afterFrom.replace(/(dengan|biaya|admin|\d{1,2}:\d{2}).*/i, '');
      name = cleanName(afterFrom);
    }
    if (nominal && name.length >= 3) {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${name}</td><td>${nominal}</td>`;
      resultTable.prepend(row); // ← Tambahkan ke atas
    }
  });

  hiddenImg.src = imageData;
  hiddenImg.style.display = 'block';
  copyBtn.disabled = false;
  resetBtn.disabled = false;
  dropZone.contentEditable = "false";
  dropZone.innerHTML = 'Klik atau Ctrl+V gambar mutasi di sini';
}

dropZone.addEventListener("paste", async (e) => {
  e.preventDefault();
  const items = e.clipboardData.items;
  for (const item of items) {
    if (item.type.indexOf("image") !== -1) {
      const file = item.getAsFile();
      const reader = new FileReader();
      reader.onload = async function(event) {
        hiddenImg.src = '';
        resultTable.innerHTML = '';
        await processImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  }
});

copyBtn.addEventListener("click", () => {
  let output = "";
  const rows = document.querySelectorAll("#resultTable tbody tr");
  rows.forEach(row => {
    const cols = row.querySelectorAll("td");
    output += `${cols[0].innerText}\t${cols[1].innerText}\n`;
  });
  const tempInput = document.createElement("textarea");
  tempInput.value = output.trim();
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy");
  document.body.removeChild(tempInput);
});

resetBtn.addEventListener("click", () => {
  resultTable.innerHTML = '';
  hiddenImg.src = '';
  hiddenImg.style.display = 'none';
  dropZone.innerHTML = 'Klik atau Ctrl+V gambar mutasi di sini';
  dropZone.contentEditable = "true";
  copyBtn.disabled = true;
  resetBtn.disabled = true;
});