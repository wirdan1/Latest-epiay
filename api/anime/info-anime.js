// PLUGIN: JADWAL ANIME RILIS
// TYPE: CJS

const fetch = require("node-fetch");

function convertTo24Hour(timeStr) {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
  if (!match) return timeStr;
  let [_, h, m, meridian] = match;
  h = parseInt(h, 10);
  if (meridian.toUpperCase() === "PM" && h < 12) h += 12;
  if (meridian.toUpperCase() === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${m}`;
}

function getTargetDate(hariIndo, input, wib) {
  let targetIndex = hariIndo.indexOf(input);
  if (targetIndex < 0) return wib;
  let nowIndex = wib.getDay();
  let diff = (targetIndex - nowIndex + 7) % 7;
  if (diff === 0) diff = 7;
  let targetDate = new Date(wib);
  targetDate.setDate(wib.getDate() + diff);
  return targetDate;
}

module.exports = {
  name: "Anime Schedule",
  desc: "Cek jadwal rilis anime berdasarkan hari",
  category: "Anime",
  params: ["day"],
  async run(req, res) {
    const hariIndo = [
      "minggu",
      "senin",
      "selasa",
      "rabu",
      "kamis",
      "jumat",
      "sabtu",
    ];

    const input = (req.query.day || "").toLowerCase();
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const wib = new Date(utc + 3600000 * 7);

    const targetDate = getTargetDate(hariIndo, input, wib);
    const tahun = targetDate.getFullYear();
    const bulan = String(targetDate.getMonth() + 1).padStart(2, "0");
    const tanggal = String(targetDate.getDate()).padStart(2, "0");
    const hariNow = hariIndo[targetDate.getDay()];

    const url = `https://izumiiiiiiii.dpdns.org/update/livechart?year=${tahun}&month=${bulan}&date=${tanggal}`;

    try {
      const response = await fetch(url);
      const json = await response.json();

      if (!json?.result?.length) {
        return res.status(404).json({
          status: false,
          message: `Tidak ada jadwal anime untuk ${tanggal}-${bulan}-${tahun}`,
        });
      }

      let found = json.result.find((x) =>
        x.day?.toLowerCase().includes(hariNow)
      );
      if (!found) found = json.result[0];

      if (!found?.anime?.length) {
        return res.status(404).json({
          status: false,
          message: `Tidak ada anime tayang hari ${hariNow}`,
        });
      }

      const jadwal = found.anime.map((a) => {
        if (!a.title) return null;
        const title = a.title.replace(/\s+/g, " ").trim();

        let eps = "-";
        if (a.eps) {
          const match = a.eps.match(/(\d+)/);
          if (match) eps = `EPISODE ${match[1]}`;
        }

        let jam = "-";
        if (a.time) jam = convertTo24Hour(a.time);

        return {
          title,
          episode: eps,
          time: `${jam} WIB`,
        };
      }).filter(Boolean);

      return res.json({
        status: true,
        hari: hariNow,
        tanggal: `${tanggal}-${bulan}-${tahun}`,
        jadwal,
      });
    } catch (err) {
      console.error("[Anime Schedule Error]", err);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data jadwal anime",
        message: err.message,
      });
    }
  },
};
