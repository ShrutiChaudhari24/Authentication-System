import userModel from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";
import { sendEmail } from "../services/email.service.js";
import { generateOtp, getOtpHtml } from "../utils/utils.js";
import otpModel from "../models/otp.models.js";

// ye sari hameri api's ban rahi hai

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

    /* ess tarah sae token create kiya aur ager lets say A user ka token B ko mil gaya tho B user A ka data use kar sakta hai ager data sensitive hai tho dikkat ho sakti hai
        const token = jwt.sign({
            id: user._id
        }, config.JWT_SECRET, {
            expiresIn: "1d"
        });
    
        ess liye hum 2 tarah kae token create karte hai access token and refresh token
    */
    
/* Ager hum OTP based verification kar rahe hai tho humey registration kae time pae hum accessToken ya RefreshToken generate nahi karwate matlab jab tak OTP based verification na ho jaye tab tak hum accessToken issue hi nahi karte
    
    const refreshToken = jwt.sign({
        id: user._id
    }, config.JWT_SECRET, {
        expiresIn: "7d"  // refresh token ka goal hota hai access token ko wapis sae generate karwana jab access token expire ho jaye ye thode long time kae liye valid ratha hai
    })

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex"); // refresh token ko phele hash mae convert karenge

    const session = await sessionModel.create({
        user: user._id,
        refreshTokenHash, // fir ussey yaha store karenge
        ip: req.ip,
        userAgent: req.headers[ "user-agent" ]
    })

    const accessToken = jwt.sign({
        id: user._id,
        sessionId: session._id
    }, config.JWT_SECRET, {
        expiresIn: "15m" // access token generally 15 min mae expire ho jata hai ess ka main goal ratha hai konse user nae request ki hai ussey identify karna aur ye hamere normal token jesa hi ratha hai
    });
   
    res.cookie("refreshToken", refreshToken,{
        httpOnly: true,  // ess ka matlab hai client side pae jo js run hone wali hai vo kabhi bhi cookies kae ander jo data hai uss ko read nahi kar payegi
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

*/

/* Response send karne sae phele hum email send kar rahe honge */

    const otp = generateOtp();
    const html = getOtpHtml(otp);

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    await otpModel.create({
        email,
        user: user._id,
        otpHash
    })

    await sendEmail(email, "OTP Verification", `Your OTP code is ${otp}`, html)

    res.status(201).json({
        message: "User registered successfully",
        user:{
            username: user.username,
            email: user.email,
            verified: user.verified,
        },
        // OTP based verification ager hai tho access token bhi nahi jayega registration kae time
        // accessToken,  // accessToken memory mae save hone wala hai tho ussey response ki body mae bhajna jaruri hota lekin refresh token cilent side pae javaScript mae access na ho paye essliye hum ussey cookies mae store karte hai, cookies mae store karne kae liye ek package humey chiye
    })

    
}

