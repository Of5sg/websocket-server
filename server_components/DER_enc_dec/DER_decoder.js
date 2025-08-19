import { Bits } from "../utils.js";


function SequenceTypeSwitcher(type, entryData){

    console.log("ENTRY DATA:", entryData);

    let resultEntry;
    let decoder = new TextDecoder("utf-8");

    switch(type){
        // BEGINNING OF TYPE FOR LOOP
        case 0x01:  // boolean
            console.log("TYPE:", "Boolean type");
            if(entryData[0] === 0x00){
                resultEntry = false;
            }else{
                resultEntry = true;
            }
            break;
        case 0x02:  // integer
            console.log("TYPE:", "integer type");
            let temp = 0n;
            // i is incrementer, y is multiplier
            for(let i = 0, y = entryData.length; i < entryData.length && y > 0; i++, y--){
                let shift = 8 * (y - 1);
                temp = temp | BigInt(entryData[i] << shift);
            }
            resultEntry = temp;
            break;
        case 0x03: // bit string
            console.log("TYPE:", "bit string");
            break;
        case 0x04:  // octet string
            console.log("TYPE:", "octet type");
            if(entryData[0] === undefined){
                resultEntry = null;
            }
            break;
        case 0x05: // NULL
            console.log("TYPE:", "NULL");
            if (entryData.length === 0){
                resultEntry = null;
            }else{
                resultEntry = "error?"
            }
            break;
        case 0x06: // object identifier
            console.log("TYPE:", "object identifier");
            break;
        case 0x09:  // real value
            console.log("TYPE:", "REAL");
            break;
        case 0x0C:  // UTF8String
            console.log("TYPE:", "UTF8String");
            resultEntry = decoder.decode(entryData);
            break;
        case 0x13:  // Printable string
            console.log("TYPE:", "Printable type");
            resultEntry = decoder.decode(entryData);
            break;
        case 0x16:  // IA5String
            console.log("TYPE:", "IA5String");
            resultEntry = decoder.decode(entryData);
            break;
        case 0x17: // UTC Time
            console.log("TYPE:", "UTC Time");
            let tempUTCTime = (decoder.decode(entryData));
            resultEntry = {
                year: Number(tempUTCTime.slice(0, 2)), 
                month: Number(tempUTCTime.slice(2, 4)), 
                day: Number(tempUTCTime.slice(4, 6)), 
                hour: Number(tempUTCTime.slice(6, 8)), 
                minute: Number(tempUTCTime.slice(8, 10)), 
                second: Number(tempUTCTime.slice(10, 12))
            };
            break;
        case 0x1E:  // BMPString
            console.log("TYPE:", "BMPString");
            const UTF16Decoder = new TextDecoder("utf-16be");
            resultEntry = UTF16Decoder.decode(entryData);
            break;
        case 0x18: // generalized time
            console.log("TYPE:", "GENERALIZED TIME");
            let tempGeneralizedTime = (decoder.decode(entryData));
            resultEntry = {
                year: Number(tempGeneralizedTime.slice(0, 4)), 
                month: Number(tempGeneralizedTime.slice(4, 6)), 
                day: Number(tempGeneralizedTime.slice(6, 8)), 
                hour: Number(tempGeneralizedTime.slice(8, 10)), 
                minute: Number(tempGeneralizedTime.slice(10, 12)), 
                second: Number(tempGeneralizedTime.slice(12, 14))
            };
            break;
        case 0x30:  // SEQUENCE
            console.log("TYPE:", "Sequence type");
            const resultSequence = []; 
            // i skips from entry to entry, per iteration, current position tracks the position inside each entry section
            for (let i = 0, currentPosition = 0; i < entryData.length; i = currentPosition){
                const type = entryData[i];
                currentPosition++;
                let contentLength = 0n;
                if(((entryData[i + 1] & 0b10000000) >> 7) === 0){
                    // short form
                    console.log("SHORT FORM");
                    contentLength = entryData[i+1];
                    currentPosition++;
                }else{
                    // long form
                    console.log("LONG FORM")
                    let lengthOfLengthBytes = entryData[i + 1] & 0b01111111;
                    currentPosition += lengthOfLengthBytes + 1;
                    // y is incrementer, x is multiplier
                    for (let y = (i + 2), x = lengthOfLengthBytes; x > 0; y++, x--){
                        let shifter = (8 * (x - 1));
                        contentLength = contentLength | (BigInt(entryData[y]) << BigInt(shifter));
                    };
                };
                let seqData;
                seqData = entryData.slice(currentPosition, currentPosition + Number(contentLength));
                resultSequence.push(SequenceTypeSwitcher(type, seqData));
                currentPosition += Number(contentLength);
            };
            resultEntry = resultSequence;
            break;
        case 0xA0:  // context-specific
            console.log("TYPE:", "context-specific type");
            break;
        default:
            console.error("TYPE:", "Unrecognized entry type:", type);
            break;
        // END OF TYPE FOR LOOP
    };

    return resultEntry;

};



