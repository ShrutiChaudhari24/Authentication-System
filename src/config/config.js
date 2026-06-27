import dotenv from "dotenv";

dotenv.config(); // jab tak hum dotenv.config() ko call nahi karte tab tak hum .env file kae ander humney jitne bhi variabes banaye hai unhe access hum nahi kar sakte

const config = {
    MONGO_URI: process.env.MONGO_URI
};

export default config;