export async function login(req,res) {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email })

    if(!user){
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    // jab tak user khud ka email verify nahi kar leta tab tak vo hamere resourses use nahi kar sakta
    if(!user.verified){
       return res.status(401).json({
            message: "Email not verified"
        }) 
    }

    // password compare karna rahega
    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    const isPasswordValid = hashedPassword === user.password;

    if(!isPasswordValid){
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    const refreshToken = jwt.sign({
        id: user._id
    }, config.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    )

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await sessionModel.create({
        user: user._id,
        refreshTokenHash,
        ip: req.ip,
        userAgent: req.headers[ "user-agent" ]
    })

    const accessToken = jwt.sign({
        id: user._id,
        sessionId: session._id
    }, config.JWT_SECRET,{
        expiresIn: "15m"
    })

    res.cookie("refreshToken", refreshToken,{
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.status(200).json({
        message: "Logged in sucessfully",
        user:{
            username: user.username,
            email: user.email,
        },
        accessToken,
    })
}

export async function getMe(req,res) {
    // ess controller kae ander humey mainly 2 logic likhne hai
    // 1st rahega ki server identify karega ki request konsa user kar raha hai ussey identify kiya ja sake

    const token = req.headers.authorization?.split(" ")[ 1 ];

    if(!token){
        return res.status(401).json({
            message: "token not found"
        })
    }

    const decoded = jwt.verify(token,config.JWT_SECRET)

    // console.log(decoded)
    const user = await userModel.findById(decoded.id)

    res.status(200).json({
        message:"user fetched sucessfully",
        user:{
            username: user.username,
            email: user.email,
        }
    })

}

export async function refreshToken(req,res) {
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken){
        return res.status(401).json({
            message: "Refresh token not found"
        })
    }

    // ager refresh token mil gaya tho hum access token generate karwa sakte hai
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET)

    // jab logout hone kae baad jab session revoked ho jayega tho jo hamera refreshtoken tha vo wapis sae use nahi hona chiye access token generate karne kae liye
    // tho yaha access token generate hone sae phele ek aur check lagana hoga
    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await sessionModel.findOne({
        refreshTokenHash,
        revoked: false
    })

    if(!session){
        return res.status(401).json({
            message: "Invalid refresh token"
        })
    }

    const accessToken = jwt.sign({
        id: decoded.id
    }, config.JWT_SECRET,
        {
            expiresIn: "15m"
        }
    )

    const newRefreshToken = jwt.sign({
        id: decoded.id
    }, config.JWT_SECRET,
        {
            expiresIn: "7d"
    })

    // jab refresh token change hoga tho uss ka hash bhi humey database mae update karna pedega
    const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

    session.refreshTokenHash = newRefreshTokenHash;
    await session.save();

    res.cookie("refreshToken",newRefreshToken,{
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days
    })

    res.status(200).json({
        message: "Access token refreshed sucessfully",
        accessToken
    })
}

export async function logout(req,res) {
    
    const refreshToken = req.cookies.refreshToken; // logout kae liye subsae phele tho humey refresh token lagega tho vo humney nikala

    // refresh token humney hash format mae save kiya tha hamere database mae tho wapis sae humey nikalne kae liye hash mae hi convert karna pedega

    // ager refresh token nahi aaya hai tho
    if(!refreshToken){
        res.status(400).json({
            message: "Refresh token not found"
        })
    }

    // ager refresh token mil jata hai tho convert karenge hash mae
    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex"); 

    const session = await sessionModel.findOne({
        refreshTokenHash,
        revoked: false
    })

    if (!session){
        return res.status(400).json({
            message: "Invalid refresh token"
        })
    }

    // ager humey session mil gaya tho logout karne kae liye ussey revoke: true set karna hoga
    session.revoked = true;
    await session.save();

    res.clearCookie("refreshToken")

    res.status(200).json({
        message: "Logged out successfully"
    })

}

export async function logoutAll(req,res) {
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken){
        return res.status(400).json({
            message: "Refresh token no found"
        })
    }

    const decoded = jwt.verify(refreshToken,config.JWT_SECRET)

    await sessionModel.updateMany({
        user: decoded.id,
        revoked: false
    },{
        revoked: true
    })

    res.clearCookie("refreshToken")

    res.status(200).json({
        message: "Logged out from all devices sucessfully"
    })
}

export async function verifyEmail(req, res) {
    const { otp, email } = req.body

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    const otpDoc = await otpModel.findOne({
        email,
        otpHash
    })

    if (!otpDoc) {
        return res.status(400).json({
            message: "Invalid OTP"
        })
    }

    const user = await userModel.findByIdAndUpdate(otpDoc.user, {
        verified: true
    })

    await otpModel.deleteMany({
        user: otpDoc.user
    })

    return res.status(200).json({
        message: "Email verified successfully",
        user: {
            username: user.username,
            email: user.email,
            verified: user.verified
        }
    })
}


