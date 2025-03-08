const express = require('express');
const request = require('request');
const cors = require('cors'); // Import CORS
const cheerio = require('cheerio'); // Add this dependency
const sharp = require('sharp');     // Add this dependency
const app = express();
const PORT = process.env.PORT || 3000;

// Use CORS middleware
app.use(cors());

async function fetchImage(url) {
    if (!url) return null;
    try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        
        // Check if the image is webp
        if (url.toLowerCase().endsWith('.webp')) {
            const convertedBuffer = await sharp(Buffer.from(buffer))
                .png()
                .toBuffer();
            return Buffer.from(convertedBuffer).toString('base64');
        }
        
        // Return other image formats as-is
        return Buffer.from(buffer).toString('base64');
    } catch (error) {
        console.error('Error fetching image:', error);
        return null;
    }
}

app.get('/fetch', async (req, res) => {
    const url = req.query.url;
    
    request(url, async (error, response, body) => {
        if (!error && response.statusCode === 200) {
            try {
                const $ = cheerio.load(body);
                
                // Parse metadata
                const metadata = {
                    title: $('title').text() || $('meta[property="og:title"]').attr('content') || '',
                    description: $('meta[name="description"]').attr('content') || 
                               $('meta[property="og:description"]').attr('content') || '',
                    coverImage: $('meta[property="og:image"]').attr('content') || '',
                    favicon: $('link[rel="icon"]').attr('href') || 
                            $('link[rel="shortcut icon"]').attr('href') || ''
                };

                // Convert relative URLs to absolute
                if (metadata.favicon && !metadata.favicon.startsWith('http')) {
                    metadata.favicon = new URL(metadata.favicon, url).href;
                }
                
                // Convert images if needed
                if (metadata.coverImage) {
                    metadata.coverImageBase64 = await fetchImage(metadata.coverImage);
                }
                if (metadata.favicon) {
                    metadata.faviconBase64 = await fetchImage(metadata.favicon);
                }

                res.json({
                    body,
                    metadata
                });
            } catch (err) {
                console.error('Error parsing metadata:', err);
                res.status(500).send('Error parsing metadata');
            }
        } else {
            res.status(500).send('Error fetching the URL');
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});