export function DERDecoder(data){
/*
https://www.itu.int/ITU-T/studygroups/com17/languages/X.690-0207.pdf
IDENTIFIER OCTET:
Class:{    bit      8 | 7
    - universal:        0 | 0
    - Application:      0 | 1
    - Context-specific: 1 | 0
    - Private:          1 | 1
}
Primitive/Constructed:{
    - Primitive:        0
    - Constructed:      1
}
 */
    // object to contain resulting parameters
    const der_object = {};
    // position in data
    let position = 0n;

    // initial data division
    der_object.der_class = (data[0] & 0b11000000) >> 6;
    der_object.primitive_constructed  = (data[0] & 0b00100000) >> 5;
    der_object.tag = (data[0] & 0b00011111);
    der_object.length

    // assign string value to der_class
    switch(der_object.der_class){
        case 0b00000000:
            der_object.der_class = "Universal";
            break;
        case 0b00000001:
            der_object.der_class = "Application";
            break;
        case 0b00000010:
            der_object.der_class = "Context-specific";
            break;
        case 0b00000011:
            der_object.der_class = "Private";
            break;
    };

    // assign string value to primitive_constructed
    if(der_object.primitive_constructed === 0){
        // flat value (string, int, byte-array)
        // must use definite length
        der_object.primitive_constructed = "primitive";
    }else{
        // container of other values (sequence, set)
        // both indefinite and definite are allowed
        der_object.primitive_constructed = "constructed";
    };

    // the possible Universal Tags from ASN.1
    const possibleTags = [
        "RESERVED FOR BER",             // tag nr 0x00, not used in DER
        "BOOLEAN",                      // tag nr 0x01
        "INTEGER",                      // tag nr 0x02
        "BIT STRING",                   // tag nr 0x03
        "OCTET STRING",                 // tag nr 0x04
        "NULL",                         // tag nr 0x05
        "OBJECT IDENTIFIER",            // tag nr 0x06
        "ObjectDescriptor",             // tag nr 0x07, legacy, not implemented
        "INSTANCE OF, EXTERNAL",        // tag nr 0x08, deprecated, not implemented
        "REAL",                         // tag nr 0x09
        "ENUMERATED",                   // tag nr 0x0a
        "EMBEDDED PDV",                 // tag nr 0x0b, obsolete, not implemented
        "UTF8String",                   // tag nr 0x0c
        "RELATIVE-OID",                 // tag nr 0x0d
        "SPACER, ERROR UNDEFINED TAG",  // tag nr 0x0e, spacer
        "SPACER, ERROR UNDEFINED TAG",  // tag nr 0x0f, spacer
        "SEQUENCE, SEQUENCE OF",        // tag nr 0x10
        "SET, SET OF",                  // tag nr 0x11
        "NumericString",                // tag nr 0x12
        "PrintableString",              // tag nr 0x13
        "TeletexString, T61String",     // tag nr 0x14, legacy, not implemented
        "VideotexString",               // tag nr 0x15, obsolete, not implemented
        "IA5String",                    // tag nr 0x16
        "UTCTime",                      // tag nr 0x17
        "GeneralizedTime",              // tag nr 0x18
        "GraphicString",                // tag nr 0x19, legacy, not implemented
        "VisibleString, ISO646String",  // tag nr 0x1a, superceded, not implemented
        "GeneralString",                // tag nr 0x1b, rare, superceded, not implemented
        "UniversalString",              // tag nr 0x1c, superceded, not implemented
        "CHARACTER STRING",             // tag nr 0x1d, abstract type, not used directly
        "BMPString",                    // tag nr 0x1e, replaced by UTF8String
        "EXTENDED TAG FOLLOWING"        // tag nr 0x1f
    ];

    // assign tag, based index-position in the possibleTags array
    der_object.tag = possibleTags[der_object.tag];

    // update position
    position++;

    // calculate length if high tag number
    if (der_object.tag === "EXTENDED TAG FOLLOWING") {
        
        // to store the last 7 bits of each extended tag Byte
        const lengthStorage = [];

        // for while loop
        let looper = true;

        while (looper){

            // push last 7 bits to lengthStorage
            lengthStorage.push((data[position] & 0b01111111));

            // if current Byte is the last in the extended tag length
            if(((data[position] & 0b10000000) >> 7) === 0){
                looper = false;
            };

            // increment position to move forwards in data-indexposition
            position++;

        };

        // for holding the resulting number
        let resultNum = 0n;

        // i is multiplier for bit-shift, y is position in array
        for (let i = lengthStorage.length, y = 0; i > 0; i--, y++){

            // shift bits into place(position) based on multiplier,
            const shift = (7 * (i - 1))

            resultNum = resultNum | (lengthStorage[y] << shift);

        };

        // assign to object
        der_object.extended_Tag = resultNum;

    };

    // establish whether length form is definite or indefinite
    if(der_object.primitive_constructed === "primitive"){

        der_object.content_length_form = "definite";

    }else if(der_object.primitive_constructed === "constructed" && data[1] === 0x80){
        
        der_object.content_length_form = "indefinite";

    }else {
        
        der_object.content_length_form = "definite";

    };


    // extract content Buffer
    if (der_object.content_length_form === "definite"){
        // for definite lengths
        if((data[position] & 0b10000000) >> 7 === 0){
            // short form
            const content_length = (data[position] & 0b01111111);
            position++;
            der_object.content = data.slice(Number(position), Number(position) + Number(content_length));
        }else{
            // long form
            const length_of_content_length = (data[position] & 0b01111111);
            position++;
            let content_length = 0n;
            for (let i = length_of_content_length; i > 0; i--){
                const shift = BigInt(8 * (i - 1));
                // shifting into place
                content_length = content_length | BigInt(data[position]) << shift;

                position++;
            };
            der_object.content = data.slice(Number(position), Number(position) + Number(content_length));
        };
    }else if(der_object.content_length_form === "indefinite"){
        // for indefinite lengths
        position++;
        let looper = true;
        const tempArray = [];

        while(looper){
            if(data[position] === 0x00 && data[position + 1n] === 0x00){
                // end of content
                looper = false;
                position += 2n;
                der_object.content = Buffer.from(tempArray);
            }else{
                tempArray.push(data[position]);
                position++;
            };

        };

    };

    
    switch(der_object.tag){
        // BEGINNING OF TAG SWITCH
        case "BOOLEAN":
            if(der_object.content[0] === 0x00){
                der_object.content = false;
            }else{
                der_object.content = true;
            }
            break;
        case "SEQUENCE, SEQUENCE OF":
            const resultSequence = []; 

            console.log(der_object.content)

            // i skips from entry to entry, per iteration, current position tracks the position inside each entry section
            for (let i = 0, currentPosition = 0; i < der_object.content.length; i = currentPosition){

                console.log("------------------------------------")
                // console.log(der_object.content);
                // BEGINNING OF SEQUENCE FOR LOOP

                const type = der_object.content[i];
                currentPosition++;

                let contentLength = 0n;

                if(((der_object.content[i + 1] & 0b10000000) >> 7) === 0){
                    // short form
                    console.log("SHORT FORM");
                    contentLength = der_object.content[i+1];
                    currentPosition++;

                }else{
                    // long form
                    console.log("LONG FORM")
                    let lengthOfLengthBytes = der_object.content[i + 1] & 0b01111111;
                    currentPosition += lengthOfLengthBytes + 1;

                    // y is incrementer, x is multiplier
                    for (let y = (i + 2), x = lengthOfLengthBytes; x > 0; y++, x--){

                        let shifter = (8 * (x - 1));

                        contentLength = contentLength | (BigInt(der_object.content[y]) << BigInt(shifter));

                    };
                };

                let entryData;


                entryData = der_object.content.slice(currentPosition, currentPosition + Number(contentLength));

                resultSequence.push(SequenceTypeSwitcher(type, entryData));
                console.log("content length:", contentLength)
                currentPosition += Number(contentLength);
                console.log("result sequence", resultSequence)
                console.log("------------------------------------")
                // END OF SEQUENCE FOR LOOP
            };

            der_object.content = resultSequence;
            break;
        case "INTEGER":
            let temp = 0n;
            // i is incrementer, y is multiplier
            for(let i = 0, y = der_object.content.length; i < der_object.content.length && y > 0; i++, y--){
                let shift = 8 * (y - 1);
                temp = temp | BigInt(der_object.content[i] << shift);
            }
            der_object.content = temp;
            break;
        default: 
            console.error("Unrecognized tag");
            console.log(der_object.tag);
            break;
        // END OF TAG SWITCH
    };

    console.log(der_object);

    // END OF DER_DECODER FUNCTION

};


