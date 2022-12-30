const app = require("express")();
const http = require('http').Server(app);
const express = require('express');
const mysql = require('mysql');

const PORT = process.env.PORT || 3456;

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "UnoGameProjectPass",
  database: "UNO_Game"
});


const io = require("socket.io")(http, {
  cors:{
    origins: ['localhost:3000','192.168.1.105','rockjc01.hopto.org'],
    // origin: '*',
    methods: ["GET","POST"],
  }
});
   

io.on('connection', function(socket){
    console.log("A client conencted "+ socket.id);
   
    socket.emit("printSocket", {socketid: socket.id});

    socket.on("RegisterUser",function(data){
      let search = "SELECT username FROM users WHERE username = " + mysql.escape(data['username']);
      let rowcount;
      con.query(search, function(err, result){
        if(err){return console.error(error.message)};
        rowcount = result.length;
        if(rowcount == 0){
          let sql = 'INSERT INTO users (username, password) VALUES ?';
          let values = [[data["username"],data["password"]]];
          con.query(sql,[values],function(err,result){
            if(err) throw err
            socket.emit("LoginSuccess");
          })
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
        if(UserInfo.length == 1){
          if(UserInfo[0].password == data["password"] && UserInfo[0].username == data["username"]){
            socket.emit("LoginSuccess");
          }else{
            socket.emit("LoginFailure");
          }
        }else{
          socket.emit("NoUser");
        }
      })
    })

    socket.on('disconnect', function(){
        socket.removeAllListeners('send message');
        socket.removeAllListeners('disconnect');
        console.log(`A client with id ${socket.id} disconnected`);
    });
});

http.listen(PORT, function(err){
    if(err){console.log(err)};
    console.log(`Server listening on ${PORT}`);
});
