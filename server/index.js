const app = require("express")();
const http = require('http').Server(app);
const express = require('express');
const mysql = require('mysql');

const PORT = process.env.PORT || 3456;


const io = require("socket.io")(http, {
  cors:{
    origin: "*",
    methods: ["GET","POST"],
  }
});
   

io.on('connection', function(socket){
    console.log("A client conencted "+ socket.id);
   
    socket.emit("printSocket", {socketid: socket.id});

    socket.on('disconnect', function(){
        console.log(`A client with id ${socket.id} disconnected`);
    });
});

http.listen(PORT, function(err){
    if(err){console.log(err)};
    console.log(`Server listening on ${PORT}`);
});
