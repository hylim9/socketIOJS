const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");
room.hidden = true;

let roomName;

function addMessage(message) {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = message;
  ul.appendChild(li);
}

function handleMessageSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#msg input");
  const value = input.value;
  socket.emit("new_message", input.value, roomName, () => {
    addMessage(`You: ${value}`); // 화면의 메세지 (내가 메세지를 보냈을 때)
  });
  input.value = "";
}

function handleUserNameSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#name input");
  socket.emit("username", input.value);
}

function showRoom() {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName}`;
  const msgForm = room.querySelector("#msg");
  msgForm.addEventListener("submit", handleMessageSubmit);
}

function handleRoomSubmit(event) {
  event.preventDefault();
  const roomInput = form.querySelector("#join");
  const usernameInput = form.querySelector("#name");
  socket.emit("enter_room", roomInput.value, usernameInput.value, showRoom); // !function has to be the last argument when emit()
  roomName = roomInput.value;
  userName = usernameInput.value;
  roomInput.value = "";
  usernameInput.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (username, roomCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${roomCount})`;
  addMessage(`${username} joined!`);
});

socket.on("bye", (username, roomCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${roomCount})`;
  addMessage(`${username} left......`);
});

socket.on("new_message", addMessage);
socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");
  roomList.innerHTML = "";
  if (rooms.length === 0) {
    return;
  }
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.append(li);
  });
});

// WebSocket TEST
// const messageList = document.querySelector("ul");
// const messageForm = document.querySelector("#message");
// const nicknameForm = document.querySelector("#nick");

// const socket = new WebSocket(`ws://${window.location.host}`);

// function makeMessage(type, payload) {
//   const msg = { type, payload };
//   return JSON.stringify(msg);
// }

// socket.addEventListener("open", () => {
//   console.log("Connected to Server ✅ !");
// });

// socket.addEventListener("message", (message) => {
//   const li = document.createElement("li");
//   li.innerText = message.data;
//   messageList.append(li);
// });

// socket.addEventListener("close", () => {
//   console.log("Disconnected from Server ❌");
// });

// function handleSubmit(event) {
//   event.preventDefault();
//   const input = messageForm.querySelector("input");
//   socket.send(makeMessage("new_message", input.value));
//   input.value = "";
// }

// function handleNicknameSubmit(event) {
//   event.preventDefault();
//   const input = nicknameForm.querySelector("input");
//   socket.send(makeMessage("nickname", input.value));
//   input.value = "";
// }

// messageForm.addEventListener("submit", handleSubmit);
// nicknameForm.addEventListener("submit", handleNicknameSubmit);

// // setTimeout(() => {
// //   socket.send("hello from them browser !");
// // }, 10000);
