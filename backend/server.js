const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const user = require("./src/models/db_schema")

const app = express()
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cors(
    {
        origin:"http://localhost:5173",
        credentials:true,
        methods:["GET","POST"]
    }
))

mongoose.connect("mongodb://127.0.0.1:27017/gautam_db")
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((err) => {
        console.error("Database connection failed:", err.message); // Clean error output
    });
app.get("/",(req,res)=>{
    res.send("say hello to the dashboard page")
})
app.post("/signup",async (req,res)=>{
    const {first_name,last_name,email,password} = req.body
    //fill the data back to mongodb
    const user1 = await user.create({
        first_name,
        last_name,
        email,
        password
    })
    res.send("user created succesfully")
})
app.listen(3000,()=> console.log("server running on port 3000"))