import net from "net";
import { Buffer } from "buffer";
import crypto from "crypto";
import Stream, { Duplex, isReadable } from "stream";
import * as events from "node:events";

// https://nodejs.org/api/cluster.html
// bruke workere, og cluster????

/**   0                   1                   2                   3
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

//https://datatracker.ietf.org/doc/html/rfc6455#section-5.2

// streams https://nodesource.com/blog/understanding-streams-in-nodejs
// how to use streams https://nodejs.org/en/learn/modules/how-to-use-streams

// console.log("\nServer object: ");
// const serv = new net.Server();
// console.log(serv);

// console.log("\nEvents:");
// const evs = events.EventEmitter
// console.log(evs);

// console.log("\nNew Stream:");
// const stuff = new Stream();
// console.log(stuff);

// // // All streams are instances of EventEmitter. https://nodejs.org/docs/latest/api/events.html#class-eventemitter
// console.log("\nNew Duplex:");
// const connect = new Duplex();
// console.log(connect);

// // eksempler på implemetasjon av duplex streams https://nodejs.org/api/stream.html#implementing-a-duplex-stream

class CustomDuplex extends Duplex {
    constructor(source, options) {
        super(options);
        this[source] = source;
    };
    // vurdere transform streams?? https://nodejs.org/api/stream.html#object-mode-duplex-streams
    //                             https://nodejs.org/api/stream.html#implementing-a-transform-stream
    _write(chunk, encoding, callback) {

    };
    // det er dette jeg trenger: ---
    // async generatorer/readable streams https://nodejs.org/api/stream.html#creating-readable-streams-with-async-generators
    //                                    https://nodejs.org/api/stream.html#piping-to-writable-streams-from-async-iterators
    _read(size){

    };
};

async function getChunk(socket) {

    let fullBuffer = Buffer.alloc(0);

    console.log(socket);

    // buffer with \r\n\r\n, for comparison with the end of the incomming chunk
    const endSignal = Buffer.from([13, 10, 13, 10]);

    for await (const chunk of socket) {

        fullBuffer = Buffer.concat([fullBuffer, chunk]);

        if(Buffer.compare(Buffer.copyBytesFrom(fullBuffer, fullBuffer.byteLength-4, 4), endSignal) === 0){

            // return terminates the connection, causes error on clienside
            // return fullBuffer;

            // yield fullBuffer

            console.log(splitLines(fullBuffer));

            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncGenerator

            // https://www.dennisokeeffe.com/blog/2024-07-11-duplex-streams-in-nodejs

            // fullBuffer.fill(0);
            // fullBuffer = null;

        };
    };
};

function splitLines(incommingBuff){

    // convert to strings

    const stringified = incommingBuff.toString();
    const split = stringified.split("\r\n");

    const requestObj = {};

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

    return requestObj;

};


const server = net.createServer(async(socket) => {

    console.log("is readable? :", isReadable(socket), "\n")

    // https://nodejs.org/api/stream.html#readableforeachfn-options

    // https://nodejs.org/api/stream.html#readable-streams

    if(isReadable(socket)){

        // buffer er i hex
        const incommingBuff = await getChunk(socket);

        const requestObj = splitLines(incommingBuff);

        console.log("Request:");
        console.log(requestObj);

        // create response-key
        const acceptKey = crypto
            .createHash("sha1")
            .update(requestObj.sec_websocket_key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
            .digest("base64");

        // opening handshake
        // https://datatracker.ietf.org/doc/html/rfc6455#section-1.3

        // reading client handshake
        // https://datatracker.ietf.org/doc/html/rfc6455#section-4.2.1

        // websocket frames
        // https://datatracker.ietf.org/doc/html/rfc6455#section-5.2

        // create response
        const response = [
            "HTTP/1.1 101 Switching Protocols",
            // `origin: ${requestObj.origin}`,
            `upgrade: websocket`,
            `connection: upgrade`,
            `sec-websocket-accept: ${acceptKey}`,
            `sec-websocket-version: ${requestObj.sec_websocket_version}`,
            `sec-websocket-extensions: ${requestObj.sec_websocket_extensions.split("; ")[0]}`,
            // `subprotocol: null`,
            // `extensions: []`,
             "\r\n"
            ].join("\r\n");

        console.log(`\nResponse:\n${response}`);

        socket.write(Buffer.from(response));

        // incommingBuff.next()


    }else{

        throw new Error("Socket not readable.");

    };

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

