
function generateRandomNumber(length = 9) {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

  const tanggalElemen = document.getElementById("tanggal-sekarang");
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  tanggalElemen.textContent = formatter.format(now).toUpperCase();


const pasaranData = [
  { name: "DUBAI", tutup: "19:30 WIB", buka: "19:50 WIB", hari: "Buka Setiap Hari" },
  { name: "SYDNEY", tutup: "13:35 WIB", buka: "13:50 WIB", hari: "Buka Setiap Hari" },
  { name: "SINGAPORE", tutup: "17:30 WIB", buka: "17:40 WIB", hari: "Hari Selasa dan Jumat Libur" },
  { name: "HONGKONG", tutup: "22:45 WIB", buka: "23:00 WIB", hari: "Buka Setiap Hari" },
  { name: "PHNOMPENH-LOTTO", tutup: "11:35 WIB", buka: "11:50 WIB", hari: "Buka Setiap Hari" },
  { name: "TAIPEI", tutup: "21:00 WIB", buka: "21:15 WIB", hari: "Buka Setiap Hari" },
  { name: "SEOUL", tutup: "23:30 WIB", buka: "23:50 WIB", hari: "Buka Setiap Hari" },
  { name: "KINGKONG 4D SORE", tutup: "17:00 WIB", buka: "17:15 WIB", hari: "Buka Setiap Hari" },
  { name: "KINGKONG 4D MALAM", tutup: "23:30 WIB", buka: "23:45 WIB", hari: "Buka Setiap Hari" },
];

function calculateShio(num) {
  const shioMap = {
    Ular: ["01", "13", "25", "37", "49", "61", "73", "85", "97"],
    Naga: ["02", "14", "26", "38", "50", "62", "74", "86", "98"],
    Kelinci: ["03", "15", "27", "39", "51", "63", "75", "87", "99"],
    Harimau: ["04", "16", "28", "40", "52", "64", "76", "88", "00"],
    Kerbau: ["05", "17", "29", "41", "53", "65", "77", "89"],
    Tikus: ["06", "18", "30", "42", "54", "66", "78", "90"],
    Babi: ["07", "19", "31", "43", "55", "67", "79", "91"],
    Anjing: ["08", "20", "32", "44", "56", "68", "80", "92"],
    Ayam: ["09", "21", "33", "45", "57", "69", "81", "93"],
    Monyet: ["10", "22", "34", "46", "58", "70", "82", "94"],
    Kambing: ["11", "23", "35", "47", "59", "71", "83", "95"],
    Kuda: ["12", "24", "36", "48", "60", "72", "84", "96"]
  };

  const last2 = num.slice(-2);
  for (let key in shioMap) {
    if (shioMap[key].includes(last2)) return key;
  }
  return "-";
}


function copyToClipboard(columnId) {
  const column = document.getElementById(columnId);

  let textToCopy = "";
  const contentElements = column.querySelectorAll('h5');
  
  contentElements.forEach(element => {
    textToCopy += element.innerText + "\n"; 
  });

  const textArea = document.createElement("textarea");
  textArea.value = textToCopy.trim();
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

function processNumber(num) {
  const ai = num.slice(-4);
  const aiArray = ai.split('').sort(() => Math.random() - 0.5);
  const cb = aiArray.slice(0, 2).join('/');
  const cm = `${ai[0]}${ai[1]}/${ai[1]}${ai[2]}/${ai[2]}${ai[3]}`;
  const base = (num + num + num + num).split('').sort(() => Math.random() - 0.5).join('');
  const tempArr = [...new Set(base.match(/.{1,2}/g))].slice(0, 10);
  const bb = tempArr.join('');
  return { bbfs: num, ai, cb, cm, bb, shio: calculateShio(num) };
}

function generateAll() {
  const outputDiv = document.getElementById('output');
  outputDiv.innerHTML = '';

  const tgl = new Date();
  tgl.setDate(tgl.getDate());
  const tanggal = tgl.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

  pasaranData.forEach(p => {
    const data = processNumber(generateRandomNumber());
    const top10 = data.bb.match(/.{1,2}/g).map(val => val + "*").join(" ");
    const columnId = `column-${p.name}`;
    const html = `
      <div class="col-md-6">
        <div class="card p-3 shadow-sm" id="${columnId}">
          <h4>PREDIKSI Angka Jitu ${p.name}, ${tanggal}</h4>
          <h5>Jam Tutup : ${p.tutup}, Jam Buka : ${p.buka}</h5>
          <h5>${p.hari}</h5>
          <h5>Angka BBFS: ${data.bbfs}</h5>
          <h5>Angka Ikut: ${data.ai}</h5> 
          <h5>Colok Bebas: ${data.cb}</h5>
          <h5>Colok Macau: ${data.cm}</h5>
          <h5>Top 10 2D Bolak Balik:</h5>  
          <h5>${top10}</h5>
          <h5>Shio: ${data.shio}</h5>
          <button onclick="copyToClipboard('${columnId}')" class="btn-glass">Salin</button>
        </div>
      </div>
    `;
    outputDiv.innerHTML += html;
  });
}