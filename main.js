import net from "net";
import { Buffer } from "buffer";
import { DeconstFrame } from "./server_components/frame_interpreter.js";
import { Opening_Handshake } from "./server_components/handshakes.js";
import { OpcodeSwitch, TCPBuffToFrame, WebsocketInflate } from "./server_components/server_components.js";
import { ConstrFrame } from "./server_components/frame_constructor.js";
import { RandomString } from "./server_components/utils.js";

//https://datatracker.ietf.org/doc/html/rfc6455#section-5.2

const server = net.createServer((socket) => {

    let websock = false;

    // https://datatracker.ietf.org/doc/html/rfc6455#section-5.2

    // extensions, deflate
    let websock_extensions = false;
    let permessage_deflate = false;
    let client_max_window_bits = false;

    // to persist ping timing
    let pingTimer1;

    // for ping payload
    let pingMessage = "";

    // sending a ping to the client.
    setInterval(() => {
        if(websock === true){
            pingMessage = RandomString(15);
            const pingFrame = ConstrFrame(1, 0x9, pingMessage);
            pingTimer1 =  performance.now();
            socket.write(pingFrame);
        };
    }, 10000);

    // this is the buffer for the incomming TCP-Stream
    let streamBuffer = Buffer.alloc(0);

    // variables for buffering messages fragmented over several Websocket-Frames, used in the opcodeSwitch() function.
    socket.initialFrameBuffer = {};
    socket.tempFINPayloadBuffer = Buffer.alloc(0);

    // data event
    socket.on("data", (data) => {

        // for ping and pong frames, this is when the pong is recieved.
        const pingTimer2 = performance.now();

        // if handshake is complete
        if(websock === true){

            // push data to buffer
            streamBuffer = Buffer.concat([streamBuffer, data]);

            // calculate length of frame in Buffer, and if frame is complete
            const bufferedFrameLength = TCPBuffToFrame(streamBuffer);

            if(bufferedFrameLength !== null){
                // Frame completely assembled
                
                // convert BigInt to Number
                let endOfFrame = 0;

                if(bufferedFrameLength <= Number.MAX_SAFE_INTEGER){
                    endOfFrame = Number(bufferedFrameLength);
                }else{
                    console.error("Frame-Length exceeds the MAX_SAFE_INTEGER value for Number");
                };

                // extract Frame from streamBuffer
                const frameBuffer = [...(streamBuffer.subarray(0, endOfFrame))];

                // remove frame from streamBuffer
                streamBuffer = streamBuffer.subarray(endOfFrame);

                // Convert to object
                const websocketFrame = DeconstFrame(frameBuffer);

                // Inflate Algorithm
                // WebsocketInflate(websocketFrame);
                // for extensions and algorithms// LZ77 and Huffman coding
                // https://datatracker.ietf.org/doc/html/rfc7692#section-7
                // https://datatracker.ietf.org/doc/html/rfc1951#section-2
                
                // Run opcode switch
                OpcodeSwitch(websocketFrame, socket, pingMessage, pingTimer1, pingTimer2);

            }else{

                // Frame incomplete: wait for the entire frame to be Buffered
                console.log("waiting for entire Websocket-Frame to enter Buffer.");

            };

        }else{
            // if handshake is not complete

            // http-handshake
            const response = Opening_Handshake(data);
            socket.write(response.res);
            permessage_deflate = response.deflate.permessage_deflate;
            client_max_window_bits = response.deflate.client_max_window_bits;
            websock = true;

            if(permessage_deflate === true){
                websock_extensions = true;
            };

        };

    });

    socket.once("end", () => {

        console.log(`-----\n\nrecieved closing handshake from:\n\n\tremoteAddress\t${socket.remoteAddress}\n\non:\n\n\tlocalPort\t${socket.localPort}\n\tlocalAddress\t${socket.localAddress}\n\n-----`);

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

