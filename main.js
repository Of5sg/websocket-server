import net from "net";
import { ConstrFrame } from "./server_components/WebSocket_components/frame_constructor.js";
import { FrameHandling } from "./server_components/WebSocket_components/websocket_server_components.js";
import { RandomString } from "./server_components/utils.js";
import { SocketInit } from "./server_components/general_server_components.js";
import { HTTPRouting } from "./server_components/HTTP_components/HTTP_handler.js";
import { deflateRaw } from "zlib";
import { promisify } from "util";
import { TLSHandshake } from "./server_components/TLS/TLS.js";

//https://datatracker.ietf.org/doc/html/rfc6455#section-5.2

const HTTP_server = net.createServer((socket) => {

  SocketInit(socket);

  // sending a websocket ping to the client, if connection is websocket
  setInterval(() => {
    if (socket.state.websocket_connection === true) {
      socket.timing.pingMessage = RandomString(15);
      const pingFrame = ConstrFrame(1, 0x9, socket.timing.pingMessage, socket);
      socket.timing.pingTimer1 = performance.now();
      // socket.write(pingFrame);
    }
  }, 10000);

  //sending test messages to the client
  const testArray = [{user: "Bob", DateTime: "14.09.44", message: "her er en melding om ting og tang"}, {user: "Henrik", DateTime: "14.09.44", message: "her er en annen melding om ting og tang"}, {user: "Lars", DateTime: "15.09.44", message: "her er en melding som svarer på den forrige meldingen"}];
  let counter = 0;
  setInterval(async () => {
    if(socket.state.websocket_connection === true && counter < 3){

      const Deflate = promisify(deflateRaw);
      const messageContent = JSON.stringify(testArray[counter])

      let resultMessage;
      let opcode = 0x1;

      if(socket.state.websocket_permessage_deflate && socket.state.RSV1 === 1){

        // Use binary frames for compressed data
        opcode = 0x2;

        // deflate Message
        await Deflate(messageContent)
        .then((data) => {
          resultMessage =  data;
        }).catch((error) => {
          console.error(error);
        });

      }else{

        opcode = 0x1;

        resultMessage = messageContent;
      }

      const exampleMessage = ConstrFrame(1, opcode, resultMessage, socket);
      socket.write(exampleMessage);
      counter++

    };
  }, 500);

  // data event, and hadling the logic
  socket.on("data", (data) => {
    // for ping and pong frames, this is when the pong is recieved.
    socket.timing.pingTimer2 = performance.now();

    if (socket.state.websocket_connection) {
      // if websocket-connection
      FrameHandling(data, socket);
    }else{
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

const HTTPS_server = net.createServer((socket) => {
  
  SocketInit(socket);

  socket.on("data", (data) => {
    
    if(socket.state.HTTP_TLS_connection){
      console.log("TLS connection = true")
    }else{
      TLSHandshake(data, socket);
    }
    
  });

  socket.on("close", () => {
    console.log("Connection closed.\n");
  });

});

HTTP_server.listen(8000, () => {
  console.log("HTTP-server started. \n\t\tport: \t8000");
});

HTTPS_server.listen(8443, () => {
  console.log("HTTPS-server started. \n\t\tport: \t8443\n");
});