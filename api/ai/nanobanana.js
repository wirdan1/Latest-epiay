// PLUGIN: DeepFakeMaker Converter (URL or file)
// TYPE: CJS

const axios = require("axios");
const crypto = require("crypto");

// --- AuthGenerator (sama seperti versi sebelumnya) ---
class AuthGenerator {
  static #PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDa2oPxMZe71V4dw2r8rHWt59gH
W5INRmlhepe6GUanrHykqKdlIB4kcJiu8dHC/FJeppOXVoKz82pvwZCmSUrF/1yr
rnmUDjqUefDu8myjhcbio6CnG5TtQfwN2pz3g6yHkLgp8cFfyPSWwyOCMMMsTU9s
snOjvdDb4wiZI8x3UwIDAQAB
-----END PUBLIC KEY-----`;
  static #S = "NHGNy5YFz7HeFb";

  constructor(appId) {
    this.appId = appId;
  }

  aesEncrypt(data, key, iv) {
    const keyBuffer = Buffer.from(key, "utf8");
    const ivBuffer = Buffer.from(iv, "utf8");
    const cipher = crypto.createCipheriv("aes-128-cbc", keyBuffer, ivBuffer);
    let encrypted = cipher.update(data, "utf8", "base64");
    encrypted += cipher.final("base64");
    return encrypted;
  }

  generateRandomString(length) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const randomBytes = crypto.randomBytes(length);
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(randomBytes[i] % chars.length);
    }
    return result;
  }

  generate() {
    const t = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomUUID();
    const tempAesKey = this.generateRandomString(16);

    const encryptedData = crypto.publicEncrypt(
      {
        key: AuthGenerator.#PUBLIC_KEY,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(tempAesKey)
    );
    const secret_key = encryptedData.toString("base64");

    const dataToSign = `${this.appId}:${AuthGenerator.#S}:${t}:${nonce}:${secret_key}`;
    const sign = this.aesEncrypt(dataToSign, tempAesKey, tempAesKey);

    return {
      app_id: this.appId,
      t,
      nonce,
      sign,
      secret_key,
    };
  }
}

// --- core convert logic (same flow as original) ---
async function convertBufferToDeepFake(buffer, prompt) {
  const auth = new AuthGenerator("ai_df");
  const authData = auth.generate();
  const userId = auth.generateRandomString(64).toLowerCase();

  const headers = {
    "Access-Control-Allow-Credentials": "true",
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Android 15; Mobile; SM-F958; rv:130.0) Gecko/130.0 Firefox/130.0",
    Referer: "https://deepfakemaker.io/nano-banana-ai/",
  };

  const instance = axios.create({
    baseURL: "https://apiv1.deepfakemaker.io/api",
    params: authData,
    headers,
    timeout: 30000,
  });

  // 1) request upload-sign
  const file = await instance
    .post("/user/v2/upload-sign", {
      filename: auth.generateRandomString(32) + "_" + Date.now() + ".jpg",
      hash: crypto.createHash("sha256").update(buffer).digest("hex"),
      user_id: userId,
    })
    .then((i) => i.data);

  if (!file || !file.data || !file.data.url || !file.data.object_name) {
    throw new Error("Failed to obtain upload URL from API");
  }

  // 2) PUT the binary to provided URL
  await axios.put(file.data.url, buffer, {
    headers: {
      "content-type": "image/jpeg",
      "content-length": buffer.length,
    },
    maxBodyLength: Infinity,
    timeout: 60000,
  });

  // 3) create task
  const taskData = await instance
    .post("/replicate/v1/free/nano/banana/task", {
      prompt: prompt,
      platform: "nano_banana",
      images: ["https://cdn.deepfakemaker.io/" + file.data.object_name],
      output_format: "png",
      user_id: userId,
    })
    .then((i) => i.data);

  // 4) poll for result
  const progressUrl = await new Promise((resolve, reject) => {
    let retries = 25;
    const interval = setInterval(async () => {
      try {
        const xz = await instance
          .get("/replicate/v1/free/nano/banana/task", {
            params: {
              user_id: userId,
              ...taskData.data,
            },
          })
          .then((i) => i.data);

        if (xz && xz.msg === "success" && xz.data && xz.data.generate_url) {
          clearInterval(interval);
          resolve(xz.data.generate_url);
          return;
        }

        if (--retries <= 0) {
          clearInterval(interval);
          reject(new Error("Timeout waiting for task result"));
        }
      } catch (err) {
        clearInterval(interval);
        reject(err);
      }
    }, 2500);
  });

  return progressUrl; // URL to generated PNG
}

// --- helper: download image from url with basic validation ---
async function downloadImageFromUrl(url, maxBytes = 12 * 1024 * 1024) {
  // basic scheme check
  if (!/^https?:\/\//i.test(url)) throw new Error("Invalid URL scheme");

  // HEAD first to check content-type and length
  try {
    const head = await axios.head(url, { timeout: 10000 });
    const ctype = (head.headers["content-type"] || "").toLowerCase();
    if (!ctype.startsWith("image/")) {
      throw new Error("URL does not point to an image");
    }
    const clen = head.headers["content-length"] ? parseInt(head.headers["content-length"], 10) : null;
    if (clen && clen > maxBytes) {
      throw new Error("Image too large");
    }
  } catch (err) {
    // proceed to attempt download — some hosts disallow HEAD
    // but bubble up non-network errors
    if (err.response && err.response.status && err.response.status < 500) {
      throw err;
    }
  }

  // download
  const resp = await axios.get(url, { responseType: "arraybuffer", timeout: 60000, maxContentLength: maxBytes });
  return Buffer.from(resp.data);
}

// --- Plugin export (CJS) ---
module.exports = {
  name: "Nano banana",
  desc: "Konversi foto menjadi gambar AI (terima Upload file atau ?url=IMAGE_URL)",
  category: "Aiimage",
  params: ["file | url", "prompt"],
  async run(req, res) {
    try {
      // get prompt
      const prompt = (req.body?.prompt || req.query.prompt || "Convert this photo into a digital artwork.").toString();

      // obtain buffer from uploaded file or URL
      let buffer = null;
      if (req.files && req.files.file) {
        buffer = req.files.file.data;
      } else if (req.query && req.query.url) {
        const imageUrl = req.query.url.toString();
        buffer = await downloadImageFromUrl(imageUrl);
      } else {
        return res.status(400).json({ status: false, error: "Harus kirim file atau ?url=IMAGE_URL" });
      }

      // run convert flow
      const resultUrl = await convertBufferToDeepFake(buffer, prompt);

      // fetch generated image and return as PNG buffer
      const generatedResp = await axios.get(resultUrl, { responseType: "arraybuffer", timeout: 60000 });
      const pngBuffer = Buffer.from(generatedResp.data);

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Disposition", `inline; filename="deepfakemaker_${Date.now()}.png"`);
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.end(pngBuffer);
    } catch (err) {
      console.error("DeepFakeMaker Converter Error:", err && (err.stack || err.message) ? (err.stack || err.message) : err);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses",
        message: err.message || String(err),
      });
    }
  },
};
