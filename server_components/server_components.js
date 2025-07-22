import { Buffer } from "buffer";
import { ConstrFrame } from "./frame_constructor.js";

// https://datatracker.ietf.org/doc/html/rfc6455#section-5.2

/**
```
------------------------------------------

function FrameProcessing( completedFrame )

    completedFrame: (Object)
        - This is the Websocket-Frame after we have reassembled the message from the different frames, or when we are sure it is a complete message.

-------------------------------------------

Description:
this function handles the logic of opcode 0x1 and 0x2, when we know the message is complete


*/

export function FrameProcessing(completedFrame){
    switch (completedFrame.opcode){
        case 0x1:
            // text-frame
            completedFrame.payload = completedFrame.payload.toString("utf8");

            console.log("\n\tPayload:\n");
            console.log(completedFrame.payload);
            console.log("\n-------------------------------------------------------\n");
            break;
        case 0x2:
            // binary-frame
            console.log("\n\tPayload:\n");
            console.log(completedFrame.payload);
            console.log("\n-------------------------------------------------------\n");
            break;
        default:
            console.error("opcode not 0x1 or 0x2, opcode:", completedFrame.opcode);
    };
};


/**
```
-----------------------------------------------

function OpcodeSwitch( incommingFrame, socket, pingTimer1, pingTimer2 )

    incommingFrame: (Object)
        - the Frame-Object returned by DeconstFrame()
    
    socket: (Object)
        - the Socket-Object returned by net.createServer()

    pingMessage: (string)
        - the payload of the sent Ping

    pingTimer1: (Double)
        - the time when a ping was sent from the server.

    pingTimer2: (Double)
        - the time when a pong was recieved from the client.

    -----------------------------------------
    "The function has two external" variables, in the socket Object:
    -----------------------------------------

        socket.initialFrameBuffer: (Object)

            - this allows the function to persist the initial frame of a multiframe message.
        
        socket.tempFINPayloadBuffer: (binary-Buffer)

            - this holds the message parts from all the subsequent frames, before they are appended all together to the payload of the initial Frame.
    
    -----------------------------------------

Description:
this function handles the "routing" based on opcodes, and executes the appropriate responses or logic.


*/

export function OpcodeSwitch(incommingFrame, socket, pingMessage, pingTimer1, pingTimer2){

    switch(incommingFrame.opcode){

        case 0x0:   // ----- continuation-frame ----- 

            // push payload to payload-buffer
            socket.tempFINPayloadBuffer = Buffer.concat([socket.tempFINPayloadBuffer, incommingFrame.payload]);
            
            // if final frame in multiframe-message, process the message
            if(incommingFrame.FIN === 1){

                // construct the completed frame from continuation-frames
                incommingFrame = socket.initialFrameBuffer;
                incommingFrame.FIN = 1;
                incommingFrame.payload = socket.tempFINPayloadBuffer;

                // reset buffer variables
                socket.initialFrameBuffer = {};
                socket.tempFINPayloadBuffer = Buffer.alloc(0);

                // process the completed frame
                FrameProcessing(incommingFrame);

            };

            break;


        case 0x1:   // ----- text-frame ----- 

            if(incommingFrame.FIN === 1){

                // process frame
                FrameProcessing(incommingFrame);

            }else if(incommingFrame.FIN === 0){

                // push initial frame to buffer
                socket.initialFrameBuffer = incommingFrame;
                // push payload to payload-buffer
                socket.tempFINPayloadBuffer = Buffer.concat([socket.tempFINPayloadBuffer, incommingFrame.payload]);
            
            };

            break;


        case 0x2:   // ----- binary-frame ----- 

            if(incommingFrame.FIN === 1){

                // process frame
                FrameProcessing(incommingFrame);

            }else if(incommingFrame.FIN === 0){

                // push initial frame to buffer
                socket.initialFrameBuffer = incommingFrame;
                // push payload to payload-buffer
                socket.tempFINPayloadBuffer = Buffer.concat([socket.tempFINPayloadBuffer, incommingFrame.payload]);
            
            };

            break;


        case 0x8:   // ----- close-frame ----- 

            // set statuscode
            let statusCode = 1000;
            // construct closing message
            const closingMessage = ConstrFrame(1, 0x8, statusCode);
            // write closing message
            socket.write(closingMessage);
            // destroy socket
            socket.destroy()

            break;


        case 0x9:   // ----- ping-frame ----- 

            // construct pong-frame
            const pingResponse = ConstrFrame(1, 0xA, incommingFrame.payload);
            // write response
            socket.write(pingResponse);

            break;


        case 0xA:   // ----- pong-frame ----- 

            // here i recieve a pong frame, for a ping i have sent

            if(incommingFrame.payload.toString() === pingMessage){
                console.log("Pong payload returned successfully");
            }else{
                console.warn("WARNING: PONG PAYLOAD MISMATCH");
                console.log("\tPing message:", pingMessage);
                console.log("\tPong response:", incommingFrame.payload.toString());
            };

            console.log("Ping:", (pingTimer2 - pingTimer1), "\n");

            break;

        default:
            // error unknown opcode
            console.error("unknown opcode. \n\topcode:", incommingFrame.opcode);

    };
};


/**
```
-------------------------------------

function TCPBuffToFrame( streamBuffer )

    streamBuffer: (buffer)
        - the Buffer that holds the incomming datapackets from the TCP-Stream

Returns:
    (length of Frame, as BigInt) | null

-------------------------------------

Description:
This function assumes we have recieved the datapackets in the right order.

It establishes the length of the Websocket-Frame, then checks if the total Byte-length of the frame is more than the Byte-length of the buffer.

    -if true, the server should wait for the next datapacket to arrive on the TCP-stream\(the next socket.on("data") event) and run the function again.
    
    -if false, the server can continue, and read the entire frame.
 
 
*/

export function TCPBuffToFrame(streamBuffer){

    // Length of final frame
    let frameLengt = 2n;

    // Byte 2, read from second byte in buffer to get length of Frame
    const mask = (streamBuffer[1] & 0b10000000) >> 7;
    const payload_len = (streamBuffer[1] & 0b01111111);

    if (payload_len <= 125){
        // add length of payload
        frameLengt += BigInt(payload_len);

        if(mask === 1){
            // add length of masking key
            frameLengt += 4n;
        };

    }else if (payload_len === 126){
        // read length of payload from Buffer
        const ext_payload_len = streamBuffer.readUInt16BE(2);
        // add lenght of header
        frameLengt += 2n;
        // add length of payload
        frameLengt += BigInt(ext_payload_len);

        if (mask === 1){
            // add length of masking key
            frameLengt += 4n;
        };

    }else if (payload_len === 127){
        // read length of payload from Buffer
        const ext_payload_len = streamBuffer.readBigUInt64BE(2);
        // add lenght of header
        frameLengt += 8n;
        // add length of payload
        frameLengt += ext_payload_len;
        
        if (mask === 1){
            // add length of masking key
            frameLengt += 4n;
        };

    }else{
        console.error("payload_len out of range(max = 127). payload_len:", payload_len);
    };

    if(frameLengt <= streamBuffer.byteLength){

        return frameLengt;

    }else{

        // if the entire frame has not yet arrived
        return null;

    };
    
};

