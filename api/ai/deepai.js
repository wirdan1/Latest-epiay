// PLUGIN: DeepAI Tryit Caller
// TYPE: CJS
// NOTE: meniru perilaku generateTryitApiKey dari contoh (custom hash, nonstandard)

const fetch = require("node-fetch");
const FormData = require("form-data");

const DEFAULT_UA =
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36';

/**
 * generateTryitApiKey(userAgent)
 * - meniru implementasi custom hashing dari contoh (non-standard).
 * - menghasilkan string berbentuk: tryit-<random>-<hash>
 */
function generateTryitApiKey(userAgent) {
  const myrandomstr = Math.round(Math.random() * 100000000000).toString();

  // Implementation adapted from provided sample — a custom MD5-like routine.
  const myhashfunction = (function () {
    const a = [];
    for (let b = 0; b < 64; b++) {
      a[b] = Math.floor(4294967296 * Math.sin((b + 1) % Math.PI));
    }

    return function (c) {
      let d = 1732584193;
      let e = 4023233417;
      let f = -1732584194;
      let g = -4023233418;
      const state = [d, e, f, g];

      let l = unescape(encodeURI(c)) + "\u0080";
      let k = l.length;
      const len = --k;
      let cWords = Math.floor(len / 4) + 2;
      cWords = (cWords + 15) & ~15;
      const h = new Array(cWords).fill(0);

      h[cWords - 1] = 8 * len;
      for (let i = len; i >= 0; i--) {
        h[i >> 2] |= l.charCodeAt(i) << (8 * (i % 4));
      }

      let b = 0;
      while (b < cWords) {
        let A = state[0],
          B = state[1],
          C = state[2],
          D = state[3];

        for (let l2 = 0; l2 < 64; l2++) {
          let F, G;
          const chunkIndex =
            b +
            ([l2, 5 * l2 + 1, 3 * l2 + 5, 7 * l2][Math.floor(l2 / 16)] & 15);
          const word = h[chunkIndex] || 0;

          if (l2 < 16) {
            F = (B & C) | (~B & D);
            G = l2;
          } else if (l2 < 32) {
            F = (D & B) | (~D & C);
            G = (5 * l2 + 1) & 15;
          } else if (l2 < 48) {
            F = B ^ C ^ D;
            G = (3 * l2 + 5) & 15;
          } else {
            F = C ^ (B | ~D);
            G = (7 * l2) & 15;
          }

          const rotateLeft = (val, shift) =>
            (val << shift) | (val >>> (32 - shift));
          const roundConst = a[l2] >>> 0;
          const add = (A + F + roundConst + (word >>> 0)) >>> 0;

          const shifts = [
            7, 12, 17, 22, 5, 9, 14, 20,
            4, 11, 16, 23, 6, 10, 15, 21
          ];
          const shiftAmount = shifts[4 * Math.floor(l2 / 16) + (l2 % 4)];

          const newA = D;
          const newD = C;
          const newC = B;
          const newB = (B + rotateLeft(add, shiftAmount)) >>> 0;

          A = newA;
          B = newB;
          C = newC;
          D = newD;
        }

        state[0] = (state[0] + A) >>> 0;
        state[1] = (state[1] + B) >>> 0;
        state[2] = (state[2] + C) >>> 0;
        state[3] = (state[3] + D) >>> 0;
        b += 16;
      }

      let hex = "";
      for (let i = 0; i < 32; i++) {
        const byte = (state[Math.floor(i / 8)] >> (4 * (1 ^ i))) & 0xf;
        hex += byte.toString(16);
      }
      return hex.split("").reverse().join("");
    };
  })();

  const inner = myhashfunction(userAgent + myrandomstr + "hackers_become_a_little_stinkier_every_time_they_hack");
  const middle = myhashfunction(userAgent + inner);
  const outer = myhashfunction(userAgent + middle);
  const tryitApiKey = "tryit-" + myrandomstr + "-" + outer;
  return tryitApiKey;
}

/**
 * callDeepAI(message, userAgent)
 * - mengirim request ke endpoint yang disampaikan contoh.
 * - mengembalikan objek { statusCode, text } atau lempar error.
 */
async function callDeepAI(message = "hi", userAgent = DEFAULT_UA) {
  const apiKey = generateTryitApiKey(userAgent);

  const form = new FormData();
  form.append("chat_style", "gpt-chat");
  form.append("chatHistory", JSON.stringify([{ role: "user", content: message }]));
  form.append("model", "standard");
  form.append("hacker_is_stinky", "very_stinky");

  // gabungkan header form-data dengan header tambahan
  const headers = {
    ...form.getHeaders(),
    authority: "api.deepai.org",
    accept: "*/*",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "api-key": apiKey,
    "cache-control": "no-cache",
    origin: "https://deepai.org",
    pragma: "no-cache",
    "sec-ch-ua": '"Chromium";v="137", "Not/A)Brand";v="24"',
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "user-agent": userAgent,
  };

  const resp = await fetch("https://api.deepai.org/hacking_is_a_serious_crime", {
    method: "POST",
    headers,
    body: form,
  });

  const text = await resp.text();
  return { statusCode: resp.status, text, apiKey };
}

// === Plugin CJS export ===
module.exports = {
  name: "DeepAI Tryit",
  desc: "Panggil endpoint DeepAI tryit dengan kunci API generated (demo).",
  category: "Ai",
  params: ["message", "ua"],
  async run(req, res) {
    try {
      const message = (req.query.message || req.body?.message || "hi").toString();
      const userAgent = (req.query.ua || req.body?.ua || DEFAULT_UA).toString();

      const result = await callDeepAI(message, userAgent);

      return res.json({
        status: true,
        statusCode: result.statusCode,
        apiKey: result.apiKey,
        response: result.text,
      });
    } catch (err) {
      console.error("[DeepAI Tryit Error]", err && err.stack ? err.stack : err);
      return res.status(500).json({
        status: false,
        error: "Gagal memanggil DeepAI",
        message: err.message,
      });
    }
  },
};
