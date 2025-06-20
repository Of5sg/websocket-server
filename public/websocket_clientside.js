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

// window.crypto.getRandomValues()


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