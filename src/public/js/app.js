const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");
const component_container = document.getElementById("component-container");
const msg_container = document.getElementById("msg-container");
const messageBox = document.getElementById("messageBox");
const incomingMessages = document.getElementById("incomingMessages");

call.hidden = true;
component_container.hidden = true;
msg_container.hidden = true;

let myStream; // 비디오 + 오디오 결함, track을 제공, 비디오 track, 오디오 track, 자막 track, ...
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

// 카메라 목록 select
async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices(); // 연결된 모든 장치들을 가져옴
    const cameras = devices.filter((device) => device.kind === "videoinput"); // kind: videoinput 만 필터해서 가져옴
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

async function getMedia(deviceId) {
  const initialConstrains = {
    audio: true,
    video: { facingMode: "user" }, // 초기 카메라 설정은 셀프캠
  };
  const cameraConstraints = {
    audio: true,
    video: { deviceId: { exact: deviceId } }, // 사용자가 카메라를 설정하면 해당 카메라를 사용하게 강제
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia ( // stream 가져옴
      deviceId ? cameraConstraints : initialConstrains
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}

function handleMuteClick() {
  myStream
    .getAudioTracks() // 오디오 트랙
    .forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}
function handleCameraClick() {
  myStream
    .getVideoTracks() // 비디오 트랙
    .forEach((track) => (track.enabled = !track.enabled));
  if (cameraOff) {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  }
}

// local, remote camera change
async function handleCameraChange() {
  await getMedia(camerasSelect.value);
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video"); // Sender : peer로 보내진 media stream track을 컨트롤하는 역할
    videoSender.replaceTrack(videoTrack); // track change
  }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

// Welcome Form (join a room)
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");
const messageForm = msg_container.querySelector("form");
const textArea = incomingMessages.querySelector("textarea");

// 초기 설정
async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  component_container.hidden = false;
  msg_container.hidden = false;
  await getMedia();
  makeConnection(); // 시그널링 1. Pear A와 Peer B가 connection을 각각 생성
}

async function handleWelcomeSubmit(event) {
  document.body.style.backgroundImage = 'none';
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("join_room", input.value); // 서버로 이벤트 전달
  roomName = input.value;
  input.value = "";
}

function handleMessageSubmit(event) {
  event.preventDefault();
  const msg = msg_container.querySelector("input");
  console.log(msg.value)
  console.log(myDataChannel)
  if (myDataChannel === undefined) {
    Swal.fire({
      title: '메세지 전송 불가',
      text: '참가자가 없습니다.',
      imageUrl: 'data:image/jpeg;base64,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',
      imageWidth: 400,
      imageHeight: 300,
      imageAlt: 'Custom image',
    })
    msg.value = "";
    return;
  }
  myDataChannel.send(msg.value);
  textArea.textContent += msg.value + '\n';
  msg.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);
messageForm.addEventListener("submit", handleMessageSubmit);

// Socket Code
// peer A
socket.on("welcome", async () => { // 누군가 방에 입장
  myDataChannel = myPeerConnection.createDataChannel("chat"); // ** offer 전에 DataChannel 생성
  myDataChannel.addEventListener("message", (event) => {
    textArea.textContent += event.data + '\n';
    myDataChannel.send(msg.value);
  }); 
  console.log("made data channer");
  const offer = await myPeerConnection.createOffer(); // 시그널링 3. peer A의 offer 생성
  myPeerConnection.setLocalDescription(offer); // 시그널링 4. peer A의 setLocalDescription(offer) 설정
  console.log("sent the offer");
  socket.emit("offer", offer, roomName); // 시그널링 5. peer B에게 전달하기 위해 offer와 roomName 서버로 전송
});

// peer B
socket.on("offer", async (offer) => { // 시그널링 7. peer A가 전달한 offer를 socket 서버로부터 받음
  myPeerConnection.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel; // datachannel을 받아옴
      myDataChannel.addEventListener("message", (event) => {
        console.log(event.data)
        textArea.textContent += event.data + '\n';
      }
    );
  }); 
  console.log("received the offer");
  myPeerConnection.setRemoteDescription(offer); // 시그널링 8. peer B의 setRemoteDescription(offer) 설정
  console.log(offer)
  const answer = await myPeerConnection.createAnswer(); // 시그널링 9. peer B가 답장을 위한 answer 생성
  myPeerConnection.setLocalDescription(answer); // 시그널링 10. peer B의 setLocalDescription(answer) 설정
  socket.emit("answer", answer, roomName); // 시그널링 11. peer B의 답장을 peer A에게 전달하기 위해 서버에 요청
  console.log("sent the answer");
});

socket.on("answer", (answer) => { // 시그널링 13. peer B가 전달한 answer를 받은 peer A
  console.log("received the answer"); 
  myPeerConnection.setRemoteDescription(answer); // 시그널링 14. peer A의 setRemoteDescription(answer) 설정
  
});

socket.on("ice", (ice) => { // iceCandidate 4. 서버가 보낸 peer의 ice 데이터를 상대 peer 가 받음
  console.log("received candidate");
  myPeerConnection.addIceCandidate(ice); 
});

// RTC Code
function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [ // stun : public ip를 알아내기 위해 google이 제공하는 stun 서버 이용
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });
  myPeerConnection.addEventListener("icecandidate", handleIce); // iceCandidate 1. 커넥션이 생성되면 iceCandidate 함수 호출하며 iceCandidate 데이터 받음
  myPeerConnection.addEventListener("addstream", handleAddStream); // addStreamEvent 1. 커넥션이 생성되면 addStream 함수 호출하며 addStream 데이터 받음
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream)); 
    // 시그널링 2. 카메라에서 오는 myStream의 데이터를 가지고 브라우저를 연결함 
    // connection 생성 후 양쪽 브라우저에서 카메라와 마이크의 데이터 stream을 받아서 연결 통로 안에 넣음
}

function handleIce(data) { // 생성된 iceCandidate를 data 인자로 받은 후
  console.log("sent candidate");
  socket.emit("ice", data.candidate, roomName); // iceCandidate 2. peer 에게 전달하기 위해 서버로 요청
}

function handleAddStream(data) {
  const peerFace = document.getElementById("peerFace"); 
  peerFace.srcObject = data.stream; // addStreamEvent 2. data.stream 설정 (a브라우저에는 b의 스트림이 보이고, b 브라우저에는 a 스트림이 보임)
}