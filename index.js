'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const clearkey = require('./clearkey')

const app = express();
app.use(bodyParser.json());

app.post('/get_content_key', (req, res) => {
    let request = req.body;
    let response = clearkey.getContentKey(request);
    res.json(response);
})

app.post('/get_license', (req, res) => {
    let request = req.body;
    let response = clearkey.getLicense(request);
    res.json(response);
})

app.listen(8000, () => {
    console.log('ClearKey Server listening on port 8000');
})
