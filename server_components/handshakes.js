import { splitLines } from "./utils.js";
import crypto from "crypto";

export function Opening_Handshake(data){

    // https://datatracker.ietf.org/doc/html/rfc6455#section-4.2.1

    const requestObj = splitLines(data);

    // console.log("http request:");
    // console.log(requestObj)

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

    return response;
    
};

export function Closing_Handshake(){
    
}