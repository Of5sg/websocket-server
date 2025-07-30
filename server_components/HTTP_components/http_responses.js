
/**

function httpResponse200( socket, page, mimetype )

    Socket: (Object)
        - the socket-object returned by net.createServer()

    Page: (String)
        - the page to be displayed
    
    Mimetype: (String)
        - the pages mime type

-------------------------------------------------
Description:

    Sends response: 200 OK, and the requested page
 */
export function httpResponse200(socket, page, mimetype){
    // 200 OK

    const pageBuffer = Buffer.from(page);

    // creating response headers, 200 OK
    const responseHeaders = [
        "HTTP/1.1 200",
        `Content-Type: ${mimetype}`,
        `Content-Length: ${pageBuffer.byteLength}`,
        "\r\n"
        ].join("\r\n");

    const responseBuffer = Buffer.from(responseHeaders);

    const response = Buffer.concat([responseBuffer, pageBuffer]);

    // sending response
    socket.end(response);

};



/**

function httpError404( socket )

    Socket: (Object)
        - the socket-object returned by net.createServer()

-------------------------------------------------
Description:

    Writes message: Error 404 not found
 */
export function httpError404(socket){
    // 404 not found

    const errorRes = `<!DOCTYPE html><html lang="nb-no"><head><meta charset="UTF-8"><title>Error</title></head><body><h2>Error 404, not found</h2></body></html>`;

    const errorPageBuffer = Buffer.from(errorRes);

    const resHeaders = [
        "HTTP/1.1 404",
        "Content-Type: text/html",
        `Content-Length: ${errorPageBuffer.byteLength}`,
        "\r\n"
        ].join("\r\n");

    // create upgrade request error response
    const errorHeaderBuffer = Buffer.from(resHeaders);

    const errorResponse = Buffer.concat([errorHeaderBuffer, errorPageBuffer]);

    socket.end(errorResponse);
}



/**

function httpError501( socket )

    Socket: (Object)
        - the socket-object returned by net.createServer()

-------------------------------------------------
Description:

    Writes message: Error 501 not implemented
 */
export function httpError501(socket){
    // 501 not implemented

    const errorRes = `<!DOCTYPE html><html lang="nb-no"><head><meta charset="UTF-8"><title>Error</title></head><body><h2>Error 501, not implemented</h2></body></html>`;

    const errorPageBuffer = Buffer.from(errorRes);

    // set headers for upgrade request error response, 501 not implemented
    const resHeaders = [
        "HTTP/1.1 501",
        "Content-Type: text/html",
        `Content-Length: ${errorPageBuffer.byteLength}`,
        "\r\n"
        ].join("\r\n");

    // create upgrade request error response
    const errorHeaderBuffer = Buffer.from(resHeaders);

    const errorResponse = Buffer.concat([errorHeaderBuffer, errorPageBuffer]);

    // send upgrade request error response
    socket.end(errorResponse);

};



/**

function httpError500( socket )

    Socket: (Object)
        - the socket-object returned by net.createServer()

-------------------------------------------------
Description:

    Writes message: 500 internal server error

 */
export function httpError500(socket){
    // 500 internal server error

    const errorRes = `<!DOCTYPE html><html lang="nb-no"><head><meta charset="UTF-8"><title>Error</title></head><body><h2>Error 500, internal server error</h2></body></html>`;

    const errorPageBuffer = Buffer.from(errorRes);

    // setting error headers, 500 internal server error
    const resHeaders = [
        "HTTP/1.1 500",
        "Content-Type: text/html",
        `Content-Length: ${errorPageBuffer.byteLength}`,
        "\r\n"
        ].join("\r\n");

    // create error response
    const errorHeaderBuffer = Buffer.from(resHeaders);

    const errorResponse = Buffer.concat([errorHeaderBuffer, errorPageBuffer]);
    
    // send error response
    socket.end(errorResponse);

};