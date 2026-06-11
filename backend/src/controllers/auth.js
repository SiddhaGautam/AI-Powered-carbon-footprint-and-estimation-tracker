const jwt = require("jsonwebtoken")
const secret_key = "Gautam2725%&"

function setUser(user) {
    return jwt.sign(
        {
            id:    user._id.toString(),   // plain string, not ObjectId
            email: user.email,
            name:  user.first_name,
        },
        secret_key,   // hardcode temporarily to test
        { expiresIn: "7d" }
    )
}

function getUser(token) {
    if (!token) return null
    try {
        return jwt.verify(token, secret_key)
    } catch {
        return null
    }
}

module.exports = { setUser, getUser }