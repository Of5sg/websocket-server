import { Buffer } from "buffer";

// https://datatracker.ietf.org/doc/html/rfc6455#section-5.2

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

//variables for buffering websocket-frames, for multi-frame messages, used in OpcodeSwitch
let initialFrameBuffer = {};
let tempFINPayloadBuffer = Buffer.alloc(0);

export function OpcodeSwitch(incommingFrame){

    switch(incommingFrame.opcode){

        case 0x0:

            // continuation-frame

            tempFINPayloadBuffer = Buffer.concat([tempFINPayloadBuffer, incommingFrame.payload]);
            
            if(incommingFrame.FIN === 1){

                // construct the completed frame from continuation-frames
                incommingFrame = initialFrameBuffer;
                incommingFrame.FIN = 1;
                incommingFrame.payload = tempFINPayloadBuffer;

                // reset buffer variables
                initialFrameBuffer = {};
                tempFINPayloadBuffer = Buffer.alloc(0);

                // process the completed frame
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

    };
};

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

 