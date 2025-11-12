const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/register', async (req,res)=>{
  const {name,email,password} = req.body;
  if(!email||!password) return res.status(400).json({error:'missing'});
  const existing = await User.findOne({email}); if(existing) return res.status(400).json({error:'user_exists'});
  const hash = await bcrypt.hash(password,10);
  const u = new User({name,email,passwordHash:hash}); await u.save();
  const token = jwt.sign({id:u._id,email:u.email}, process.env.JWT_SECRET, {expiresIn:'30d'});
  res.json({token,user:{id:u._id,name:u.name,email:u.email}});
});

router.post('/login', async (req,res)=>{
  const {email,password} = req.body;
  const u = await User.findOne({email});
  if(!u) return res.status(400).json({error:'invalid'});
  const ok = await bcrypt.compare(password,u.passwordHash); if(!ok) return res.status(400).json({error:'invalid'});
  const token = jwt.sign({id:u._id,email:u.email}, process.env.JWT_SECRET, {expiresIn:'30d'});
  res.json({token,user:{id:u._id,name:u.name,email:u.email}});
});

module.exports = router;
