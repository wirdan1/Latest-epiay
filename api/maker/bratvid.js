// PLUGIN: BratVid Generator
// TYPE: CJS

const axios = require("axios");

async function generateBratVideo(text) {
  try {
    const params = new URLSearchParams();
    params.append("text", text);

    const response = await axios.get(
      `https://raolbyte-brat.hf.space/maker/bratvid?${params.toString()}`,
      {
        timeout: 60000,
        headers: {
          "User-Agent": "Raol-APIs/2.0.0",
        },
      }
    );

    // Ambil hanya video_url
    if (response.data && response.data.video_url) {
      return response.data.video_url;
    } else {
      throw new Error("Invalid response dari BRATVID API");
    }
  } catch (error) {
    console.error("Error generate BRAT video:", error);

    if (error.code === "ECONNABORTED") {
      throw new Error("Timeout - BRATVID API terlalu lama merespons");
    } else if (error.response) {
      throw new Error(`BRATVID API error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      throw new Error("Network error - Tidak bisa terhubung ke BRATVID API");
    } else {
      throw new Error(`BRATVID gagal: ${error.message}`);
    }
  }
}

module.exports = {
  name: "BratVid Generator",
  desc: "Buat video BRAT dari teks (tanpa warna/background)",
  category: "Maker",
  params: ["text"],
  async run(req, res) {
    try {
      const { text } = req.query;

      if (!text) {
        return res.status(400).json({
          status: false,
          error: "Parameter 'text' wajib diisi",
        });
      }

      if (text.length > 500) {
        return res.status(400).json({
          status: false,
          error: "Teks terlalu panjang (maksimum 500 karakter)",
        });
      }

      const bratvid = await generateBratVideo(text);

      return res.json({
        status: true,
        bratvid,
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        error: "Gagal membuat video BRAT",
        message: err.message,
      });
    }
  },
};
