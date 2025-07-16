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

    // these are for handeling TCP-Packets, and the possible fragmentation of the individual frames.
    let tempFrameBuffer = Buffer.alloc(0);
    let totalLength = 0n;

    // these are for handeling the Frames, and the possible fragmentation of messages between them.
    let initialFrameBuffer = {};
    let tempFINPayloadBuffer = Buffer.alloc(0);

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

                tempFrameBuffer = Buffer.concat([tempFrameBuffer, data]);

                frameBufferLength = BigInt(tempFrameBuffer.length);

            };

            // logging for test-purposes
            console.log("frame-buffer-length:", frameBufferLength, "expected-total-length", totalLength);

            // if the total length of the recieved TCP-packets = the expected length of the websocket-frame
            if(frameBufferLength === totalLength){

                incommingFrame = DeconstFrame(tempFrameBuffer);

                switch(incommingFrame.opcode){
                    case 0x0:
                        // continuation-frame
                        tempFINPayloadBuffer = Buffer.concat([tempFINPayloadBuffer, incommingFrame.payload]);
                        if(incommingFrame.FIN === 1){
                            incommingFrame.payload = tempFINPayloadBuffer;
                        };
                        break;
                    case 0x1:
                        // text-frame
                        if(incommingFrame.FIN === 1){
                            incommingFrame.payload = incommingFrame.payload.toString("utf8");

                            console.log(incommingFrame.payload);
                        }else if(incommingFrame.FIN === 0){
                            initialFrameBuffer = incommingFrame;
                            tempFINPayloadBuffer = Buffer.concat([tempFINPayloadBuffer, incommingFrame.payload]);
                        };

                        break;
                        
                    case 0x2:
                        // binary-frame
                        break;
                    case 0x8: 
                        // close-frame
                        break;
                    case 0x9: 
                        // ping-frame
                        break;
                    case 0xA:
                        // pong-frame
                        break;
                    default:
                        // error unknown opcode
                        break;
                
                };

                // handle FIN-frames ----- -----
                if(incommingFrame.FIN === 1){

                    // concat final payload into buffer
                    tempFINPayloadBuffer = Buffer.concat([tempFINPayloadBuffer, incommingFrame.payload]);

                    // collect complete message payload
                    incommingFrame.payload = tempFINPayloadBuffer;

                    // Clear Buffer
                    tempFINPayloadBuffer = Buffer.alloc(0);

                    console.log("Frame type:")

                    // handle opcodes ----- -----
                    if (incommingFrame.opcode === 0x0){

                        //continuation-frame
                        console.log("\tcontinuation-frame");

                    }else if(incommingFrame.opcode === 0x1){

                        //text-frame
                        console.log("\ttext-frame");

                        incommingFrame.payload = incommingFrame.payload.toString("utf8");

                        console.log(incommingFrame.payload);

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

                }else if (incommingFrame.FIN === 0){

                    // more messages to come, continuation

                    // put unmasked payload in buffer
                    tempFINPayloadBuffer = Buffer.concat([tempFINPayloadBuffer, incommingFrame.payload]);

                };

                // reset variables for next frame
                tempFrameBuffer = Buffer.alloc(0);
                totalLength = 0n;
                
            }else if(frameBufferLength > totalLength){

                console.error("the total length of the websocket-frame's TCP-packets concated together, is bigger than the expected frame length??? \nsomething has gone very wrong....")
                
                tempFrameBuffer = Buffer.alloc(0);
                totalLength = 0n;

            };

            // i still have to write the logic for handling whether or not the frame is a FIN frame

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

            console.log("websocket:", websock);

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

