import { readFileSync } from "node:fs";
import { DERDecoder } from "../DER_enc_dec/DER_decoder.js";

export function Extract16bitUint(data, startIndex){
    return ((data[startIndex] << 8) | data[startIndex + 1]);
}

export function extractListField2Byte(data, position, list_object){
    const field_length = (data[position] << 8) | data[position + 1];
    const extracted_field = data.slice((position + 2), (position + (2 + field_length)))
    const result = [];
    for (let i = 0; i < field_length; i += 2){
        let entry_code = (extracted_field[i] << 8) | extracted_field[i + 1];
        let entry_hex = "0x" + entry_code.toString(16).toUpperCase().padStart(4, "0");
        result.push(list_object[entry_hex]);
    };
    return result;
};



export function TLS_Extension_Reader(extensions, extensions_total_length){

    let separatedExtensions = {};       // object to contain the separated extensions

    const extension_types = JSON.parse(readFileSync("server_components/TLS/TLS_Exts.json", {encoding: "utf8"}));
    const signature_schemes = JSON.parse(readFileSync("server_components/TLS/signature_schemes.json", {encoding: "utf8"}));
    const supported_groups = JSON.parse(readFileSync("server_components/TLS/supported_groups.json", {encoding: "utf8"}));

    for(let i = 0; i < extensions_total_length; i++){

        let extension_type = (extensions[i] << 8) | (extensions[i + 1]);
        let extension_length = (extensions[i + 2] << 8) | (extensions[i + 3]);

        i += 4; // update i

        // TLS extension definitions https://datatracker.ietf.org/doc/html/rfc6066#section-3

        switch (extension_types[extension_type]){
            case "server_name":

                // server name indication https://datatracker.ietf.org/doc/html/rfc6066#section-3

                const serverNameList = (extensions[i] << 8) | extensions[i + 1];        // (2 bytes);
                const nameType = extensions[i + 2]                                          // (1 byte);
                const hostName_length = (extensions[i + 3] << 8) | extensions[i + 4];   // (2 bytes);


                separatedExtensions[extension_types[extension_type]] = extensions.slice(i + 5, i + (5 + hostName_length)).toString();
                                                
                
                break;
            case "max_fragment_length":
                // https://datatracker.ietf.org/doc/html/rfc6066#section-4
                break;
            case "client_certificate_url":
                // https://datatracker.ietf.org/doc/html/rfc6066#section-5
                break;
            case "trusted_ca_keys":
                // https://datatracker.ietf.org/doc/html/rfc6066#section-6
                break;
            case "truncated_hmac":
                // https://datatracker.ietf.org/doc/html/rfc6066#section-7
                break;
            case "status_request":
                // https://datatracker.ietf.org/doc/html/rfc6066#section-8
                break;
            case "user_mapping":
                break;
            case "client_authz":
                break;
            case "server_authz":
                break;
            case "cert_type":
                break;
            case "supported_groups":
                let supported_groups_result = extractListField2Byte(extensions, i, supported_groups)
                separatedExtensions[extension_types[extension_type]] = supported_groups_result;
                break;
            case "ec_point_formats":
                break;
            case "srp":
                break;
            case "signature_algorithms":
                let signature_algorithms_result = extractListField2Byte(extensions, i, signature_schemes);
                separatedExtensions[extension_types[extension_type]] = signature_algorithms_result;
                break;
            case "use_srtp":
                break;
            case "heartbeat":
                break;
            case "application_layer_protocol_negotiation":
                break;
            case "status_request_v2":
                break;
            case "signed_certificate_timestamp":
                break;
            case "client_certificate_type":
                break;
            case "server_certificate_type":
                break;
            case "padding":
                break;
            case "encrypt_then_mac":
                break;
            case "extended_master_secret":
                break;
            case "token_binding":
                break;
            case "cached_info":
                break;
            case "tls_lts":
                break;
            case "compress_certificate":
                break;
            case "record_size_limit":
                break;
            case "pwd_protect":
                break;
            case "pwd_clear":
                break;
            case "password_salt":
                break;
            case "ticket_pinning":
                break;
            case "tls_cert_with_extern_psk":
                break;
            case "delegated_credential":
                break;
            case "session_ticket":
                break;
            case "TLMSP":
                break;
            case "TLMSP_proxying":
                break;
            case "TLMSP_delegate":
                break;
            case "supported_ekt_ciphers":
                break;
            case "pre_shared_key":
                break;
            case "early_data":
                break;
            case "supported_versions":
                break;
            case "cookie":
                break;
            case "psk_key_exchange_modes":
                break;
            case "certificate_authorities":
                let certificate_authorities_length = (extensions[i] << 8) | (extensions[i + 1]);
                DERDecoder((extensions.slice((i + 2), (i + (2 + certificate_authorities_length)))))

                break;
            case "oid_filters":
                break;
            case "post_handshake_auth":
                break;
            case "signature_algorithms_cert":
                break;
            case "key_share":
                const namedGroup = (extensions[i] << 8) | extensions[i + 1];
                // change position in buffer, without interfering with progression of i
                let y = i + 2;
                const key_length = (extensions[y] << 8) | extensions[y + 1];
                const keyExchange = extensions.slice(y, y + key_length);
                console.log(namedGroup.toString(16))

                const key_share = {
                    NamedGroup: namedGroup,
                    key_exchange: keyExchange
                };
                separatedExtensions[extension_types[extension_type]] = key_share;
                break;
            case "transparency_info":
                break;
            case "connection_id (deprecated)":
                break;
            case "connection_id":
                break;
            case "external_id_hash":
                break;
            case "external_session_id":
                break;
            case "quic_transport_parameters":
                break;
            case "ticket_request":
                break;
            case "dnssec_chain":
                break;
            case "sequence_number_encryption_algorithms":
                break;
            case "rrc":
                break;
            case "tls_flags":
                break;
            case "ech_outer_extensions":
                break;
            case "encrypted_client_hello":
                break;
            case "renegotiation_info":
                break;
            default:
                separatedExtensions[extension_types[extension_type]] = [extensions.slice(i, i + extension_length)];
                break;
        };

        // add extension and extension name to extension object
        // separatedExtensions[extension_types[extension_type]] = [extensions.slice(i, i + extension_length)];

        i += extension_length - 1; // update i

    };
    return separatedExtensions;
};