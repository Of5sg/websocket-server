
export function Bits(num, len){

    // convert to binary, to see bits

    if(num !== undefined){

        const binary = num.toString(2);
        const bits = binary.padStart(len, 0);
        return bits;

    }else{

        return null;

    };

};

export function splitLines(incommingBuff){

    // convert to strings
    const requestObj = {};

    if(incommingBuff !== undefined){

        const stringified = incommingBuff.toString();
        const split = stringified.split("\r\n");

        for (const parameter of split){

            // split http handshake request to key/value
            if(parameter !== "GET / HTTP/1.1" && parameter !== ""){

                const temp = parameter.split(": ");

                // make all Keys lowercase
                temp[0] = temp[0].toLowerCase();

                // replace all - with _ , so i don't have to have strings as keys.
                requestObj[temp[0].replaceAll("-", "_")] = temp[1];

            }else if(parameter !== ""){

                const temp = parameter.split(" ");
                requestObj["method"] = temp[0];
                requestObj["path"] = temp[1];
                requestObj["protocol"] = temp[2];

            };

        };

    }else{

        requestObj = null;

    };

    return requestObj;

};

