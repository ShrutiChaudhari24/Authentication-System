import userModel from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";

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

     const refreshToken = jwt.sign({
        id: user._id
    }, config.JWT_SECRET, {
        expiresIn: "7d"  // refresh token ka goal hota hai access token ko wapis sae generate karwana jab access token expire ho jaye ye thode long time kae liye valid ratha hai
    })

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex"); // refresh token ko phele hash mae convert karenge

    const session = await sessionModel.create({
        userId: user._id,
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

    res.status(201).json({
        message: "User registered successfully",
        user:{
            username: user.username,
            email: user.email
        },
        accessToken,  // accessToken memory mae save hone wala hai tho ussey response ki body mae bhajna jaruri hota lekin refresh token cilent side pae javaScript mae access na ho paye essliye hum ussey cookies mae store karte hai, cookies mae store karne kae liye ek package humey chiye
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
