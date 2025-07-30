import fs from "fs/promises"

try{

    let responsvariabel = "";
    let counter = 0;

    const socket = new WebSocket(`ws://localhost:8000/socketconnection`);
    
    socket.addEventListener("close", (mess) => {
        console.log("Close:\n", mess);
    });

    socket.addEventListener("error", (error) => {
        
        console.log("Error:\n", error);

    });

    socket.addEventListener("message", async (mess) => {

        console.log(mess.data);

        // console.log("length:", mess.data.length);

        // client-Echo
        // setTimeout(() => {
        //     socket.send(mess.data);
        // }, 2000);

    });

    socket.addEventListener("open", async () => {

        console.log("websocket connection opened");

        socket.send("Nå funker det, her er første melding. <----- her :)");

        let test_64_len = "Her er starten på meldingen. ";

        await fs.readFile("public/testInputs.json", {encoding: "utf-8"}).then((data) => {
            test_64_len += data;
            test_64_len += " Her er slutten på meldingen."
        });

        setTimeout(() => {
            socket.send(test_64_len);
        }, 2000);

    });

}catch(error){

    console.log(error);
    
};

