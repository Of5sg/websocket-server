import { Buffer } from "buffer";

/**
function SocketInit( socket )

    Socket: (Object)
        - the socket object returned by net.createServer()

Description:
    this function initializes objects inside of the socket object, for storage of data
 */


export function SocketInit(socket){

    // socket.datastore is for storing the data i need to persist
    // socket.localTemp is for pings and timing
    // socket.state is for storing the state of the connection, for instance: wheter it is a websocket connection
    socket.timing = {};
    socket.dataStore = {};
    socket.state = {};

    // this is the buffer for the incomming TCP-Messages
    socket.dataStore.streamBuffer = Buffer.alloc(0);

    // this is for whether the connection is a websocket connection or not
    socket.state.websocket_connection = false;

    // variables for buffering messages fragmented over several Websocket-Frames, used in the opcodeSwitch() function.
    socket.dataStore.initialFrameBuffer = {};
    socket.dataStore.tempFINPayloadBuffer = Buffer.alloc(0);

    // initializing RSV values to zero
    socket.state.RSV1 = 0;
    socket.state.RSV2 = 0;
    socket.state.RSV3 = 0;

};