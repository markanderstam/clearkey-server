'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const clearkey = require('./clearkey')

const app = express();
app.use(bodyParser.json());
app.set('json spaces', 2);

app.post('/get_content_key', (req, res) => {
    let request = req.body;
    try {
        let response = clearkey.getContentKey(request);
        res.json(response);
    }
    catch (e) {
        res.status(400).send({ error: e });
    }
})

app.post('/get_license', (req, res) => {
    let request = req.body;
    try {
        let response = clearkey.getLicense(request);
        res.json(response);
    }
    catch (e) {
        res.status(400).send({ error: e });
    }
})

module.exports = app
