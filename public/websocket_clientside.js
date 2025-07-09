
// https://websockets.spec.whatwg.org/#the-websocket-interface


try{

    const socket = new WebSocket(`ws://localhost:8000`);
    
    socket.addEventListener("close", (mess) => {
        console.log("Close:\n", mess);
    });

    socket.addEventListener("error", (error) => {
        
        console.log("Error:\n", error);

    });

    socket.addEventListener("message", (message) => {

        console.log(message);

    });

    socket.addEventListener("open", () => {

        console.log("websocket connection opened");

        socket.send("start, nå funker det, her er første melding :)");

        // let count = 0;

        // const intervalSend = setInterval((count) => {
        //     socket.send(`mesage nr: ${count++}`);
        //     if(count = 5){
        //         clearInterval(intervalSend);
        //         socket.close(1000, "ending connection, status code 1000 normal closure");
        //     };
        // }, 2000);


    });



}catch(error){

    console.log(error);
    
};


 