// server ko start karna and database sae connect karne 
import app from "./src/app.js";
import connectDB from "./src/config/database.js";

connectDB();

app.listen(3000, ()=>{
    console.log("Server is running on port 3000");
})