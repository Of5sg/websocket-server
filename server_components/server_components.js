import { Buffer } from "buffer";
import { ConstrFrame } from "./frame_constructor.js";
import { Bits } from "./utils.js";

// https://datatracker.ietf.org/doc/html/rfc6455#section-5.2

/**
```
------------------------------------------

function FrameProcessing( completedFrame )

    completedFrame: (Object)
        - This is the Websocket-Frame after we have reassembled the message from the different frames, or when we are sure it is a complete message.

-------------------------------------------

Description:
this function handles the logic of opcode 0x1 and 0x2, when we know the message is complete


*/

export function FrameProcessing(completedFrame){
    switch (completedFrame.opcode){
        case 0x1:
            // text-frame
            completedFrame.payload = completedFrame.payload.toString("utf8");

            console.log("\n\tPayload:\n");
            console.log(completedFrame.payload);
            console.log("\n-------------------------------------------------------\n");
            break;
        case 0x2:
            // binary-frame
            console.log("\n\tPayload:\n");
            console.log(completedFrame.payload);
            console.log("\n-------------------------------------------------------\n");
            break;
        default:
            console.error("opcode not 0x1 or 0x2, opcode:", completedFrame.opcode);
    };
};


/**
```
-----------------------------------------------

function OpcodeSwitch( incommingFrame, socket, pingTimer1, pingTimer2 )

    incommingFrame: (Object)
        - the Frame-Object returned by DeconstFrame()
    
    socket: (Object)
        - the Socket-Object returned by net.createServer()

    pingMessage: (string)
        - the payload of the sent Ping

    pingTimer1: (Double)
        - the time when a ping was sent from the server.

    pingTimer2: (Double)
        - the time when a pong was recieved from the client.

    -----------------------------------------
    "The function has two external" variables, in the socket Object:
    -----------------------------------------

        socket.initialFrameBuffer: (Object)

            - this allows the function to persist the initial frame of a multiframe message.
        
        socket.tempFINPayloadBuffer: (binary-Buffer)

            - this holds the message parts from all the subsequent frames, before they are appended all together to the payload of the initial Frame.
    
    -----------------------------------------

Description:
this function handles the "routing" based on opcodes, and executes the appropriate responses or logic.


*/

export function OpcodeSwitch(incommingFrame, socket, pingMessage, pingTimer1, pingTimer2){

    switch(incommingFrame.opcode){

        case 0x0:   // ----- continuation-frame ----- 

            // push payload to payload-buffer
            socket.tempFINPayloadBuffer = Buffer.concat([socket.tempFINPayloadBuffer, incommingFrame.payload]);
            
            // if final frame in multiframe-message, process the message
            if(incommingFrame.FIN === 1){

                // construct the completed frame from continuation-frames
                incommingFrame = socket.initialFrameBuffer;
                incommingFrame.FIN = 1;
                incommingFrame.payload = socket.tempFINPayloadBuffer;

                // reset buffer variables
                socket.initialFrameBuffer = {};
                socket.tempFINPayloadBuffer = Buffer.alloc(0);

                // process the completed frame
                FrameProcessing(incommingFrame);

            };

            break;


        case 0x1:   // ----- text-frame ----- 

            if(incommingFrame.FIN === 1){

                // process frame
                FrameProcessing(incommingFrame);

            }else if(incommingFrame.FIN === 0){

                // push initial frame to buffer
                socket.initialFrameBuffer = incommingFrame;
                // push payload to payload-buffer
                socket.tempFINPayloadBuffer = Buffer.concat([socket.tempFINPayloadBuffer, incommingFrame.payload]);
            
            };

            break;


        case 0x2:   // ----- binary-frame ----- 

            if(incommingFrame.FIN === 1){

                // process frame
                FrameProcessing(incommingFrame);

            }else if(incommingFrame.FIN === 0){

                // push initial frame to buffer
                socket.initialFrameBuffer = incommingFrame;
                // push payload to payload-buffer
                socket.tempFINPayloadBuffer = Buffer.concat([socket.tempFINPayloadBuffer, incommingFrame.payload]);
            
            };

            break;


        case 0x8:   // ----- close-frame ----- 

            // set statuscode
            let statusCode = 1000;
            // construct closing message
            const closingMessage = ConstrFrame(1, 0x8, statusCode);
            // write closing message
            socket.write(closingMessage);
            // destroy socket
            socket.destroy()

            break;


        case 0x9:   // ----- ping-frame ----- 

            // construct pong-frame
            const pingResponse = ConstrFrame(1, 0xA, incommingFrame.payload);
            // write response
            socket.write(pingResponse);

            break;


        case 0xA:   // ----- pong-frame ----- 

            // here i recieve a pong frame, for a ping i have sent

            if(incommingFrame.payload.toString() === pingMessage){
                console.log("Pong payload returned successfully");
            }else{
                console.warn("WARNING: PONG PAYLOAD MISMATCH");
                console.log("\tPing message:", pingMessage);
                console.log("\tPong response:", incommingFrame.payload.toString());
            };

            console.log("Ping:", (pingTimer2 - pingTimer1), "\n");

            break;

        default:
            // error unknown opcode
            console.error("unknown opcode. \n\topcode:", incommingFrame.opcode);

    };
};


