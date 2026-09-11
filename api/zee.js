const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { segment } = req.query;
  let targetUrl = "http://103.89.248.130:8082/zee-bangla/index.m3u8";

  // .ts ভিডিও সেগমেন্টের জন্য
  if (segment) {
    targetUrl = `http://103.89.248.130:8082/zee-bangla/${segment}`;
  }

  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'http://103.89.248.130:8082/',
        'X-Forwarded-For': '103.89.248.1' // ISP IP Spoofing
      },
      responseType: 'text',
      timeout: 10000
    });

    let data = response.data;

    // .ts ও .m3u8 ফাইলগুলোকে প্রক্সির মাধ্যমে রিরুট করা
    if (!segment) {
      data = data.replace(/([a-zA-Z0-9_\-\.]+\.ts)/g, '/api/zee?segment=$1');
      data = data.replace(/([a-zA-Z0-9_\-\.]+\.m3u8)/g, '/api/zee?segment=$1');
    }

    return res.status(200).send(data);
  } catch (error) {
    return res.status(500).send("Proxy Stream Error: " + error.message);
  }
};
