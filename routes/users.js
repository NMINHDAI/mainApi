const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserModal = require("../models/User");
const Conversation = require("../models/Conversation");
const secret = 'test';

router.post("/signin",async (req, res) => {
  const { email, password } = req.body;

  try {
    const oldUser = await UserModal.findOne({ email });

    if (!oldUser) return res.status(404).json({ statusCode: 404, message: "User doesn't exist" });
    else {
      const isPasswordCorrect = await bcrypt.compare(password, oldUser.password);

      if (!isPasswordCorrect) return res.status(400).json({ statusCode: 400, message: "Invalid credentials" });
      else {
        const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, { expiresIn: "1h" });

        res.status(200).json({ statusCode: 200, message: "success", result: oldUser, token });
      }
      
    }
    
  } catch (err) {
    res.status(500).json({ statusCode: 500, message: "Something went wrong" });
  }
});

router.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const oldUser = await UserModal.findOne({ email });

    if (oldUser) return res.status(400).json({ statusCode: 400, message: "User already exists" });
    else {
      const hashedPassword = await bcrypt.hash(password, 12);

      const result = await UserModal.create({ email, password: hashedPassword, name: name });
  
      const token = jwt.sign( { email: result.email, id: result._id }, secret, { expiresIn: "1h" } );
      
      //create conversation with admin
      const newConversation = new Conversation({
        members: [process.env.adminId, result._id],
      });
    
      try {
        await newConversation.save();
      } catch (err) {
        res.status(500).json(err);
      }

      res.status(201).json({ statusCode: 201, message: "success", result, token });
    }
   
  } catch (error) {
    res.status(500).json({ statusCode:500, message: "Something went wrong" });
    
    console.log(error);
  }
});


module.exports = router;