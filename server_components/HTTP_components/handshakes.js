import crypto from "crypto";

/**
```
----------------------------

function Opening_Handshake( data )

    requestObj: (Object)
        - the opening handshake from the client, turned into an Object.

Returns: (Buffer)
    -the server-side handshake, accepting the connection

-----------------------------

Description:
this function takes the client-Websocket-handshake, and creates a response.
*/
export function Opening_Handshake(socket, requestObj) {
  // create response-key
  const acceptKey = crypto
    .createHash("sha1")
    .update(requestObj.sec_websocket_key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
    .digest("base64")
  ;
  
  // create response
  let responseHeaders = [
    "HTTP/1.1 101 Switching Protocols",
    `Upgrade: websocket`,
    `Connection: upgrade`,
    `Sec-WebSocket-Accept: ${acceptKey}`
  ]

  if(socket.state.websocket_permessage_deflate){
    responseHeaders.push(`Sec-WebSocket-Extensions: ${extensions}`);
  };

  responseHeaders.push("\r\n");

  responseHeaders = responseHeaders.join("\r\n");

  // logging for test purposes
  // console.log("response:\n", responseHeaders);

  const response = Buffer.from(responseHeaders);

  return { res: response };
}
