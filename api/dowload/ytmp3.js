const axios = require("axios");

module.exports = {
  name: "YTMP3",
  desc: "Download audio MP3 dari link YouTube",
  category: "Downloader",
  params: ["url"],
  async run(req, res) {
    const { url } = req.query;

    if (!url || !url.includes("youtu")) {
      return res.status(400).json({
        status: false,
        error: 'Parameter "url" wajib diisi dan harus link YouTube!'
      });
    }

    try {
      // Panggil API pihak ketiga
      const apiUrl = `https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(url)}`;
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (!data || data.status !== 200 || !data.result) {
        return res.status(500).json({
          status: false,
          error: "Gagal memproses permintaan."
        });
      }

      const result = data.result;

      // Ambil file audio dalam bentuk buffer
      const buffer = Buffer.from(
        (await axios.get(result.link, { responseType: "arraybuffer" })).data
      );

      // Info meta
      const meta = {
        title: result.title || "-",
        duration: result.duration || "-",
        size: result.filesize
          ? (result.filesize / 1024 / 1024).toFixed(2) + " MB"
          : "-",
        status: result.status || "-"
      };

      // Kirim hasil
      res.setHeader("Content-Type", "application/json");
      return res.json({
        status: true,
        meta,
        file: {
          fileName: `${result.title}.mp3`,
          mimeType: "audio/mpeg",
          size: buffer.length,
          base64: buffer.toString("base64") // kamu bisa kirim link download kalau mau, bukan base64
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses permintaan.",
        message: err.message
      });
    }
  }
};
