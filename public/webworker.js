function addListeners(socket) {
  socket.addEventListener("close", (mess) => {
    console.log("Close:\n", mess);
  });

  socket.addEventListener("error", (error) => {
    console.log("Error:\n", error);
  });

  socket.addEventListener("message", (mess) => {
    console.log(mess.data);

    self.postMessage(JSON.parse(mess.data));

    // client-Echo
    // setTimeout(() => {
    //     socket.send(mess.data);
    // }, 2000);
  });

  socket.addEventListener("open", () => {
    console.log("websocket connection opened");

    // socket.send("Nå funker det, her er første melding. <----- her :)");

  });
}

let origin = "localhost:8000/";

const socket = new WebSocket(`ws://${origin}socketconnection`);

addListeners(socket);

self.onmessage = (message) => {

  console.log(message.data)

  socket.send(JSON.stringify(message.data));

};

