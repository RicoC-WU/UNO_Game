const app = require("express")();
const http = require('http').Server(app);
const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');

const PORT = process.env.PORT || 3456;

var con = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "UnoGameProjectPass",
  database: "UNO_Game"
});
[]
const io = require("socket.io")(http, {
  cors:{
    origins: ['localhost:3000','192.168.1.105','108.236.64.90','rockjc01.hopto.org'],
    // origin: '*',
    methods: ["GET","POST"],
  }
});

async function hashPassword(sql,socket,username,textPass){
  try{
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(textPass, salt);
    console.log(hashedPassword);
    let values = [[username,hashedPassword]];
    con.query(sql,[values],function(err,result){
      if(err) throw err
      socket.emit("LoginSuccess", {username: username});
    })
  }catch{
    console.log("ERROR COULDN'T HASH PASSWORD");
   
  }
}

async function comparePassword(socket,UserInfo,userEnter,textPass){
  if(UserInfo.length == 0){
    socket.emit("NoUser");
  }else{
    try{
      const match = await bcrypt.compare(textPass,UserInfo[0].password);
      if(match && UserInfo[0].username == userEnter){
        socket.emit("LoginSuccess",{username: userEnter});
      }else{
        socket.emit("LoginFailure");
      }
    }catch{
      console.log("ERROR COULDN'T HASH PASSWORD");
    }
  }
}
   

io.on('connection', function(socket){
    console.log("A client conencted "+socket.id);
   
    socket.emit("printSocket", {socketid: socket.id});

    socket.on("RegisterUser",function(data){
      let search = "SELECT username FROM users WHERE username = " + mysql.escape(data['username']);
      let rowcount;
      con.query(search, function(err, result){
        if(err) throw err;
        rowcount = result.length;
        if(rowcount == 0){
          let sql = 'INSERT INTO users (username, password) VALUES ?';
          hashPassword(sql,socket,data["username"],data["password"]);
        }else{
          socket.emit("UserAlreadyExists");
        }
      })
      
    });

    socket.on("LoginUser",function(data){
      let UserInfo;
      let sql = "SELECT * FROM users WHERE username = ?";
      let username = [
        [data["username"]]
      ];
      con.query(sql, [username], function(err,result){
        if (err) throw err;
        UserInfo = result;
        comparePassword(socket,UserInfo,data['username'],data["password"]);
      })
    })

    socket.on('disconnect', function(){
        console.log(`A client with id ${socket.id} disconnected`);
    });
});

http.listen(PORT, function(err){
    if(err){console.log(err)};
    console.log(`Server listening on ${PORT}`);
});
