import { Buffer } from "buffer";

/**
```
ConstrFrame( FIN, opcode, payload )
    FIN: 
        1  final message, no continuation frames after, 
        0  not final message, continuation frames following
    opcode:
        0   for continuation-frame,
        1   for text-frame,
        2   for binary-frame,
        8   for close-frame,
        9   for ping-frame,
        10  for pong-frame
    payload:
        string or binary
*/
export function ConstrFrame(FIN, opcode, payload){

    const responsedata = []

    let responsePayload = Buffer.from(payload, "utf8");

    // building initial response
    responsedata[0] = 
        (FIN << 7)|   //FIN
        (0 << 6)|   //RSV1
        (0 << 5)|   //RSV2
        (0 << 4)|   //RSV3
        (opcode);   //opcode

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
