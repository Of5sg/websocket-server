import net from "net";
import { readFileSync } from "fs";
import { Opening_Handshake } from "./server_components/HTTP_components/handshakes.js";
import { ConstrFrame } from "./server_components/WebSocket_components/frame_constructor.js";
import { FrameHandling } from "./server_components/WebSocket_components/websocket_server_components.js";
import { RandomString, splitLines } from "./server_components/utils.js";
import { SocketInit } from "./server_components/general_server_components.js";
import * as httpRes from "./server_components/HTTP_components/http_responses.js";

//https://datatracker.ietf.org/doc/html/rfc6455#section-5.2

const server = net.createServer((socket) => {

    SocketInit(socket);

    // sending a websocket ping to the client, if connection is websocket
    setInterval(() => {
        if(socket.state.websocket_connection === true){
            socket.localTemp.pingMessage = RandomString(15);
            const pingFrame = ConstrFrame(1, 0x9, socket.localTemp.pingMessage);
            socket.localTemp.pingTimer1 =  performance.now();
            socket.write(pingFrame);
        };
    }, 2000);

    // data event
    socket.on("data", (data) => {

        // for ping and pong frames, this is when the pong is recieved.
        socket.localTemp.pingTimer2 = performance.now();

        
        if(socket.state.websocket_connection === true){
            
            // if websocket-connection

            FrameHandling(data, socket);

        }else{

            // if not websocket-connection

            const requestObj = splitLines(data);

            console.log(requestObj);

            switch(requestObj.path){

                case "/":

                    if(requestObj.method === "GET"){

                        // logic for sendig home page
                        try{

                            // loading the html
                            const homePage = readFileSync("./test.html", {encoding: "utf8"});
                            
                            // sending http response, 200 OK
                            httpRes.httpResponse200html(socket, homePage);

                        }catch(error){

                            console.error("Problem sending Homepage");
                            console.error(error);

                            // sending http error, 500 internal server error
                            httpRes.httpError500(socket);

                        };
                    };

                    break;

                case "/socketconnection":

                    // for upgrading to websocket
                    if(requestObj.connection === "upgrade"){
                        // if request is for upgrade

                        if(requestObj.upgrade === "websocket"){
                            // if upgrade request is for websocket

                            // http-handshake
                            const response = Opening_Handshake(requestObj);
                            socket.write(response.res);

                            // setting websock to true, indicating websocket-connection
                            socket.state.websocket_connection = true;

                        }else{

                            // if upgrade request is for anything other than WebSocket
                            console.error("Unrecognized upgrade request");
                            console.error(requestObj.upgrade);
                            
                            httpRes.httpError501(socket);

                        };

                    };

                    break;

                default:

                    console.error("Unknown path", requestObj.path);

                    // send response 404 not found
                    httpRes.httpError404(socket);

                    break;
            };
        };
    });

    socket.once("end", () => {

        console.log(`-----\n\nrecieved closing handshake from:\n\n\tremoteAddress\t${socket.remoteAddress}\n\non:\n\n\tlocalPort\t${socket.localPort}\n\tlocalAddress\t${socket.localAddress}\n\n-----`);

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

