/*
    https://datatracker.ietf.org/doc/html/rfc6455#section-1.2

    The handshake from the client looks as follows:

        GET /chat HTTP/1.1
        Host: server.example.com
        Upgrade: websocket
        Connection: Upgrade
        Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
        Origin: http://example.com
        Sec-WebSocket-Protocol: chat, superchat
        Sec-WebSocket-Version: 13

    The handshake from the server looks as follows:

        HTTP/1.1 101 Switching Protocols
        Upgrade: websocket
        Connection: Upgrade
        Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
        Sec-WebSocket-Protocol: chat 

*/

// window.crypto.getRandomValues();

/*
1.3.  Opening Handshake

   _This section is non-normative._

   The opening handshake is intended to be compatible with HTTP-based
   server-side software and intermediaries, so that a single port can be
   used by both HTTP clients talking to that server and WebSocket
   clients talking to that server.  To this end, the WebSocket client's
   handshake is an HTTP Upgrade request:

        GET /chat HTTP/1.1
        Host: server.example.com
        Upgrade: websocket
        Connection: Upgrade
        Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
        Origin: http://example.com
        Sec-WebSocket-Protocol: chat, superchat
        Sec-WebSocket-Version: 13
*/ 

// //------------------------------------------

// let socket;

// self.onmessage = (mess) => {

//     console.log(mess);

//     let baseUrl = "";

//     console.log(baseUrl);

//     if(mess.data.split("-:-")[0] === "base_Url#aB29sal2108vnjksdhgmkjfhuiu"){
    
//         baseUrl = mess.data.split("-:-")[1];
    
//         socket = new WebSocket(`wss://${baseUrl.slice(8)}`);
    
//         socket.send("connection established!! :)");
    
//     }else{
    
//         socket.send(mess.data);
    
//     };

// };

// if(socket instanceof WebSocket){

//     socket.addEventListener("open", () => {

//         socket.send("start");

//     });

// };

// //--------------------------------------------

    
const socket = new WebSocket(`ws://localhost:8000`);

// socket.send("connection established!! :)");

socket.addEventListener("open", () => {

    socket.send("start");

});