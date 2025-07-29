
/**

function httpResponse200html( socket, page )

    Socket: (Object)
        - the socket-object returned by net.createServer()

    Page: (String)
        - the page to be displayed

-------------------------------------------------
Description:

    Sends response: 200 OK, and the requested page
 */
export function httpResponse200html(socket, page){
    // 200 OK

    // creating response headers, 200 OK
    const responseHeaders = [
        "HTTP/1.1 200",
        "Content-Type: text/html",
        `Content-Length: ${page.length}`,
        "\r\n"
        ].join("\r\n");

    // creating full response
    const responseString = responseHeaders + page;

    const response = new Buffer.from(responseString);

    // sending response
    socket.write(response);

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

    const errorRes = "<!DOCTYPE html><html><head><title>Error</title></head><body><h2>Error 404, not found</h2></body></html>"

    const resHeaders = [
        "HTTP/1.1 404",
        "Content-Type: text/html",
        `Content-Length: ${errorRes.length}`,
        "\r\n"
        ].join("\r\n");

    // create upgrade request error response
    const errorResponseString = resHeaders + errorRes;

    const errorResponse = new Buffer.from(errorResponseString);

    socket.write(errorResponse);
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

    const errorRes = "<!DOCTYPE html><html><head><title>Error</title></head><body><h2>Error 501, not implemented</h2></body></html>"

    // set headers for upgrade request error response, 501 not implemented
    const resHeaders = [
        "HTTP/1.1 501",
        "Content-Type: text/html",
        `Content-Length: ${errorRes.length}`,
        "\r\n"
        ].join("\r\n");

    // create upgrade request error response
    const errorResponseString = resHeaders + errorRes;

    const errorResponse = new Buffer.from(errorResponseString);

    // send upgrade request error response
    socket.write(errorResponse);

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

    const errorRes = "<!DOCTYPE html><html><head><title>Error</title></head><body><h2>Error 500, Internal server error</h2></body></html>"

    // setting error headers, 500 internal server error
    const resHeaders = [
        "HTTP/1.1 500",
        "Content-Type: text/html",
        `Content-Length: ${errorRes.length}`,
        "\r\n"
        ].join("\r\n");

    // create error response
    const errorResponseString = resHeaders + errorRes;

    const errorResponse = new Buffer.from(errorResponseString);
    
    // send error response
    socket.write(errorResponse);

};