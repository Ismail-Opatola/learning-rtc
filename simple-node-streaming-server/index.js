const express = require("express");
const fs = require("fs");
const app = express();

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/video", (req, res) => {
  const range = req.headers.range;
  if(!range) {
    res.status(400).send("Requires Range headers");
  }

  const videoPath = "sample.mp4";
  const videoSize = fs.statSync(videoPath).size; 

  // Parse Range 
  // Example: "bytes = 32324-endingbyte"
  const CHUNK_SIZE = 10 ** 6; // 1MB
  // parse the starting byte from the range header 
  // - which is originally a string
  // replace all the non-digit characters with this "" empty string
  // so we'ere juhyst left with the number string
  // convtert the string to number
  const start = Number(range.replace(/\D/g, "")); 
  // calculate the ending byte we're gonna send back
  // 
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
  
  const contentLength = end - start + 1;

  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  }

  res.writeHead(206, headers);

  const videoStream = fs.createReadStream(videoPath, {start, end});
  videoStream.pipe(res);
});

app.listen(8000, () => console.log("Listening on port 8000!")); 