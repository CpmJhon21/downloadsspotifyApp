// api/index.js
const axios = require('axios');
const cheerio = require('cheerio');

// Fungsi utama dari request Anda (sedikit disesuaikan untuk API Handler)
async function spotifydl(url) {
    try {
        // PERBAIKAN: Validasi URL agar menerima link spotify asli
        if (!url.includes('spotify.com')) throw new Error('Invalid Spotify URL.');
        
        const rynn = await axios.get('https://spotmate.online/', {
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(rynn.data);
        
        const api = axios.create({
            baseURL: 'https://spotmate.online',
            headers: {
                cookie: rynn.headers['set-cookie'].join('; '),
                'content-type': 'application/json',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'x-csrf-token': $('meta[name="csrf-token"]').attr('content')
            }
        });
        
        const [{ data: meta }, { data: dl }] = await Promise.all([
            api.post('/getTrackData', { spotify_url: url }),
            api.post('/convert', { urls: url })
        ]);
        
        return {
            status: true,
            title: meta.title || "Music Siap Download",
            artist: meta.artist || "Artist",
            cover: meta.cover || "",
            download_url: dl.url
        };
    } catch (error) {
        console.error(error);
        return { status: false, message: error.message };
    }
}

// Vercel Serverless Handler
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const result = await spotifydl(url);
        if (!result.status) {
            return res.status(500).json({ error: result.message });
        }
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
