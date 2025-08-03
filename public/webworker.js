function addListeners(socket) {
  socket.addEventListener("close", (mess) => {
    console.log("Close:\n", mess);
  });

  socket.addEventListener("error", (error) => {
    console.log("Error:\n", error);
  });

  socket.addEventListener("message", (mess) => {
    console.log(mess.data);

    self.postMessage(mess.data);

    // console.log("length:", mess.data.length);

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

try {
  let origin = "localhost:8000/";

  let socket;

  self.onmessage = (message) => {
    socket = new WebSocket(`ws://${origin}socketconnection`);

    addListeners(socket);
  };
} catch (error) {
  console.log(error);
}
