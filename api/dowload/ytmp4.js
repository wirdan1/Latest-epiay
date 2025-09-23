const axios = require("axios");

module.exports = {
  name: "YTMP4",
  desc: "Download video MP4 dari link YouTube",
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
      const apiUrl = `https://api.yupra.my.id/api/downloader/ytmp4?url=${encodeURIComponent(
        url
      )}`;
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (!data || data.status !== 200 || !data.result) {
        return res.status(500).json({
          status: false,
          error: "Gagal memproses permintaan."
        });
      }

      const result = data.result;
      const formats = result.formats || [];

      // Ambil format utama (misalnya 360p / itag 18)
      const best = formats.find((f) => f.itag === 18) || formats[0];

      const meta = {
        title: result.title || "-",
        status: result.status || "-",
        availableFormats: formats.map((f) => ({
          itag: f.itag,
          quality: f.qualityLabel,
          mimeType: f.mimeType,
          sizeEstimate: f.bitrate
            ? (f.bitrate / 8 / 1024).toFixed(2) + " KB/s"
            : "-",
          url: f.url
        }))
      };

      res.setHeader("Content-Type", "application/json");
      return res.json({
        status: true,
        meta,
        download: {
          title: result.title || "video",
          url: best?.url,
          quality: best?.qualityLabel,
          mimeType: best?.mimeType
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
