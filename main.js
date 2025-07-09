import net from "net";
import { Buffer } from "buffer";
import crypto from "crypto";

//https://datatracker.ietf.org/doc/html/rfc6455#section-5.2

function splitLines(incommingBuff){

    // convert to strings
    const requestObj = {};

    if(incommingBuff !== undefined){

        const stringified = incommingBuff.toString();
        const split = stringified.split("\r\n");

        for (const parameter of split){

            // split http handshake request to key/value
            if(parameter !== "GET / HTTP/1.1" && parameter !== ""){

                const temp = parameter.split(": ");

                // replace all - with _ , so i don't have to have strings as keys.
                requestObj[temp[0].replaceAll("-", "_")] = temp[1];

            }else if(parameter !== ""){

                const temp = parameter.split(" ");
                requestObj["method"] = temp[0];
                requestObj["path"] = temp[1];
                requestObj["protocol"] = temp[2];

            };

        };

    }else{

        requestObj = null;

    };

    return requestObj;

};

function bits(num, len){

    // convert to binary, to see bits

    if(num !== undefined){

        const binary = num.toString(2);
        const bits = binary.padStart(len, 0);
        return bits;

    }else{

        return null;

    };

};

const server = net.createServer(async(socket) => {

    let websock = false;

    // when the websocket-connection is established
    /**  0                   1                   2                   3
         0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
        +-+-+-+-+-------+-+-------------+-------------------------------+
        |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
        |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
        |N|V|V|V|       |S|             |   (if payload len==126/127)   |
        | |1|2|3|       |K|             |                               |
        +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
        |     Extended payload length continued, if payload len == 127  |
        + - - - - - - - - - - - - - - - +-------------------------------+
        |                               |Masking-key, if MASK set to 1  |
        +-------------------------------+-------------------------------+
        | Masking-key (continued)       |          Payload Data         |
        +-------------------------------- - - - - - - - - - - - - - - - +
        :                     Payload Data continued ...                :
        + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
        |                     Payload Data continued ...                |
        +---------------------------------------------------------------+ 
    */

    // https://datatracker.ietf.org/doc/html/rfc6455#section-5.2

    socket.on("data", (data) => {

        if(websock === true){

            // handeling the websocket frames

            console.log("\nwebsocket, reading frame...");

            // bitmasker og bit-manipulasjon https://www.learncpp.com/cpp-tutorial/bit-manipulation-with-bitwise-operators-and-bit-masks/
            // bitwise-operasjoner https://dev.to/stephengade/mastering-bitwise-operations-a-simplified-guide-2031

            // where i contain the headers, after dividing them
            const incommingFrame = {};

            // logging for testpurposes, to see data
            const incommingdata = [...data];
            console.log(incommingdata)

            // logging for testpurposes, to see bits
            // console.log("byte 1:", bits(data[0], 8));
            // console.log("byte 2:", bits(data[1], 8));
            // console.log("byte 3:", bits(data[2], 8));
            // console.log("byte 4:", bits(data[3], 8));
            // console.log("byte 5:", bits(data[4], 8));
            // console.log("byte 6:", bits(data[5], 8));
            // console.log("byte 7:", bits(data[6], 8));
            // console.log("byte 8:", bits(data[7], 8));
            // console.log("byte 9:", bits(data[8], 8));
            // console.log("byte 10:", bits(data[9], 8));
            // console.log("byte 11:", bits(data[10], 8));
            // console.log("byte 12:", bits(data[11], 8));
            // console.log("byte 13:", bits(data[12], 8));
            // console.log("byte 14:", bits(data[13], 8));

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
            if(incommingFrame.payloadLen < 126 && incommingFrame.mask === 1){
                // 32-bit masking-key
                incommingFrame.maskingKey = [data[2], data[3], data[4], data[5]]
                
                headerLen = 48;

            }else if(incommingFrame.payloadLen === 126){
                // 16-bit extended payload-len
                incommingFrame.payloadLen = 
                    (data[2] << 8)|
                    (data[3]);

                headerLen = 32

                if(incommingFrame.mask === 1){
                    // if 126, 32-bit masking-key displaced by 16-bit
                    // byte 5, 6, 7, 8 = masking-key, 16-bit-displacement
                    incommingFrame.maskingKey = [data[4], data[5], data[6], data[7]]

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

            for (let i = payloadStartPoint; i < (incommingFrame.payloadLen + payloadStartPoint); i++){
                
                // // ------ logging for test-purposes
                // console.log("\nincomming bytes")
                // console.log(data[i]);
                // console.log(incommingFrame.maskingKey[((i - 6) % incommingFrame.maskingKey.length)]);
                
                // unmask bytes by xor-ing the the payload bytes against the masking-key bytes
                const unmaskedByte =(data[i] ^ incommingFrame.maskingKey[((i - 6) % incommingFrame.maskingKey.length)]);

                // // ------ logging for test-purposes
                // console.log("unmasked byte:", unmaskedByte)

                // push to unmasked-array
                unmaskedArray.push(unmaskedByte);
            };

            // create buffer from unmasked-array
            const payloadBuffer = Buffer.from(unmaskedArray);

            // logging the headers and the contents of the frame
            console.log("\nFrame Contents:")
            console.log("FIN:", incommingFrame.FIN);
            console.log("RSV1:", incommingFrame.RSV1);
            console.log("RSV2:", incommingFrame.RSV2);
            console.log("RSV3:", incommingFrame.RSV3);
            console.log("opcode:", incommingFrame.opcode);
            console.log("mask:", incommingFrame.mask);
            console.log("Payload len:", incommingFrame.payloadLen);
            console.log("masking-key:", incommingFrame.maskingKey);
            console.log("Payload:", payloadBuffer.toString("utf8"));

            // i still have to write the logic for handling wheter the frame is a FIN frame

        }else{

            // handle http handshake
            // https://datatracker.ietf.org/doc/html/rfc6455#section-4.2.1

            const requestObj = splitLines(data);

            console.log("http request:");
            console.log(requestObj)

            // create response-key
            const acceptKey = crypto
                .createHash("sha1")
                .update(requestObj.sec_websocket_key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
                .digest("base64");

            // create response
            const response = [
                "HTTP/1.1 101 Switching Protocols",
                // `origin: ${requestObj.origin}`,
                `upgrade: websocket`,
                `connection: upgrade`,
                `sec-websocket-accept: ${acceptKey}`,
                `sec-websocket-version: ${requestObj.sec_websocket_version}`,
                // `sec-websocket-extensions: ${requestObj.sec_websocket_extensions.split("; ")[0]}`,
                // `subprotocol: null`,
                // `extensions: []`,
                "\r\n"
                ].join("\r\n");


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

