import dotenv from "dotenv";

dotenv.config(); // jab tak hum dotenv.config() ko call nahi karte tab tak hum .env file kae ander humney jitne bhi variabes banaye hai unhe access hum nahi kar sakte

// jab tak hameri .env file mae required environment variables defined nahi hai tab tak humari application run nahi hogi. isliye hum check karenge ki MONGO_URI defined hai ya nahi. agar defined nahi hai to hum error throw karenge
if(!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined in the environment variables");
}

if(!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in the environment variables");
}

const config = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET
};

export default config;