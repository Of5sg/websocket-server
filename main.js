import net from "net";
import { Buffer } from "buffer";
import { DeconstFrame } from "./server_components/frame_interpreter.js";
import { ConstrFrame } from "./server_components/frame_constructor.js";
import { Http_Handshake } from "./server_components/http_handshake.js";
import * as util from "./server_components/utils.js";

//https://datatracker.ietf.org/doc/html/rfc6455#section-5.2

const server = net.createServer(async(socket) => {

    let websock = false;

    // https://datatracker.ietf.org/doc/html/rfc6455#section-5.2

    let tempFrameBuffer = [];
    let totalLength = 0n;


    socket.on("data", (data) => {

        if(websock === true){

            // interpreting frame : ---------------------------------------------------

            // max size of a tcp-packet is 65535 bytes, i hve to count bytes recieved unit i have a full frame. error found, finally.
            let incommingFrame = DeconstFrame(data);

            let frameBufferLength = BigInt(tempFrameBuffer.length);

            // if the first TCP-packet of frame, set total length to expected frame total length
            if(totalLength === 0n){

                totalLength = (BigInt(incommingFrame.headerLen) + BigInt(incommingFrame.payloadLen));

            };

            // check if entire frame has come throug, or if patitioned to several TCP-packets.
            if(frameBufferLength < totalLength){

                tempFrameBuffer = tempFrameBuffer.concat([...data]);

            };

            frameBufferLength = BigInt(tempFrameBuffer.length);

            console.log("frame-buffer-length:", frameBufferLength, "total-length", totalLength);

            if(frameBufferLength === totalLength){

                incommingFrame = DeconstFrame(tempFrameBuffer);

                // handle opcodes
                const testcomp = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

                console.log("Frame type:")

                if (incommingFrame.opcode === 0x0){

                    //continuation-frame
                    console.log("\tcontinuation-frame");

                }else if(incommingFrame.opcode === 0x1){

                    //text-frame
                    console.log("\ttext-frame");

                    // // for testing purposes
                    // console.log(incommingFrame.payload.subarray(-5000).toString());

                    incommingFrame.payload = incommingFrame.payload.toString("utf8");

                    console.log(incommingFrame.payload);

                    // to check if bytelength and string length match, which they should since i am not using any special characters in the test data
                    console.log("\nlength of payload in frame:", incommingFrame.payloadLen, "lenght of string:", incommingFrame.payload.length, "\n");
                
                }else if(incommingFrame.opcode === 0x2){

                    //binary-frame
                    console.log("\tbinary-frame");

                }else if(incommingFrame.opcode === 0x8){

                    //close-frame
                    console.log("\tclose-frame");

                }else if(incommingFrame.opcode === 0x9){

                    //ping-frame
                    console.log("\tping-frame");

                }else if(incommingFrame.opcode === 0xA){

                    //pong-frame
                    console.log("\tpong-frame");

                };

                // handle FIN-frames
                if(incommingFrame.FIN === 1){
                    // end of message
                }else if (incommingFrame.FIN === 0){
                    // more messages to come
                };

                // reset variables for next frame
                tempFrameBuffer = [];
                totalLength = 0n;
                
            }else if(frameBufferLength > totalLength){

                console.error("the total length of the websocket-frame's TCP-packets concated together, is bigger than the expected frame length??? \nsomething has gone very wrong....")
            
            };

            // i still have to write the logic for handling wheter the frame is a FIN frame

            // attempt at a response : ------------------------------------------------

            // const payload = `\nHer er respons...(Echo-server)---nå gjør vi denne mye lenger, og enda litt---\r\n maskingkey fra request: ${incommingFrame.maskingKey}\r\n payload fra request: ${incommingFrame.payload}`;
            
            // const responseFrame = ConstrFrame(payload);

            // for logging, and test-purposes - can be removed
            // const testDeconResponse = DeconstFrame(responseFrame);
            // console.log("\nResponse Frame:\n", testDeconResponse);

            // socket.write(responseFrame);

        }else{

            // handle http handshake
            // https://datatracker.ietf.org/doc/html/rfc6455#section-4.2.1

            const response = Http_Handshake(data);

            console.log(`\nhttp response: \n${response}`);

            socket.write(Buffer.from(response));
            websock = true;
            console.log("websock:", websock)

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

