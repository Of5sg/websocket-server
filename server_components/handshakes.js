import { splitLines } from "./utils.js";
import crypto from "crypto";

/**
```
----------------------------

function Opening_Handshake( data )

    data: (Buffer)
        - the opening handshake from the client.

Returns: (Buffer)
    -the server-side handshake, accepting the connection

-----------------------------

Description:
this function takes the client-handshake, and creates a response.
*/
export function Opening_Handshake(data){

    // https://datatracker.ietf.org/doc/html/rfc6455#section-4.2.1

    const requestObj = splitLines(data);

    // create response-key
    const acceptKey = crypto
        .createHash("sha1")
        .update(requestObj.sec_websocket_key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
        .digest("base64");

    // create response
    const responseHeaders = [
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

    const response = Buffer.from(responseHeaders);

    return response;
    
};
