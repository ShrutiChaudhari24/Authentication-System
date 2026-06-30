// server ko start karna and database sae connect karne 
import app from "./src/app.js";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
import connectDB from "./src/config/database.js";

connectDB();

app.listen(3000, ()=>{
    console.log("Server is running on port 3000");
})