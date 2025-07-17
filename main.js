import net from "net";
import { Buffer } from "buffer";
import { DeconstFrame } from "./server_components/frame_interpreter.js";
import { ConstrFrame } from "./server_components/frame_constructor.js";
import { Http_Handshake } from "./server_components/http_handshake.js";
import { OpcodeSwitch, FrameProcessing, TCPBuffToFrame } from "./server_components/server_components.js";

//https://datatracker.ietf.org/doc/html/rfc6455#section-5.2

const server = net.createServer((socket) => {

    let websock = false;

    // https://datatracker.ietf.org/doc/html/rfc6455#section-5.2

    // this is the buffer for the incomming TCP-Stream
    let streamBuffer = Buffer.alloc(0);

    // length of incomming frame in buffer
    let bufferedFrameLength = 0n;

    //     // attempt at a response : ------------------------------------------------

    //     // const payload = `\nHer er respons...(Echo-server)---nå gjør vi denne mye lenger, og enda litt---\r\n maskingkey fra request: ${incommingFrame.maskingKey}\r\n payload fra request: ${incommingFrame.payload}`;
        
    //     // const responseFrame = ConstrFrame(payload);

    //     // //for logging, and test-purposes - can be removed
    //     // const testDeconResponse = DeconstFrame(responseFrame);
    //     // console.log("\nResponse Frame:\n", testDeconResponse);

    //     // socket.write(responseFrame);


    socket.on("data", (data) => {

        if(websock === true){

            streamBuffer = Buffer.concat([streamBuffer, data]);

            // calculate length of frame in Buffer, and if frame is complete
            bufferedFrameLength = TCPBuffToFrame(streamBuffer);

            if(bufferedFrameLength !== null){
                // convert BigInt to number;
                const endOfFrame = Number(bufferedFrameLength);
                // extract Frame from streamBuffer
                const frameBuffer = [...(streamBuffer.subarray(0, endOfFrame))];
                // remove frame from streamBuffer
                streamBuffer = streamBuffer.subarray(endOfFrame);
                // reset frame length variable
                bufferedFrameLength = 0n;
                // Convert to object
                const WebsocketFrame = DeconstFrame(frameBuffer);
                // Run opcode switch
                OpcodeSwitch(WebsocketFrame);
            }else{
                // wait for the entire frame to be Buffered
                console.log("waiting for entire Websocket-Frame to enter Buffer.");
            };

        }else{
            // http-handshake
            const response = Http_Handshake(data);
            socket.write(Buffer.from(response));
            websock = true;

        };

    });

    socket.once("end", (closingHandshake) => {

        console.log(`-----\n\nrecieved closing handshake from:\n\n\tremoteAddress\t${socket.remoteAddress}\n\non:\n\n\tlocalPort\t${socket.localPort}\n\tlocalAddress\t${socket.localAddress}\n\n-----`);
        
        // console.log(closingHandshake);

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

