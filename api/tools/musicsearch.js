// PLUGIN: Music Identifier
// TYPE: CJS

const axios = require("axios");
const FormData = require("form-data");

async function uploadAudio(buffer) {
  const form = new FormData();
  form.append("file", buffer, {
    filename: "lagu.mp3",
    contentType: "audio/mpeg",
  });

  const headers = {
    ...form.getHeaders(),
    "User-Agent": "Mozilla/5.0",
    "Origin": "https://www.aha-music.com",
    "Referer": "https://www.aha-music.com/",
  };

  // hitung Content-Length
  const contentLength = await new Promise((resolve, reject) => {
    form.getLength((err, length) => {
      if (err) reject(err);
      else resolve(length);
    });
  });
  headers["Content-Length"] = contentLength;

  // upload ke doreso
  const res = await axios.post("https://api.doreso.com/upload", form, {
    headers,
    maxBodyLength: Infinity,
  });

  // delay biar server proses
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // ambil hasil
  const hasil = await axios.get(`https://api.doreso.com/file/${res.data.data.id}`);
  return hasil.data;
}

module.exports = {
  name: "Music Identifier",
  desc: "Upload audio atau kirim URL untuk mengenali judul lagu",
  category: "Tools",
  params: ["file | url"],
  async run(req, res) {
    try {
      let buffer;

      if (req.files && req.files.file) {
        // mode upload file
        buffer = req.files.file.data;
      } else if (req.query.url) {
        // mode kirim URL
        const audioUrl = req.query.url;
        const resp = await axios.get(audioUrl, { responseType: "arraybuffer" });
        buffer = Buffer.from(resp.data);
      } else {
        return res.status(400).json({
          status: false,
          error: "Harus upload file audio atau sertakan ?url=https://...",
        });
      }

      const result = await uploadAudio(buffer);

      return res.json({
        status: true,
        result,
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        error: "Proses gagal",
        message: err.response?.data || err.message,
      });
    }
  },
};
