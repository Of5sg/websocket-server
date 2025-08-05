import net from "net";
import { ConstrFrame } from "./server_components/WebSocket_components/frame_constructor.js";
import { FrameHandling } from "./server_components/WebSocket_components/websocket_server_components.js";
import { RandomString } from "./server_components/utils.js";
import { SocketInit } from "./server_components/general_server_components.js";
import { HTTPRouting } from "./server_components/HTTP_components/HTTP_handler.js";

//https://datatracker.ietf.org/doc/html/rfc6455#section-5.2

const server = net.createServer((socket) => {
  SocketInit(socket);

  // sending a websocket ping to the client, if connection is websocket
  setInterval(() => {
    if (socket.state.websocket_connection === true) {
      socket.timing.pingMessage = RandomString(15);
      const pingFrame = ConstrFrame(1, 0x9, socket.timing.pingMessage, socket);
      socket.timing.pingTimer1 = performance.now();
      socket.write(pingFrame);
    }
  }, 10000);

  const testArray = [{user: "Bob", DateTime: "14.09.44", message: "her er en melding om ting og tang"}, {user: "Henrik", DateTime: "14.09.44", message: "her er en annen melding om ting og tang"}, {user: "Lars", DateTime: "15.09.44", message: "her er en melding som svarer på den forrige meldingen"}];
  let counter = 0;
  setInterval(() => {
    if(socket.state.websocket_connection === true && counter < 3){
      const exampleMessage = ConstrFrame(1, 1, JSON.stringify(testArray[counter]), socket);
      socket.write(exampleMessage);
      counter++
    };
  }, 1000)

  // data event
  socket.on("data", (data) => {
    // for ping and pong frames, this is when the pong is recieved.
    socket.timing.pingTimer2 = performance.now();

    if (socket.state.websocket_connection === true) {
      // if websocket-connection
      FrameHandling(data, socket);
    } else {
      // if not websocket-connection
      HTTPRouting(data, socket);
    }
  });

  socket.once("end", () => {
    console.log(`-----\n\nrecieved closing handshake from:\n\n\tremoteAddress\t${socket.remoteAddress}\n\non:\n\n\tlocalPort\t${socket.localPort}\n\tlocalAddress\t${socket.localAddress}\n\n-----`,);
  });

  socket.on("timeout", () => {
    console.log("Connection timed out");

    socket.end();
  });

  socket.on("close", () => {
    console.log("Connection closed.\n");
  });
});

server.listen(8000, () => {
  console.log("server started on port 8000\n");
});
