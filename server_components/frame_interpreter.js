import { Buffer } from "buffer";

// handling the websocket frames

export function DeconstFrame(data){

    // where i contain the headers, after dividing them
    const incommingFrame = {};

    // length of header, before payload
    let headerLen = 16;

    // headers
    incommingFrame.FIN = (data[0] & 0b10000000) >> 7;
    incommingFrame.RSV1 = (data[0] & 0b01000000) >> 6;
    incommingFrame.RSV2 = (data[0] & 0b00100000) >> 5;
    incommingFrame.RSV3 = (data[0] & 0b00010000) >> 4;
    incommingFrame.opcode = (data[0] & 0b00001111);
    incommingFrame.mask = (data[1] & 0b10000000) >> 7;
    incommingFrame.payloadLen = (data[1] & 0b01111111);
    incommingFrame.maskingKey = [];
    if(incommingFrame.payloadLen < 126 && incommingFrame.mask === 1){

        // 32-bit masking-key
        incommingFrame.maskingKey = [data[2], data[3], data[4], data[5]];

        headerLen = 48;

    }else if(incommingFrame.payloadLen === 126){

        // 16-bit extended payload-len
        incommingFrame.payloadLen = 
            (data[2] << 8)|
            (data[3]);

        headerLen = 32;

        if(incommingFrame.mask === 1){

            // if 126, 32-bit masking-key displaced by 16-bit
            // byte 5, 6, 7, 8 = masking-key, 16-bit-displacement
            incommingFrame.maskingKey = [data[4], data[5], data[6], data[7]];

            headerLen = 64;

        };

    }else if(incommingFrame.payloadLen === 127){

        // 64-bit extended payload-len
        incommingFrame.payloadLen = 
            (BigInt(data[2]) << 56n)|
            (BigInt(data[3]) << 48n)|
            (BigInt(data[4]) << 40n)|
            (BigInt(data[5]) << 32n)|
            (BigInt(data[6]) << 24n)|
            (BigInt(data[7]) << 16n)|
            (BigInt(data[8]) << 8n)|
            (BigInt(data[9]));

        headerLen = 80;

        if(incommingFrame.mask === 1){

            // if 127, 32-bit masking-key displaced by 64-bit
            // bytes 11, 12, 13, 14 = masking-key, 64-bit-displacement
            incommingFrame.maskingKey = [data[10], data[11], data[12], data[13]];

            headerLen = 112;

        };
    };

    // here i unmask the payload
    // client to server masking: https://datatracker.ietf.org/doc/html/rfc6455#section-5.3

    const payloadStartPoint = headerLen/8;

    const unmaskedArray = [];

    // problem with interpreting 64-bit payload-len payloads is beneath here somwhere, needs thinking about--------------------------------- might be because of FIN frames??

    if(typeof incommingFrame.payloadLen !== "bigint"){

        for (let i = payloadStartPoint; i < (incommingFrame.payloadLen + payloadStartPoint); i++){

            // unmask bytes by xor-ing the payload bytes against the masking-key bytes
            const unmaskedByte =(data[i] ^ incommingFrame.maskingKey[((i - payloadStartPoint) % 4)]);

            // push to unmasked-array
            unmaskedArray.push(unmaskedByte);

        };

    }else{

        const BigPayloadStartPoint = BigInt(payloadStartPoint);

        for (let i = BigPayloadStartPoint; i < (incommingFrame.payloadLen + BigPayloadStartPoint); i++){

            // unmask bytes by xor-ing the payload bytes against the masking-key bytes
            const unmaskedByte =(data[i] ^ incommingFrame.maskingKey[((i - BigPayloadStartPoint) % 4n)]);

            // push to unmasked-array
            unmaskedArray.push(unmaskedByte);

        };

    };

    // create buffer from unmasked-array
    const payloadBuffer = Buffer.from(unmaskedArray);

    // add payload to incommingFrame-Object
    incommingFrame.payload = payloadBuffer.toString("utf8");

    return incommingFrame;

};