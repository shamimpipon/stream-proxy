const axios = require('axios');

module.exports = async (req, res) => {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // রিকোয়েস্ট করা সাব-পাথ (Default: index.m3u8)
  const subPath = req.query.path || 'index.m3u8';
  const targetUrl = `http://103.89.248.130:8082/zee-bangla/${subPath}`;

  try {
    const isM3u8 = subPath.endsWith('.m3u8') || subPath === 'index.m3u8';

    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'http://103.89.248.130:8082/',
        'X-Forwarded-For': '103.89.248.1'
      },
      responseType: isM3u8 ? 'text' : 'arraybuffer',
      timeout: 10000
    });

    if (isM3u8) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      let body = response.data;

      // সাব-ডিরেক্টরি পাথ বের করা (যেমন: tracks-v1a1/)
      const lastSlash = subPath.lastIndexOf('/');
      const baseDir = lastSlash !== -1 ? subPath.substring(0, lastSlash + 1) : '';

      // প্লেলিস্টের ভেতরের প্রতিটি সাব-প্লেলিস্ট ও .ts লিঙ্ককে প্রক্সিতে রিরুট করা
      const lines = body.split('\n');
      const rewrittenLines = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          return line;
        }
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          return `/api/zee?path=${encodeURIComponent(trimmed)}`;
        }
        const fullRelativePath = baseDir + trimmed;
        return `/api/zee?path=${encodeURIComponent(fullRelativePath)}`;
      });

      return res.status(200).send(rewrittenLines.join('\n'));
    } else {
      // ভিডিও সেগমেন্ট (.ts file) স্ট্রিম করা
      res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp2t');
      return res.status(200).send(response.data);
    }
  } catch (error) {
    return res.status(500).send("Proxy Stream Error: " + error.message);
  }
};
