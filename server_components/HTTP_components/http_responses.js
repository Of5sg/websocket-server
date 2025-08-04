import { deflate, gzip } from "zlib";
import { promisify } from "util";
/**

function httpResponse200( socket, page, mimetype, requestObj )

    Socket: (Object)
        - the socket-object returned by net.createServer()

    Page: (String)
        - the page to be displayed
    
    Mimetype: (String)
        - the pages mime type
    
    requestObj: (Object)
        - the object containing the http request from the client

-------------------------------------------------
Description:

    Sends response: 200 OK, and the requested page
 */
export async function httpResponse200(socket, page, mimetype, requestObj){
    // 200 OK

    //turn page into buffer
    let pageBuffer = Buffer.from(page);

    // creating response headers, 200 OK
    const responseHeaders = [
        "HTTP/1.1 200",
        `Content-Type: ${mimetype}`,
        "Cache-control: no-cache",
        ];

    const encoding_requests = requestObj.accept_encoding.split(", ");
    // deflating if requested
    if(encoding_requests.includes("deflate")){

        // make zlib.deflate, a promise
        const Deflate = promisify(deflate);

        // deflate the payload/page
        await Deflate(pageBuffer)
            .then((data) => {
                // assign deflated page to pageBuffer
                pageBuffer = data;
            })
            .catch((err) => {
                console.log(err)
            });

        responseHeaders.push("Content-Encoding: deflate");
    
    }else if(encoding_requests.includes("gzip")){

        // make zlib.deflate, a promise
        const Gzip = promisify(gzip);

        // deflate the payload/page
        await Gzip(pageBuffer)
            .then((data) => {
                // assign deflated page to pageBuffer
                pageBuffer = data;
            })
            .catch((err) => {
                console.log(err)
            });

        responseHeaders.push("Content-Encoding: gzip");
    
    };

    // setting content length after possibly deflating
    responseHeaders.push(`Content-Length: ${pageBuffer.byteLength}`);

    responseHeaders.push("\r\n");

    const headers = responseHeaders.join("\r\n");

    const responseBuffer = Buffer.from(headers);

    // concat full response
    const response = Buffer.concat([responseBuffer, pageBuffer]);

    // send response
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
        "Cache-control: no-cache",
        "\r\n"
        ].join("\r\n");

    // create upgrade request error response
    const errorHeaderBuffer = Buffer.from(resHeaders);

    const errorResponse = Buffer.concat([errorHeaderBuffer, errorPageBuffer]);

    socket.end(errorResponse);
};



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
        "Cache-control: no-cache",
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
        "Cache-control: no-cache",
        "\r\n"
        ].join("\r\n");

    // create error response
    const errorHeaderBuffer = Buffer.from(resHeaders);

    const errorResponse = Buffer.concat([errorHeaderBuffer, errorPageBuffer]);
    
    // send error response
    socket.end(errorResponse);

};