const test = Buffer.from("303A310B300906035504061302555331133011060355040A130A446967694365727420496E63311830160603550403130F7777772E6578616D706C652E636F6D", "hex");
const test4 = Buffer.from("308002010502010A0000", "hex");
const test5 = Buffer.from("3082013004820128" + "AA".repeat(296), "hex");
const test6 = Buffer.from("0101FF", "hex");
const test7 = Buffer.from("010100", "hex");
const test8 = Buffer.from("30090101FF02012A0400", "hex");

const test9 = Buffer.from([

  0x30, 0x53,

  0x01, 0x01, 0xFF,

  0x02, 0x01, 0x2A,

  0x03, 0x02, 0x00, 0xAA,

  0x04, 0x05, 0x68, 0x65, 0x6C, 0x6C, 0x6F,

  0x05, 0x00,

  0x06, 0x06, 0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D,

  0x0C, 0x05, 0x77, 0x6F, 0x72, 0x6C, 0x64,

  0x13, 0x04, 0x54, 0x65, 0x73, 0x74,

  0x16, 0x11, 0x65, 0x6D, 0x61, 0x69, 0x6C, 0x40,
  0x65, 0x78, 0x61, 0x6D, 0x70, 0x6C, 0x65, 0x2E,
  0x63, 0x6F, 0x6D,

  0x17, 0x0D, 0x32, 0x33, 0x30, 0x38, 0x31, 0x36,
  0x31, 0x32, 0x30, 0x30, 0x30, 0x30, 0x5A,

  0x18, 0x0F, 0x32, 0x30, 0x32, 0x35, 0x30, 0x38,
  0x31, 0x36, 0x31, 0x32, 0x30, 0x30, 0x30, 0x30,
  0x5A
]);

