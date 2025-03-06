
const express = require('express');
const request = require('request');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/fetch', (req, res) => {
    const url = req.query.url;
    request(url, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            res.send(body);
        } else {
            res.status(500).send('Error fetching the URL');
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});