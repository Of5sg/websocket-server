import net from "net";
import { Buffer } from "buffer";
import crypto from "crypto";


/*
for testing

nc localhost 8000

GET / HTTP/1.1\r\n
Host: localhost:8000\r\n
Upgrade: websocket\r\n
Connection: upgrade\r\n
Sec-WebSocket-Key: dGhlIHNhbXBsZSB\r\n
Sec-WebSocket-Version: 13\r\n\r\n
*/


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

const server = net.createServer((socket) => {

    socket.setEncoding("utf8");

    


    socket.once("data", (data) => {

        console.log(data);



        // handshake
        // https://datatracker.ietf.org/doc/html/rfc6455#section-4.2.1
        
        /**4.2.1.  Reading the Client's Opening Handshake

            When a client starts a WebSocket connection, it sends its part of the
            opening handshake.  The server must parse at least part of this
            handshake in order to obtain the necessary information to generate
            the server part of the handshake.

            The client's opening handshake consists of the following parts.  If
            the server, while reading the handshake, finds that the client did
            not send a handshake that matches the description below (note that as
            per [RFC2616], the order of the header fields is not important),
            including but not limited to any violations of the ABNF grammar
            specified for the components of the handshake, the server MUST stop
            processing the client's handshake and return an HTTP response with an
            appropriate error code (such as 400 Bad Request).

            1.   An HTTP/1.1 or higher GET request, including a "Request-URI"
                    [RFC2616] that should be interpreted as a /resource name/
                    defined in Section 3 (or an absolute HTTP/HTTPS URI containing
                    the /resource name/).

            2.   A |Host| header field containing the server's authority.

            3.   An |Upgrade| header field containing the value "websocket",
                    treated as an ASCII case-insensitive value.

            4.   A |Connection| header field that includes the token "Upgrade",
                    treated as an ASCII case-insensitive value.

            5.   A |Sec-WebSocket-Key| header field with a base64-encoded (see
                    Section 4 of [RFC4648]) value that, when decoded, is 16 bytes in
                    length.

            6.   A |Sec-WebSocket-Version| header field, with a value of 13.

            7.   Optionally, an |Origin| header field.  This header field is sent
                    by all browser clients.  A connection attempt lacking this
                    header field SHOULD NOT be interpreted as coming from a browser
                    client.

            8.   Optionally, a |Sec-WebSocket-Protocol| header field, with a list
                    of values indicating which protocols the client would like to
                    speak, ordered by preference.

            9.   Optionally, a |Sec-WebSocket-Extensions| header field, with a
                    list of values indicating which extensions the client would like
                    to speak.  The interpretation of this header field is discussed
                    in Section 9.1.

            10.  Optionally, other header fields, such as those used to send
                    cookies or request authentication to a server.  Unknown header
                    fields are ignored, as per [RFC2616]. 
                    
        */


    });

    socket.on("data", (data) => {


        // https://datatracker.ietf.org/doc/html/rfc6455#section-5.2

        /*   0                   1                   2                   3
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

        // data.readUintBE(9, 7);

        console.log(data, "mer data");
    });

    socket.on("end", () => {
        console.log("client disconnected");
    });

});

server.listen(8000, () => {
    console.log("server started on port 8000");
});