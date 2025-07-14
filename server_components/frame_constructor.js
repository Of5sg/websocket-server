import { Buffer } from "buffer";

export function ConstrFrame(payload){

    const responsedata = []

    // for å teste
    let responsePayload = Buffer.from(payload, "utf8");

    // building initial response
    responsedata[0] = 
        (1 << 7)|   //FIN
        (0 << 6)|   //RSV1
        (0 << 5)|   //RSV2
        (0 << 4)|   //RSV3
        (0b0001);   //opcode

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
    const attemptResponse = Buffer.concat([responseHeaders, responsePayload]);

    return attemptResponse;
    
};