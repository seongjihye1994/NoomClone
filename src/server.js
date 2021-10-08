import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

wsServer.on("connection", (socket) => {
  socket.on("join_room", (roomName) => { // 요청한 방 이름으로 방 입장
    socket.join(roomName);
    socket.to(roomName).emit("welcome"); // 방에 welcome 이벤트 전달
  });
  socket.on("offer", (offer, roomName) => { // 시그널링 6. peer A의 offer와 roomName을 받고
    socket.to(roomName).emit("offer", offer); // peer B에게 peer A의 offer 전달
  });
  socket.on("answer", (answer, roomName) => { // 시그널링 12. peer B의 answer와 roomName을 받고
    socket.to(roomName).emit("answer", answer); // peer A에게 peer B의 answer 전달
  });
  socket.on("ice", (ice, roomName) => { // iceCandidate 3. peer 에게 전달받은 ice와 roomName을
    socket.to(roomName).emit("ice", ice); // 다른 peer 에게 전달
  });
});

const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);


