import net from "net";
import { Buffer } from "buffer";
import { DeconstFrame } from "./server_components/frame_interpreter.js";
import { ConstrFrame } from "./server_components/frame_constructor.js";
import { Http_Handshake } from "./server_components/http_handshake.js";
import { FrameProcessing } from "./server_components/utils.js";

//https://datatracker.ietf.org/doc/html/rfc6455#section-5.2

const server = net.createServer((socket) => {

    let websock = false;

    // https://datatracker.ietf.org/doc/html/rfc6455#section-5.2

    // these are for handling TCP-Packets, and the possible partitioning of the individual frames.
    let tempFrameBuffer = Buffer.alloc(0);
    let totalLength = 0n;

    // these are for handling the Websocket-Frames, and the possible partitioning of messages between them.
    let initialFrameBuffer = {};
    let tempFINPayloadBuffer = Buffer.alloc(0);

    socket.on("data", (data) => {

        if(websock === true){

            // Constructing frame from TCP-Packets : ---------------------------------------------------

            // i need to handle the TCP-stream in adifferent way, so i get the packets in a safe end separated way, not jumbled together.

            // max size of a tcp-packet is 65535 bytes, i hve to count bytes recieved unit i have a full frame. error found, finally.
            let incommingFrame = DeconstFrame(data);

            let frameBufferLength = BigInt(tempFrameBuffer.length); 

            // if the first TCP-packet of frame, set total length to expected frame total length
            if (totalLength === 0n){

                totalLength = (BigInt(incommingFrame.headerLen) + BigInt(incommingFrame.payloadLen));

            };

            // check if entire frame has come through, or if patitioned to several TCP-packets.
            if(frameBufferLength < totalLength){

                tempFrameBuffer = Buffer.concat([tempFrameBuffer, data]);

                frameBufferLength = BigInt(tempFrameBuffer.length);

            };

            // logging for test-purposes
            console.log("frame-buffer-length:", frameBufferLength, "expected-total-length", totalLength);


            // Handling the Frames, after TCP-Construction : ---------------------------------------------------

            // if the total length of the recieved TCP-packets = the expected length of the websocket-frame
            if(frameBufferLength === totalLength){

                incommingFrame = DeconstFrame(tempFrameBuffer);

                switch(incommingFrame.opcode){

                    case 0x0:

                        // continuation-frame
                        tempFINPayloadBuffer = Buffer.concat([tempFINPayloadBuffer, incommingFrame.payload]);
                        
                        if(incommingFrame.FIN === 1){

                            //construct the completed frame from continuation-frames
                            incommingFrame = initialFrameBuffer;
                            incommingFrame.FIN = 1;
                            incommingFrame.payload = tempFINPayloadBuffer;

                            //process the completed frame
                            FrameProcessing(incommingFrame);

                        };

                        break;

                    case 0x1:

                        // text-frame
                        if(incommingFrame.FIN === 1){

                            FrameProcessing(incommingFrame);

                        }else if(incommingFrame.FIN === 0){

                            initialFrameBuffer = incommingFrame;

                            tempFINPayloadBuffer = Buffer.concat([tempFINPayloadBuffer, incommingFrame.payload]);
                        
                        };

                        break;
                        
                    case 0x2:
                        // binary-frame
                        if(incommingFrame.FIN === 1){

                            FrameProcessing(incommingFrame);

                        }else if(incommingFrame.FIN === 0){

                            initialFrameBuffer = incommingFrame;

                            tempFINPayloadBuffer = Buffer.concat([tempFINPayloadBuffer, incommingFrame.payload]);
                        
                        };
                        break;
                    case 0x8: 
                        // close-frame
                        // here i should send the closing handshake
                        break;
                    case 0x9: 
                        // ping-frame
                        // here i need to send a pong frame
                        break;
                    case 0xA:
                        // pong-frame
                        // here i recieve a pong frame, for a ping i have sent
                        break;
                    default:
                        // error unknown opcode
                        console.error("unknown opcode. \n\topcode:", incommingFrame.opcode);
                        break;

                };

                // reset TCP-Packet-Buffers for next frame
                tempFrameBuffer = Buffer.alloc(0);
                totalLength = 0n;
                
            }else if(frameBufferLength > totalLength){

                console.error("the total length of the websocket-frame's TCP-packets concated together, is bigger than the expected frame length??? \nsomething has gone very wrong....")

                // reset TCP-Packet-Buffers for next frame
                tempFrameBuffer = Buffer.alloc(0);
                totalLength = 0n;

            };

            // i still have to write the logic for handling whether or not the frame is a FIN frame

            // attempt at a response : ------------------------------------------------

            // const payload = `\nHer er respons...(Echo-server)---nå gjør vi denne mye lenger, og enda litt---\r\n maskingkey fra request: ${incommingFrame.maskingKey}\r\n payload fra request: ${incommingFrame.payload}`;
            
            // const responseFrame = ConstrFrame(payload);

            // //for logging, and test-purposes - can be removed
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

