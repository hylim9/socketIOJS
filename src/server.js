import http from "http";
// import WebSocket from "ws";
// import SocketIO from "socket.io";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import express from "express";

const app = express(); // http 서버

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on http://localhost:3000");
// app.listen(3000, handleListen);

// websocket 과 express 통합하여 서버 띄우기 (필요 시. 현재는 같은 포트에 둘다 띄우기 위해 server 생성 후 wss 에 넘겨주는 방식)
// create wss server on top of http server
const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});
instrument(wsServer, {
  auth: false,
});

// Public room 가져오기
function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  //   const sids = wsServer.sockets.adapter.sids;
  //   const rooms = wsServer.sockets.adapter.rooms;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
  socket["username"] = "-";
  socket.onAny((event) => {
    console.log(`Socket Event: ${event}`);
  });
  socket.on("enter_room", (roomName, userName, done) => {
    socket["username"] = userName;
    console.log(socket.id);
    socket.join(roomName);
    done();
    socket.to(roomName).emit("welcome", socket.username, countRoom(roomName));
    wsServer.sockets.emit("room_change", publicRooms()); // announce new room
    // setTimeout(() => {
    //   done();
    // }, 5000);
  });
  // 브라우저 종료 시
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) => {
      socket.to(room).emit("bye", socket.username, countRoom(room) - 1);
    });
  });
  // 새로 고침 시 방에서 이탈 (socket에는 연결되어 있는 상태)
  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms()); // announce room change (maybe room disappeared)
  });
  socket.on("new_message", (msg, roomName, done) => {
    socket.to(roomName).emit("new_message", `${socket.username}: ${msg}`);
    done(); // 화면에서 메세지 호출
  });
  //   socket.on("username", (username) => (socket["username"] = username));
});

// const wss = new WebSocket.Server({ server });
// const sockets = [];
// wss.on("connection", (socket) => {
//   sockets.push(socket);
//   socket["nickname"] = "-";
//   console.log("Connceted to Browser ✅ !!!!");
//   socket.on("close", () => console.log("Disconnected from the Brower !"));
//   socket.on("message", (msg) => {
//     // console.log(message.toString("utf8"));
//     const message = JSON.parse(msg);
//     switch (message.type) {
//       case "new_message":
//         sockets.forEach((aSocket) =>
//           aSocket.send(`${socket.nickname}: ${message.payload}`)
//         );
//         break;
//       case "nickname":
//         socket["nickname"] = message.payload;

//         break;
//     }
//   });
// });

httpServer.listen(3000, handleListen);
