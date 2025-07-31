
function addListeners(socket){

    socket.addEventListener("close", (mess) => {
        console.log("Close:\n", mess);
    });

    socket.addEventListener("error", (error) => {
        
        console.log("Error:\n", error);

    });

    socket.addEventListener("message", async (mess) => {

        console.log(mess.data);

        self.postMessage(mess.data);

        // console.log("length:", mess.data.length);

        // client-Echo
        // setTimeout(() => {
        //     socket.send(mess.data);
        // }, 2000);

    });

    socket.addEventListener("open", async () => {

        console.log("websocket connection opened");

        socket.send("Nå funker det, her er første melding. <----- her :)");

    });

};

try{

    let origin = "localhost:8000/";

    let socket;

    self.onmessage = (message) => {

        // this is just so it will work in github-codespaces
        if(message.data.slice(0, 39) === "base_Url#aB29sal2108vnjksdhgmkjfhuiu-:-"){

            origin = message.data.split("-:-https://")[1];

            // this is wss in order to get through the github-codespaces https proxy
            socket = new WebSocket(`wss://${origin}/socketconnection`);

            addListeners(socket);

        }else{

            socket.send(message);

        };

    };


}catch(error){

    console.log(error);
    
};
