const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));

// might have to define routes here
app.use(require('./middleware/error'));

module.exports = app;
