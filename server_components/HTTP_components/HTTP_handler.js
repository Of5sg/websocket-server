import { readFileSync } from "fs";
import { Opening_Handshake } from "./handshakes.js";
import * as httpResponse from "./http_responses.js";
import { splitLines } from "../utils.js";
import { TLSRedirect } from "../TLS/TLS.js";

export function HTTPRouting(data, socket) {
  const requestObj = splitLines(data);

  // if (requestObj.upgrade_insecure_requests === "1"){
  //   // send 307 temporary redirect
  //   TLSRedirect(requestObj, socket);
  //   return;
  // };

  console.log(requestObj); // for logging the HTTP-Request

  switch (requestObj.path) {
    case "/":
      if (requestObj.method === "GET") {
        // logic for sendig home page
        try {
          // loading the html
          const homePage = readFileSync("./test.html", {
            encoding: "utf8",
          });

          // sending http response, 200 OK
          httpResponse.httpResponse200(
            socket,
            homePage,
            "text/html",
            requestObj,
          );
        } catch (error) {
          console.error("Problem sending Homepage");
          console.error(error);

          // sending http error, 500 internal server error
          httpResponse.httpError500(socket);
        };
      }

      break;

    case "/styles.css":
      if (requestObj.method === "GET") {
        try {
          const stylesheet = readFileSync("./public/styles.css", {
            encoding: "utf8",
          });

          httpResponse.httpResponse200(
            socket,
            stylesheet,
            "text/css",
            requestObj,
          );
        } catch (error) {
          console.error("Error:\n", error);

          httpResponse.httpError500(socket);
        };
      };

      break;

    case "/webworker.js":
      if (requestObj.method === "GET") {
        try {
          const script = readFileSync("./public/webworker.js", {
            encoding: "utf8",
          });

          httpResponse.httpResponse200(
            socket,
            script,
            "application/javascript",
            requestObj,
          );
        } catch (error) {
          console.error("Error:\n", error);

          httpResponse.httpError500(socket);
        };
      };

      break;

    case "/favicon.png":
      if (requestObj.method === "GET") {
        try {
          const icon = readFileSync("./public/favicon.png");
          httpResponse.httpResponse200(
            socket,
            icon,
            "image/x-icon",
            requestObj,
          );
        } catch (error) {
          console.error("Error sending favicon:\n", error);
          httpResponse.httpError500(socket);
        };
      };

      break;

    case "/socketconnection":
      // for upgrading to websocket connection
      let connection = requestObj.connection;
      connection = connection.toLowerCase().split(", ");

      if (connection.includes("upgrade")) {
        // if request is for upgrade

        if (requestObj.upgrade === "websocket") {
          // if upgrade request is for websocket

          // http-handshake
          const response = Opening_Handshake(socket, requestObj);

          socket.write(response.res);

          // setting websock to true, indicating websocket-connection
          socket.state.websocket_connection = true;

        } else {
          // if upgrade request is for anything other than WebSocket, Error

          console.error("Unrecognized upgrade request");

          console.error(requestObj.upgrade);

          httpResponse.httpError501(socket);

        };
      };

      break;

    default:

      console.error("Unknown path:", requestObj.path);

      // send response 404 not found
      httpResponse.httpError404(socket);

      break;
  };
};
