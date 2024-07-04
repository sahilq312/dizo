import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const PORT = 4000
const io = new Server({
    cors: {
      origin: "http://localhost:3000"
    }
  });


let shapes = [];


io.on("connection", (socket) => {
  socket.handshake("hello", ()=> {
    console.log("handshake is done");
  })
});

httpServer.listen(PORT, ()=>{
    console.log(`server has been started at localhost:${PORT}`);
});