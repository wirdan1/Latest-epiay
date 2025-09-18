const axios = require("axios");

module.exports = {
  name: "TextToImage",
  desc: "Mengubah teks menjadi gambar dengan Pollinations AI",
  category: "Tools",
  params: ["prompt"],
  async run(req, res) {
    const { prompt } = req.query;

    if (!prompt) {
      return res.status(400).json({
        status: false,
        message: "Parameter ?prompt= wajib diisi!",
      });
    }

    try {
      const seed =
        Date.now().toString() + Math.floor(Math.random() * 1e6).toString();
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        prompt
      )}?seed=${seed}&enhance=true&nologo=true&model=flux`;

      // ambil gambar langsung sebagai buffer
      const response = await axios.get(imageUrl, { responseType: "arraybuffer" });

      res.writeHead(200, {
        "Content-Type": response.headers["content-type"] || "image/png",
        "Content-Length": response.data.length,
      });
      res.end(response.data);

    } catch (error) {
      res.status(500).json({
        status: false,
        message: "Gagal menghasilkan gambar: " + error.message,
      });
    }
  },
};
