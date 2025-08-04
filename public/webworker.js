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

    // client-Echo
    // setTimeout(() => {
    //     socket.send(mess.data);
    // }, 2000);
  });

  socket.addEventListener("open", () => {
    console.log("websocket connection opened");

    socket.send("Nå funker det, her er første melding. <----- her :)");

    self.postMessage({user: "Steve", DateTime: "14.09.44", message: "her er en melding om ting og tang"})
    self.postMessage({user: "Henrik", DateTime: "14.09.44", message: "her er en melding om ting og tang"});
    self.postMessage({user: "Lars", DateTime: "15.09.44", message: "her er en melding som svarer på den forrige meldingen"});

  });
}

let origin = "localhost:8000/";

const socket = new WebSocket(`ws://${origin}socketconnection`);

addListeners(socket);

self.onmessage = (message) => {

  socket.send(message.data);

};

