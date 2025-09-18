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

      res.json({
        status: true,
        prompt,
        image: imageUrl,
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: "Gagal menghasilkan gambar: " + error.message,
      });
    }
  },
};
