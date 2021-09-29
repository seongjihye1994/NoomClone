import http from "http";
// import WebSocket from "ws";
import express from "express";
import SocketIO from "socket.io";

const app = express();

app.set("PORT", process.env.PORT || 3000);
app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:${ app.get("PORT") }`);

const httpServer = http.createServer(app);
// const wss = new WebSocket.Server({ server });
const wsServer = SocketIO(httpServer);

// 방 갯수 count
// public rooms를 리턴하는 함수
function publicRooms() {
    const { 
        sockets : { // 소켓으로 들어가서
            adapter : { sids, rooms }, // 어답터를 가지고 sids와 rooms를 가져옴
        },
    } = wsServer; // wsServer 안에서
    // wsServer.sockets.adapter를 이용해 sids와 rooms를 가져옴

    // public rooms list 만들기
    const publicRooms = [];
    rooms.forEach((_, key) => { // value 상관 x
        if (sids.get(key) === undefined) { // 방이 public 이라면
            publicRooms.push(key); // 배열에 저장
        }
    });
    return publicRooms;
}

// 클라이언트 갯수 카운트
function countRoom(roomName) {
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}


// 브라우저와 서버의 socketIO 커넥션 준비
wsServer.on("connection", (socket) => {
    // wsServer.socketsJoin("announcement"); // socket이 연결되어 있을 때 모든 socket이 announcement 방에 강제로 들어가게 함
    socket["nickname"] = "Anon";

    // 어떤 이벤트던 console.log 가능하게 해주는 onAny 함수
    socket.onAny((event) => {
        console.log(`Socket Event: ${ event }`); // -> Socket Event: enter_room
    });

    socket.on("enter_room", (roomName, done) => { // 브라우저에서 emit으로 보낸 이벤트를 받음
        socket.join(roomName); // socket이 기본적으로 제공하는 room을 만드는 함수 >> join(룸명)
        done();
        socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName)); // welcome 이벤트를 나를 제외한 룸 안에 있는 모든 사용자에게 전송 -> 하나의 소켓에 메시지 전송
        wsServer.sockets.emit("room_change", publicRooms()); // room_change의 payload는 publicRooms() 가 반환하는 public room 갯수 -> app에 있는 모든 소켓에 메시지 전송
        
        // disconnecting 이벤트가 전달(브라우저가 꺼지면)되면 socket에 있는 모든 사용자에게 반복문 돌리며 bye 이벤트 전달
        socket.on("disconnecting", () => { // disconnecting은 socket에 내장된 이벤트
            socket.rooms.forEach((room) => 
                socket.to(room).emit("bye", socket.nickname, countRoom(room) -1)
            );
        });
        socket.on("disconnect", () => {
            wsServer.sockets.emit("room_change", publicRooms());
        });

        socket.on("new_message", (msg, room, done) => { // 새 메시지를 전달받는 new_message 이벤트 인자와, 메시지 내용, 메시지 뿌려줄 방이름, done 콜백함수 인자로 받음
            socket.to(room).emit("new_message", `${ socket.nickname }: ${ msg }`); // 메시지 뿌려줄 roomName에 new_message 이벤트와 메시지 인자 프론트로 전달
            done(); // 익명 함수 done (실제 프론트에서 실행됨)
        });

        socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
        // nickname 이벤트를 전달받으면 nickname을 socket에 저장
    });
});          


httpServer.listen(app.get("PORT"), handleListen);