import { Buffer } from "buffer";

/**
```

function ConstrFrame( FIN, opcode, payload, socket )

    FIN: (int) 
        1 - final message, no continuation frames after, 
        0 - not final message, continuation frames following

    opcode: (int)
        ( decimal| hex | binary )  -  choose one:

        (      0 | 0x0 | 0b0000 )  -  for continuation-frame,
        (      1 | 0x1 | 0b0001 )  -  for text-frame,
        (      2 | 0x2 | 0b0010 )  -  for binary-frame,
        (      8 | 0x8 | 0b1000 )  -  for close-frame,
        (      9 | 0x9 | 0b1001 )  -  for ping-frame,
        (     10 | 0xA | 0b1010 )  -  for pong-frame

    payload: (string | binary).

    socket: (Object)
        - the socket object returned by net.createServer


Returns: (Buffer)
    - the response frame, as a Buffer

-----------------------------------
(for clarity: | means or, choose one)
----------------------------------- 

Description:
this function constructs the response-Frame.
*/

export function ConstrFrame(FIN, opcode, payload, socket){

    // For RSV1 and extensions: https://datatracker.ietf.org/doc/html/rfc7692

    const options = {
        RSV1: socket.state.RSV1,
        RSV2: socket.state.RSV2,
        RSV3: socket.state.RSV3
    };

    // Building response from here

    const responsedata = []

    let responsePayload = Buffer.from(payload, "utf8");

    // building initial response
    responsedata[0] = 
        (FIN << 7)|             //FIN
        (options.RSV1 << 6)|    //RSV1
        (options.RSV2 << 5)|    //RSV2
        (options.RSV3 << 4)|    //RSV3
        (opcode);               //opcode

    if (responsePayload.byteLength < 126){

        responsedata[1] = 
            (0 << 7)|   //Mask
            (responsePayload.byteLength);//payload-length

    }else if (responsePayload.byteLength >= 126 && responsePayload.byteLength <= 65535){

            responsedata[1] = 
            (0 << 7)|   //Mask
            (0b1111110);//payload-length 126

            // constructing extended-payload-length
            const tempBuffer = Buffer.alloc(2);

            tempBuffer.writeUInt16BE(responsePayload.byteLength);

            responsedata.push(...tempBuffer);

    }else{
            responsedata[1] = 
            (0 << 7)|   //Mask
            (0b1111111);//payload-length 127

            // constructing extended-payload-length
            const tempBuffer = Buffer.alloc(8);

            tempBuffer.writeBigUInt64BE(BigInt(responsePayload.byteLength));

            responsedata.push(...tempBuffer);
    };

    const responseHeaders = Buffer.from(responsedata);
    const response = Buffer.concat([responseHeaders, responsePayload]);

    return response;
    
};
