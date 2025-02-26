const express = require("express");
const serverless = require("serverless-http"); // Add this package
const app = express();

// Your existing Express routes
app.get("/", (req, res) => {
  res.send("Hello from Netlify Functions!");
});

// Export the app as a serverless function
module.exports.handler = serverless(app);