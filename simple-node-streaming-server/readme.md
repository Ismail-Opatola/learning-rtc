# Requst Formation

## Browser

    <video src="/video" />

step 1 - Request Video

    Requset Headers {
      Request-URL: http://localhost:8000/video
      Requset Method:GET
      Range: bytes-0-
    }

## Server (NODE.JS)

step 2 - Returns partial content

Status: 206 Partial Content

    Response Headers {
      Accept-Rangers: bytes
      Content-Length: 1000001
      Content-Range: bytes 0-1000000/63614462
      Content-Type: video/mp4
    }

Then video player would recognise this response as incomplete video because of the gheaders and would start playing the video with what it has downloaded so far, as the mvideo cotinue to play, it lwould request the next chunk and the next chunk until the entire video is buffered into the player.

Pros - Easy to setup
Cons - Video Data is downloaded everytime you rewatch/fastforward/skip the video.
       You may need to cache the video then play from the cache to avoid this issue.
