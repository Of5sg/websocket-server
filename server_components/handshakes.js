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

    console.log(data.toString());

    // https://datatracker.ietf.org/doc/html/rfc6455#section-4.2.1

    const requestObj = splitLines(data);

    console.log(requestObj);

    // handling extensions
    let extensions = "";

    let deflate = {
        permessage_deflate: false,
        client_max_window_bits: false
    };
    
    const clientExtensions = requestObj.sec_websocket_extensions.split("; ");

    if (clientExtensions.includes("permessage-deflate")){

        extensions += "permessage-deflate";

        deflate.permessage_deflate = true;

        if (clientExtensions.includes("client_max_window_bits")){

            extensions += "; client_max_window_bits";

            deflate.client_max_window_bits = true;
        };
    };

    // create response-key
    const acceptKey = crypto
        .createHash("sha1")
        .update(requestObj.sec_websocket_key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
        .digest("base64");

    // create response
    const responseHeaders = [
        "HTTP/1.1 101 Switching Protocols",
        `Upgrade: websocket`,
        `Connection: upgrade`,
        `Sec-WebSocket-Accept: ${acceptKey}`,
        `Sec-WebSocket-Extensions: ${extensions}`,
        "\r\n"
        ].join("\r\n");

    console.log("response:\n", responseHeaders)
    const response = Buffer.from(responseHeaders);

    return {res: response, deflate: deflate};
    
};