/**
```
-------------------------------------

function TCPBuffToFrame( streamBuffer )

    streamBuffer: (buffer)
        - the Buffer that holds the incomming datapackets from the TCP-Stream

Returns:
    (length of Frame, as BigInt) | null

-------------------------------------

Description:
This function assumes we have recieved the datapackets in the right order.

It establishes the length of the Websocket-Frame, then checks if the total Byte-length of the frame is more than the Byte-length of the buffer.

    -if true, the server should wait for the next datapacket to arrive on the TCP-stream\(the next socket.on("data") event) and run the function again.
    
    -if false, the server can continue, and read the entire frame.
 
 
*/

export function TCPBuffToFrame(streamBuffer){

    // Length of final frame
    let frameLengt = 2n;

    // Byte 2, read from second byte in buffer to get length of Frame
    const mask = (streamBuffer[1] & 0b10000000) >> 7;
    const payload_len = (streamBuffer[1] & 0b01111111);

    if (payload_len <= 125){
        // add length of payload
        frameLengt += BigInt(payload_len);

        if(mask === 1){
            // add length of masking key
            frameLengt += 4n;
        };

    }else if (payload_len === 126){
        // read length of payload from Buffer
        const ext_payload_len = streamBuffer.readUInt16BE(2);
        // add lenght of header
        frameLengt += 2n;
        // add length of payload
        frameLengt += BigInt(ext_payload_len);

        if (mask === 1){
            // add length of masking key
            frameLengt += 4n;
        };

    }else if (payload_len === 127){
        // read length of payload from Buffer
        const ext_payload_len = streamBuffer.readBigUInt64BE(2);
        // add lenght of header
        frameLengt += 8n;
        // add length of payload
        frameLengt += ext_payload_len;
        
        if (mask === 1){
            // add length of masking key
            frameLengt += 4n;
        };

    }else{
        console.error("payload_len out of range(max = 127). payload_len:", payload_len);
    };

    if(frameLengt <= streamBuffer.byteLength){

        return frameLengt;

    }else{

        // if the entire frame has not yet arrived
        return null;

    };
    
};

//temporary websocket Frame for testing purposes
const frame = {
  FIN: 1,
  RSV1: 0,
  RSV2: 0,
  RSV3: 0,
  opcode: 1,
  mask: 1,
  payloadLen: 53,
  maskingKey: [ 78, 55, 73, 221 ],
  headerLen: 6,
  payload: Buffer.from("Nå funker det, her er første melding. her er første med repetisjon.", "utf8")
};

