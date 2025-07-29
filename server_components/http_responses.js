

export function httpResponse200(socket, page){
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

export function httpError501(socket){
    // 501 not implemented

    // set headers for upgrade request error response, 501 not implemented
    const resHeaders = [
        "HTTP/1.1 501",
        "\r\n"
        ].join("\r\n");

    // create upgrade request error response
    const errorResponse = new Buffer.from(resHeaders);

    // send upgrade request error response
    socket.write(errorResponse);

};

export function httpError500(socket){
    // 500 internal server error
    
    const errorRes = "<!DOCTYPE html><html><head><title>Error</title></head><body><h3>Error 500, Internal server error</h3></body></html>"

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