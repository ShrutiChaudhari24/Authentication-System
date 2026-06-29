import {Router} from "express";
import * as authController from "../controllers/auth.controller.js";


const authRouter = Router();

// yaha hum srf api ko declare karenge. aur unka implementation hum alag file mae karenge. isliye humne yaha sirf api ka route define kiya hai aur uska implementation humne auth.controller.js mae kiya hai

authRouter.post("/register", authController.register); // yaha humne register api ka route define kiya hai aur uska implementation humne auth.controller.js mae kiya hai matlab rehgister controller ko use kar liya
export default authRouter;