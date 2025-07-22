import { Bits } from "./utils.js";

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
    
    const hashTable = []; // Hash table [[], [], []];

    let searchString = "";
    
    const searchWindow = [];

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
