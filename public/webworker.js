function addListeners(socket) {

  socket.addEventListener("close", (mess) => {
    console.log("Close:\n", "Clean close?:", mess.wasClean);
    console.log("Code:", mess.code);
    console.log("Reason:", mess.reason);
  });

  socket.addEventListener("error", (error) => {
    console.error("Error:\n", "Target:\n", error.target);
  });

  socket.addEventListener("message", (mess) => {
    
    self.postMessage(mess.data);

    // client-Echo
    // setTimeout(() => {
    //     socket.send(mess.data);
    // }, 2000);
  });

  socket.addEventListener("open", () => {
    console.log("websocket connection opened");

    socket.send("Nå funker det, her er første melding. <----- her :)");

  });
}

let origin = "localhost:8000/";

const socket = new WebSocket(`ws://${origin}socketconnection`);

addListeners(socket);

self.onmessage = (message) => {

  console.log(message.data)

  socket.send(JSON.stringify(message.data));

};

