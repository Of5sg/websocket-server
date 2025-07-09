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

function bits(num){
    const binary = num.toString(2);
    const bits = binary.padStart(8, 0);
    return bits;
}

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

            console.log("websocket, reading frame...");

            // bitmasker og bit-manipulasjon https://www.learncpp.com/cpp-tutorial/bit-manipulation-with-bitwise-operators-and-bit-masks/
            // bitwise-operasjoner https://dev.to/stephengade/mastering-bitwise-operations-a-simplified-guide-2031

            // where i contain the headers, after dividing them
            const incommingFrame = {};

            // getting the individual bytes from the data
            const byte1 = data[0];
            const byte2 = data[1];
            const byte3 = data[2];
            const byte4 = data[3];
            const byte5 = data[4];
            const byte6 = data[5];
            const byte7 = data[6];
            const byte8 = data[7];
            const byte9 = data[8];
            const byte10 = data[9];

            // logging for testpurposes, to see data
            const incommingdata = [...data];
            console.log(incommingdata)

            // logging for testpurposes, to see bits
            console.log("byte 1:", bits(byte1));
            console.log("byte 2:", bits(byte2));
            console.log("byte 3:", bits(byte3));
            console.log("byte 4:", bits(byte4));
            console.log("byte 5:", bits(byte5));
            console.log("byte 6:", bits(byte6));
            console.log("byte 7:", bits(byte7));
            console.log("byte 8:", bits(byte8));
            console.log("byte 9:", bits(byte9));
            console.log("byte 10:", bits(byte10));

            // length of header, before payload
            let headerLen = 16;

            // headers
            incommingFrame.FIN = (byte1 & 0b10000000) >> 7;
            incommingFrame.RSV1 = (byte1 & 0b01000000) >> 6;
            incommingFrame.RSV2 = (byte1 & 0b00100000) >> 5;
            incommingFrame.RSV3 = (byte1 & 0b00010000) >> 4;
            incommingFrame.opcode = (byte1 & 0b00001111);
            incommingFrame.mask = (byte2 & 0b10000000) >> 7;
            incommingFrame.payloadLen = (byte2 & 0b01111111);
            if(incommingFrame.payloadLen < 126 && incommingFrame.mask === 1){
                // 32-bit masking-key
                // incommingFrame.maskingKey = ()

                headerLen = 48;

            }else if(incommingFrame.payloadLen === 126){
                // 16-bit extended payload-len
                const ext_16_bit_Payload_Len = bits(byte3) + bits(byte4);
                incommingFrame.payloadLen = parseInt(ext_16_bit_Payload_Len);

                headerLen = 32

                if(incommingFrame.mask === 1){
                    // hvis 126, 32-bit masking-key forskjøvet med 16-bit

                    headerLen = 64;
                };
            }else if(incommingFrame.payloadLen === 127){
                // 64-bit extended payload-len
                const ext_64_bit_Payload_Len = bits(byte3) + bits(byte4) + bits(byte5) + bits(byte6) + bits(byte7) + bits(byte8) + bits(byte9) + bits(byte10);
                incommingFrame.payloadLen = parseInt(ext_64_bit_Payload_Len);
                headerLen = 80;

                if(incommingFrame.mask === 1){
                    //hvis 127, 32-bit masking-key forskjøvet med 64-bit

                    headerLen = 112;
                };
            };

            console.log("\nFrame Contents:")
            console.log("FIN:", incommingFrame.FIN);
            console.log("RSV1:", incommingFrame.RSV1);
            console.log("RSV2:", incommingFrame.RSV2);
            console.log("RSV3:", incommingFrame.RSV3);
            console.log("opcode:", incommingFrame.opcode);
            console.log("mask:", incommingFrame.mask);
            console.log("Payload len:", incommingFrame.payloadLen);

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

