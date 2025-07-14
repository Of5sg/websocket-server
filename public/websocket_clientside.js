
// https://websockets.spec.whatwg.org/#the-websocket-interface


try{

    let responsvariabel = "";
    let counter = 0;

    const socket = new WebSocket(`ws://localhost:8000`);
    
    socket.addEventListener("close", (mess) => {
        console.log("Close:\n", mess);
    });

    socket.addEventListener("error", (error) => {
        
        console.log("Error:\n", error);

    });

    socket.addEventListener("message", async (mess) => {

        console.log(mess.data);

        // console.log("length:", mess.data.length);

        // setTimeout(() => {
        //     socket.send(mess.data);
        // }, 2000);

        // client-echo
        // if(responsvariabel !== mess.data && counter < 8){
        //     responsvariabel = responsvariabel + mess.data;
        //     const textEncode = new TextEncoder()
        //     socket.send(textEncode.encode(responsvariabel));
        //     counter++;
        // };

    });

    socket.addEventListener("open", () => {

        console.log("websocket connection opened");

        socket.send("Nå funker det, her er første melding :)");

        // let count = 0;

        // const intervalSend = setInterval(() => {
        //     socket.send(`message nr: ${count}, randomnumbers - ${Math.random()*2000}`);
        //     if(count === 5){
        //         clearInterval(intervalSend);
        //         setTimeout(() => {
        //             // timeout so the last message from the echo-server can arrive
        //             socket.close(1000, "ending connection, status code 1000 normal closure");
        //         }, 500);
        //     };
        //     count++;
        // }, 1000);
    });



}catch(error){

    console.log(error);
    
};


 