const test10 = Buffer.from([0x02, 0x02, 0x01, 0x2A]);

const test11 = Buffer.from([
  0x30, 0x32,             // SEQUENCE (42 bytes)
    0x02, 0x01, 0x01,     // INTEGER 1
    0x0c, 0x06,           // UTF8String (6 bytes)
      0x4a, 0x6f, 0x68, 0x6e, 0x20, 0x44, // "John D"
    0x01, 0x01, 0xff,     // BOOLEAN TRUE
    0x09, 0x03,           // REAL (3 bytes)
      0x80, 0x00, 0x00,   // 0.0 (encoded as binary float)
    0x18, 0x0f,           // GeneralizedTime (15 bytes)
      0x32, 0x30, 0x32, 0x35, 0x30, 0x38, 0x31, 0x39, 
      0x30, 0x39, 0x35, 0x32, 0x30, 0x30, 0x5a, // "20250819095200Z"
    0x30, 0x0b,           // SEQUENCE (11 bytes)
      0x02, 0x01, 0x2a,   // INTEGER 42
      0x13, 0x06,         // printable (6 bytes)
        0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21  // "Hello!"
]);
const test12 = Buffer.from([
  0x30, 0x1f,             // SEQUENCE (31 bytes)
    0x02, 0x01, 0x05,     // INTEGER 5
    0x30, 0x1a,           // SEQUENCE (26 bytes)
      0x0c, 0x05,         // UTF8String (5 bytes)
        0x41, 0x6c, 0x69, 0x63, 0x65, // "Alice"
      0x30, 0x11,         // SEQUENCE (17 bytes)
        0x01, 0x01, 0xff, // BOOLEAN TRUE
        0x02, 0x01, 0x2a, // INTEGER 42
        0x13, 0x08,       // IA5String (8 bytes)
          0x54, 0x65, 0x73, 0x74, 0x69, 0x6e, 0x67, 0x21 // "Testing!"
])

// DERDecoder(test);
// DERDecoder(test4);
// DERDecoder(test5);
// DERDecoder(test6);
// DERDecoder(test7);
// DERDecoder(test8);
// DERDecoder(test9);
// DERDecoder(test10);
// DERDecoder(test11);
// DERDecoder(test12);