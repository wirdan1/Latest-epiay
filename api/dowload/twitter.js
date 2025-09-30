const axios = require("axios");
const querystring = require("querystring");

const CONFIG = {
  DEFAULT_FEATURES: {
    "responsive_web_graphql_exclude_directive_enabled": true,
    "creator_subscriptions_tweet_preview_api_enabled": true,
    "responsive_web_graphql_timeline_navigation_enabled": true,
    "view_counts_everywhere_api_enabled": true,
    "longform_notetweets_consumption_enabled": true,
    "responsive_web_twitter_article_tweet_consumption_enabled": true,
    "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
    "longform_notetweets_rich_text_read_enabled": true,
    "longform_notetweets_inline_media_enabled": true,
  },
  DEFAULT_VARIABLES: {
    withCommunity: false,
    includePromotedContent: false,
    withVoice: false,
    with_rux_injections: false,
  },
  HEADERS: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  },
  API_OPERATION_ID: "Vg2Akr5FzUmF0sTplA5k6g",
  MAX_RETRIES: 3,
};

const tokenCache = new Map();

const twitterHelper = {
  extractID: (url) => {
    const match = url.match(/(?<=status[s]?\/)\d+/);
    if (!match) throw new Error("Tidak ditemukan ID tweet. Pastikan URL benar.");
    return match[0];
  },

  fetchBearer: async (jsUrl) => {
    const { data: jsData } = await axios.get(jsUrl);
    const match = jsData.match(/:"Bearer ([a-zA-Z0-9%]+)"/);
    if (!match) throw new Error("Token Bearer tidak ditemukan.");
    return match[1];
  },

  fetchGuestToken: async (htmlContent) => {
    const match = htmlContent.match(/gt=(\d+)/);
    if (!match) throw new Error("Guest token tidak ditemukan.");
    return match[1];
  },

  getAuthenticationTokens: async (url) => {
    if (tokenCache.has(url)) return tokenCache.get(url);

    const { data: pageData } = await axios.get(url, { headers: CONFIG.HEADERS });
    const mainJsUrlMatch = pageData.match(
      /https:\/\/abs.twimg.com\/responsive-web\/client-web-legacy\/main\.[^\.]+\.js/
    );
    if (!mainJsUrlMatch) throw new Error("JS utama tidak ditemukan.");
    const mainJsUrl = mainJsUrlMatch[0];

    const bearerToken = await twitterHelper.fetchBearer(mainJsUrl);
    const guestToken = await twitterHelper.fetchGuestToken(pageData);

    const tokens = { bearer: bearerToken, guest: guestToken };
    tokenCache.set(url, tokens);
    return tokens;
  },

  generateApiUrl: (tweetId, features, variables) => {
    const variablesCopy = { ...variables, tweetId };
    return `https://api.x.com/graphql/${CONFIG.API_OPERATION_ID}/TweetResultByRestId?variables=${querystring.escape(
      JSON.stringify(variablesCopy)
    )}&features=${querystring.escape(JSON.stringify(features))}`;
  },

  updateConfigFromError: (errorData, currentFeatures, currentVariables) => {
    const varPattern = /Variable '([^']+)'/;
    const featPattern = /The following features cannot be null: ([^"]+)/;
    let updated = false;

    errorData?.errors?.forEach((error) => {
      if (!error?.message) return;
      const neededVars = error.message.match(varPattern);
      if (neededVars) {
        neededVars.slice(1).forEach((v) => {
          currentVariables[v] = true;
          updated = true;
        });
      }
      const neededFeatures = error.message.match(featPattern);
      if (neededFeatures) {
        neededFeatures[1].split(",").forEach((f) => {
          currentFeatures[f.trim()] = true;
          updated = true;
        });
      }
    });

    return updated;
  },

  fetchTweetDetailsWithRetry: async (tweetId, tokens) => {
    let features = { ...CONFIG.DEFAULT_FEATURES };
    let variables = { ...CONFIG.DEFAULT_VARIABLES };
    let details = null;

    for (let retry = 0; retry < CONFIG.MAX_RETRIES; retry++) {
      const url = twitterHelper.generateApiUrl(tweetId, features, variables);
      try {
        const { data, status } = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${tokens.bearer}`,
            "X-Guest-Token": tokens.guest,
            "Accept-Encoding": "gzip, deflate, br",
          },
        });
        if (status === 200 && data?.data?.tweetResult?.result) {
          details = data.data.tweetResult.result;
          break;
        } else throw new Error(`Status: ${status}`);
      } catch (err) {
        if (err.response?.status === 400 && err.response.data) {
          const updated = twitterHelper.updateConfigFromError(
            err.response.data,
            features,
            variables
          );
          if (updated && retry < CONFIG.MAX_RETRIES - 1) continue;
        }
        throw err;
      }
    }

    if (!details) throw new Error("Gagal mengambil data tweet setelah beberapa kali percobaan.");
    return details;
  },

  cleanseData: (rawData) => {
    const { core, legacy, views } = rawData;
    if (!core || !legacy || !views) throw new Error("Data tweet rusak.");

    const username = core.user_results.result.legacy.screen_name;
    const textContent = legacy.full_text.replace(/https:\/\/t\.co\/[a-zA-Z0-9_-]+\s*$/, "").trim();

    const media = legacy.entities?.media
      ?.map((m) => {
        if (m.type === "video" || m.type === "animated_gif") {
          const variants = m.video_info?.variants;
          if (variants && variants.length) {
            const mp4Variants = variants.filter(
              (v) => v.bitrate !== undefined && v.content_type.includes("video/mp4")
            );
            if (mp4Variants.length) {
              const highest = mp4Variants.reduce((p, c) => (c.bitrate > p.bitrate ? c : p), mp4Variants[0]);
              return {
                type: m.type === "video" ? "video" : "gif",
                thumbnail: m.media_url_https,
                url: highest.url,
                bitrate: highest.bitrate,
              };
            }
          }
          return null;
        } else if (m.type === "photo") {
          return { type: "image", url: `${m.media_url_https}?format=jpg&name=large` };
        }
        return null;
      })
      .filter(Boolean);

    return {
      authorUsername: username,
      text: textContent,
      stats: {
        likes: legacy.favorite_count,
        views: views.count,
        retweets: legacy.retweet_count,
      },
      mediaFiles: media,
      sensitive: legacy.possibly_sensitive,
    };
  },
};

module.exports = {
  name: "Twitter",
  desc: "Fetch tweet details and media by URL",
  category: "Downloader",
  params: ["url"],
  async run(req, res) {
    const { url } = req.query;

    if (!url || !url.includes("twitter.com")) {
      return res.status(400).json({
        status: false,
        error: 'Parameter "url" wajib diisi dan harus link tweet!',
      });
    }

    try {
      const tweetId = twitterHelper.extractID(url);
      const tokens = await twitterHelper.getAuthenticationTokens(url);
      const rawDetails = await twitterHelper.fetchTweetDetailsWithRetry(tweetId, tokens);
      const cleaned = twitterHelper.cleanseData(rawDetails);

      return res.json({
        status: true,
        result: cleaned,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil tweet.",
        message: err.message,
      });
    }
  },
};
