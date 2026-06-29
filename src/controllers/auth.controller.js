import userModel from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";

export async function register(req,res) {
   
    const {username, email, password} = req.body;

    // check if the user is already registered
    const isAlreadyRegistered = await userModel.findOne({
        $or: [{ username },
            { email }
        ]
    })

    if(isAlreadyRegistered) {
        // 409 is the status code for conflict. it means that the request could not be completed due to a conflict with the current state of the resource. in this case, the conflict is that the username or email already exists in the database
        return res.status(409).json({
            message: "Username or email already exists"
        });
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
    const newUser = new userModel({
        username,
        email,
        password: hashedPassword
    });

    const user = await userModel.create({
        username,
        email,
        password: hashedPassword
    });

    // yaha tak hum nae user nae request kiya server nae database mae save kar diya. 

    // abb humey kya karna hai abb server token create karega aur user ko dae dega

    const token = jwt.sign({
        id: user._id
    }, config.JWT_SECRET, {
        expiresIn: "1d"
    });

    res.status(201).json({
        message: "User registered successfully",
        user:{
            username: user.username,
            email: user.email
        },
        token
    })
}

