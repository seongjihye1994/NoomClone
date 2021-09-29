const socket = io(); // 백엔드의 socketIO와 연결해주는 io() 함수

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName;

function addMessage(message) {
    const ul = room.querySelector("ul");
    const li = document.createElement("li"); // li 태그 생성후
    li.innerText = message; // 메시지 출력
    ul.appendChild(li);
}


function handleMessageSubmit(event) {
    event.preventDefault();
    const input = room.querySelector("#msg input");
    const value = input.value;
    socket.emit("new_message", input.value, roomName, () => {
        addMessage(`You: ${ value }`);
    }); // 새 메시지 백으로 전달
    input.value = "";
}

function handleNicknameSubmit(event) {
    event.preventDefault();
    const input = room.querySelector("#name input");
    socket.emit("nickname", input.value); // 닉네임 서버로 전달
}


// 백엔드에서 호출(실행)시키는 메소드
function showRoom() {
    welcome.hidden = true; // 사용자가 룸에 참여하면 welcome form은 사라짐
    room.hidden = false; // 반대로 사용자가 룸에 참여하면 room form은 보이게 설정
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${ roomName }`;
    const msgForm = room.querySelector("#msg");
    const nameForm = room.querySelector("#name");
    msgForm.addEventListener("submit", handleMessageSubmit); // 새 메시지 입력 버튼이 submit되면
    nameForm.addEventListener("submit", handleNicknameSubmit); // 닉네임 입력 버튼이 submit되면
}

function handleRoomSubmit(event) {
    event.preventDefault();
    const input = form.querySelector("input");
    socket.emit(
        /*1. 이벤트명*/"enter_room", 
        /*2. 보낼 데이터*/input.value,
        /*3. 콜백함수 (넣을거면 무조건 마지막에 기재)*/showRoom,
        );
    roomName = input.value;
    // room 이라는 이벤트를 emit 함, room event를 사용하면 전달인자(객체도 가능)를 보낼 수 있음.
    // enter_room 은 개발자가 직접 만들어낸 이벤트 
    // socket은 전달인자로 객체(JSON)를 바로 보낼 수 있음(stringify 불필요)
    // emit의 인자 1. 개발자 custom 이벤트명, 인자 2. 보내고싶은 데이터(객체 가능) 인자 3. 콜백함수(콜백은 서버로부터 호출되는 function)
    input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (user, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${ roomName } (${ newCount })`; // newCount : 실시간 사용자 count
    addMessage(`${ user } arrived!`);
});

socket.on("bye", (left, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${ roomName } (${ newCount })`;
    addMessage(`${ left } left ㅠㅠ`);
});

// 서버로부터 받은 emit 함수 받음, 하나의 소켓에 메시지 전송
socket.on("new_message", addMessage);

// app 에 연결되어 있는 모든 socket에 메시지 전송
socket.on("room_change", (rooms) => { // room 상태가 바뀔때마다 rooms안에 있는 방을 print 해주는데, 목록이 비어있으면 아무작업도 해주지 않음
    const roomList = welcome.querySelector("ul");
    // 내 app에 room이 하나도 없다면
    if (rooms.length === 0) {
        roomList.innerText = ""; // 모든것을 비워줌
        return;
    }
    rooms.forEach(room => {
        const li = document.createElement("li");
        li.innerText = room;
        roomList.append(li);
    });
});