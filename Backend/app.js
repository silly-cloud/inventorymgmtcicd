// ci: trigger full pipeline validation
const express = require('express')
const cors = require('cors')
const router = require('./Routes/router')

const app = express()

app.use(cors());
app.use(express.json());
app.use(router);

module.exports = app;
