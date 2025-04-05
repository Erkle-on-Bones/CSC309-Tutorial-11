const express = require("express");
const routes = require("./routes");
const cors = require('cors');
require('dotenv').config();

const app = express();

// Load frontend URL from environment or fallback to localhost
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Configure CORS with allowed origin
const corsOptions = {
  origin: FRONTEND_URL,
  credentials: true // This is to allow cookies or auth headers
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('', routes);

module.exports = app;