// PLUGIN: INFO IMEI
// TYPE: CJS

const axios = require("axios");

const KEYS = "f43f0d0c-27b0-408a-abd0-585fabea6adf";

async function cekImei(imei, opts = {}) {
  if (!imei) throw new Error("imei required");
  const timeoutMs = opts.timeoutMs || 10000;
  const url = `https://dash.imei.info/api/check/0/?imei=${encodeURIComponent(
    imei
  )}&API_KEY=${encodeURIComponent(KEYS)}`;

  const res = await axios.get(url, {
    headers: {
      Accept: "application/json, text/plain, */*",
      "User-Agent": "Gienetic/1.0.1",
    },
    timeout: timeoutMs,
  });

  if (res.status !== 200) throw new Error(`Unexpected status ${res.status}`);
  return res.data;
}

module.exports = {
  name: "IMEI Checker",
  desc: "Cek detail perangkat menggunakan nomor IMEI",
  category: "Tools",
  params: ["imei"],
  async run(req, res) {
    const { imei } = req.query;

    if (!imei) {
      return res.status(400).json({
        status: false,
        error: 'Parameter "imei" wajib diisi',
        example: "/api/imei?imei=123456789012345",
      });
    }

    if (!/^\d+$/.test(imei)) {
      return res.status(400).json({
        status: false,
        error: "IMEI hanya boleh angka!",
        input: imei,
      });
    }

    if (imei.length < 14 || imei.length > 16) {
      return res.status(400).json({
        status: false,
        error: "Panjang IMEI tidak valid! Harus 14–16 digit (umumnya 15).",
        input: imei,
        length: imei.length,
      });
    }

    try {
      let result = await cekImei(imei);
      let header = result.result?.header || {};
      let items = result.result?.items || [];

      const getVal = (title) =>
        items.find((v) =>
          v.title.toLowerCase().includes(title.toLowerCase())
        )?.content || "-";

      const cleaned = {
        device: {
          brand: header.brand || "-",
          model: header.model || "-",
          imei: header.imei || imei,
          photo: header.photo || null,
        },
        basic: {
          codeName: getVal("Code Name"),
          release: getVal("Relase Year"),
          os: getVal("Operating systems"),
          chipset: getVal("Chipset"),
          gpu: getVal("GPU"),
        },
        dimensions: {
          height: getVal("Height"),
          width: getVal("Width"),
          thickness: getVal("Thickness"),
        },
        display: {
          type: getVal("Display type"),
          resolution: getVal("Display "),
          diagonal: getVal("Diagonal "),
        },
        network: {
          "5G": getVal("5G"),
          "4G": getVal("4G"),
          "3G": getVal("3G"),
          "2G": getVal("2G"),
        },
        battery: {
          type: getVal("Type"),
          capacity: getVal("Capacity"),
        },
        camera: {
          main: getVal("Main"),
          selfie: getVal("Selfie"),
        },
        fullSpec: items.find((v) => v.title === "Full device specification")
          ?.content || "-",
      };

      return res.json({
        status: true,
        result: cleaned,
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        error: "Gagal cek IMEI",
        message: err.message,
      });
    }
  },
};
