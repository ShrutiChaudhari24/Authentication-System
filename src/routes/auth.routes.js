import {Router} from "express";
import * as authController from "../controllers/auth.controller.js";
import { token } from "morgan";


const authRouter = Router();

// yaha hum srf api ko declare karenge. aur unka implementation hum alag file mae karenge. isliye humne yaha sirf api ka route define kiya hai aur uska implementation humne auth.controller.js mae kiya hai

/*
* POST / api/auth/register -> ess sae hum user kae liye token generate karwate hai
*/
authRouter.post("/register", authController.register); // yaha humne register api ka route define kiya hai aur uska implementation humne auth.controller.js mae kiya hai matlab rehgister controller ko use kar liya

/*
* POST / api/auth/login 
*/
authRouter.post("/login", authController.login); 

/*
* GET / api/auth/get-me  -> jis user kae liye token generate huya hai uss ki details hum fetch kar sakte hai
*/
authRouter.get("/get-me",authController.getMe)

/*
* GET / api/auth/refresh-token 
*/
authRouter.get("/refresh-token",authController.refreshToken)

/*
* GET / api/auth/logout 
*/
authRouter.get("/logout", authController.logout)

/*
* GET / api/auth/logout-all 
*/
authRouter.get("/logout-all", authController.logoutAll)

/*
* GET / api/auth/verify-email 
*/
authRouter.get("/verify-email", authController.verifyEmail)


export default authRouter;