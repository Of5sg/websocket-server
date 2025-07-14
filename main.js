import net from "net";
import { Buffer } from "buffer";
import { DeconstFrame } from "./server_components/frame_interpreter.js";
import { ConstrFrame } from "./server_components/frame_constructor.js";
import { Http_Handshake } from "./server_components/http_handshake.js";

//https://datatracker.ietf.org/doc/html/rfc6455#section-5.2

const server = net.createServer(async(socket) => {

    let websock = false;

    // https://datatracker.ietf.org/doc/html/rfc6455#section-5.2

    socket.on("data", (data) => {

        if(websock === true){

            // interpreting frame : ---------------------------------------------------

            const incommingFrame = DeconstFrame(data);

            console.log("\nRequest Frame:\n", incommingFrame);

            // i still have to write the logic for handling wheter the frame is a FIN frame

            // attempt at a response : ------------------------------------------------

            const payload = `\nHer er respons...(Echo-server)---nå gjør vi denne mye lenger, og enda litt---\r\n maskingkey fra request: ${incommingFrame.maskingKey}\r\n payload fra request: ${incommingFrame.payload}`;
            
            const responseFrame = ConstrFrame(payload);

            // for logging, and test-purposes - can be removed
            const testDeconResponse = DeconstFrame(responseFrame);
            console.log("\nResponse Frame:\n", testDeconResponse);

            socket.write(responseFrame);

        }else{

            // handle http handshake
            // https://datatracker.ietf.org/doc/html/rfc6455#section-4.2.1

            const response = Http_Handshake(data);

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