export function WebsocketDeflate(websocketFrame){

    // https://datatracker.ietf.org/doc/html/rfc1951#section-4

    /*
    4. Compression algorithm details

   While it is the intent of this document to define the "deflate"
   compressed data format without reference to any particular
   compression algorithm, the format is related to the compressed
   formats produced by LZ77 (Lempel-Ziv 1977, see reference [2] below);
   since many variations of LZ77 are patented, it is strongly
   recommended that the implementor of a compressor follow the general
   algorithm presented here, which is known not to be patented per se.
   The material in this section is not part of the definition of the
   specification per se, and a compressor need not follow it in order to
   be compliant.

   The compressor terminates a block when it determines that starting a
   new block with fresh trees would be useful, or when the block size
   fills up the compressor's block buffer.

   The compressor uses a chained hash table to find duplicated strings,
   using a hash function that operates on 3-byte sequences.  At any
   given point during compression, let XYZ be the next 3 input bytes to
   be examined (not necessarily all different, of course).  First, the
   compressor examines the hash chain for XYZ.  If the chain is empty,
   the compressor simply writes out X as a literal byte and advances one
   byte in the input.  If the hash chain is not empty, indicating that
   the sequence XYZ (or, if we are unlucky, some other 3 bytes with the
   same hash function value) has occurred recently, the compressor
   compares all strings on the XYZ hash chain with the actual input data
   sequence starting at the current point, and selects the longest
   match.

   The compressor searches the hash chains starting with the most recent
   strings, to favor small distances and thus take advantage of the
   Huffman encoding.  The hash chains are singly linked. There are no
   deletions from the hash chains; the algorithm simply discards matches
   that are too old.  To avoid a worst-case situation, very long hash
   chains are arbitrarily truncated at a certain length, determined by a
   run-time parameter.

   To improve overall compression, the compressor optionally defers the
   selection of matches ("lazy matching"): after a match of length N has
   been found, the compressor searches for a longer match starting at
   the next input byte.  If it finds a longer match, it truncates the
   previous match to a length of one (thus producing a single literal
   byte) and then emits the longer match.  Otherwise, it emits the
   original match, and, as described above, advances N bytes before
   continuing.

   Run-time parameters also control this "lazy match" procedure.  If
   compression ratio is most important, the compressor attempts a
   complete second search regardless of the length of the first match.
   In the normal case, if the current match is "long enough", the
   compressor reduces the search for a longer match, thus speeding up
   the process.  If speed is most important, the compressor inserts new
   strings in the hash table only when no match was found, or when the
   match is not "too long".  This degrades the compression ratio but
   saves time since there are both fewer insertions and fewer searches.
    */

    const data = websocketFrame.payload;
    // block-buffer size ?? 65KB ?? for RAW ??
    // block-buffer size ?? 32KB ?? for compressed ??
    // dynamic block buffer size ?? grow dynamically or chunked buffers ??
    const hashTable = [[], [], []];

};

// calling the function for testing-purposes
WebsocketDeflate(frame);

//----------------------------

export function WebsocketInflate(websocketFrame){

    // Deflate is little endian
    // this is written just for testing, and trying to make the Inflate function

    /*
    do
        read block header from input stream.
        if stored with no compression
            skip any remaining bits in current partially
                processed byte
            read LEN and NLEN (see next section)
            copy LEN bytes of data to output
        otherwise
            if compressed with dynamic Huffman codes
                read representation of code trees (see
                subsection below)
            loop (until end of block code recognized)
                decode literal/length value from input stream
                if value < 256
                copy value (literal byte) to output stream
                otherwise
                if value = end of block (256)
                    break from loop
                otherwise (value = 257..285)
                    decode distance from input stream

                    move backwards distance bytes in the output
                    stream, and copy length bytes from this
                    position to the output stream.
            end loop
    while not last block
    */

    /*
    ukomprimert
    BFIN = ( 1 if last | 0 if not last) block
    Btype = 00 for uncompressed Bytes
    1 bit| 2 bit | 5 bit |2 Byte |2 Byte |
    +--------------------+---+---+---+---+================================+
    |BFIN| Btype |padding|  LEN  | NLEN  |... LEN bytes of literal data...|
    +--------------------+---+---+---+---+================================+

    komprimert
    BFIN = same as above
    Btype = 01 for static Huffman, 10 for Dynamic Huffman:
        Btype = 01:
            Static = literal/length and distance trees are hardcoded in RFC 1951
        Btype = 10:
            Dynamic = check internet
    */

    const BFIN = (0b10000000 & testBuffer[0]) >> 7;
    const Btype = (0b01100000 & testBuffer[0]) >> 5;

    // make 16-bit LEN and NLEN
    const LEN = (testBuffer[1]) | (testBuffer[2] << 8);
    const NLEN = (testBuffer[3]) | (testBuffer[4] << 8);

    console.log(BFIN);
    console.log(Btype);
    console.log(Bits(testBuffer[2], 8), Bits(testBuffer[1], 8));
    console.log(Bits(LEN, 16));
    console.log(LEN)
    console.log(Bits(NLEN, 16))
    console.log(NLEN);

    // for (const item of testBuffer){
    //     console.log(Bits(item, 8));
    // };

};

// WebsocketInflate(string);

