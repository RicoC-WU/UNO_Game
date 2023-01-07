const app = require("express")();
const http = require('http').Server(app);
const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const fs = require('fs');

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

const folder = '../client/public/Cards'

function Card(Title, Value, Color, WildStatus, DrawStatus, ReverseStatus, SkipStatus){
  this.Title = Title
  this.Value = Value;
  this.Color = Color;
  this.WildStatus = WildStatus;
  this.DrawStatus = DrawStatus;
  this.ReverseStatus = ReverseStatus;
  this.SkipStatus = SkipStatus;
}

let cardFiles = fs.readdirSync(folder);
let AllCards = [];


for(var i = 0; i < cardFiles.length; i++){
  let currCard = cardFiles[i];
  if(currCard == 'UNOdefault.png' || currCard == 'CustomCard.png' || currCard == 'AllUnoCards.png'){
    continue;
  }
  let title = currCard;
  let color = currCard.includes("Red") ? "Red" : 
              currCard.includes("Blue") ? "Blue" :
              currCard.includes("Green") ? "Green" :
              currCard.includes("Yellow") ? "Yellow" : "Black";
  let wildstatus = currCard.includes("Wild");
  let drawstatus = currCard.includes("Draw");
  let reversestatus = currCard.includes("Reverse");
  let skipstatus = currCard.includes("Skip");
  let val = ((wildstatus && !drawstatus) || reversestatus || skipstatus) ? 10 : parseInt(currCard.replace( /^\D+/g, ''));
  if(color == "Black" && wildstatus){
    for(var j = 0; j < 4; j++){
      AllCards.push(new Card(title,val,color,wildstatus,drawstatus,reversestatus,skipstatus));
    }
  }else if(val == 0 || wildstatus){
    AllCards.push(new Card(title,val,color,wildstatus,drawstatus,reversestatus,skipstatus));
  }else{
    AllCards.push(new Card(title,val,color,wildstatus,drawstatus,reversestatus,skipstatus));
    AllCards.push(new Card(title,val,color,wildstatus,drawstatus,reversestatus,skipstatus));
  }
}


function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

let Players2Rooms = [{players: [], deck: shuffleArray(JSON.parse(JSON.stringify(AllCards)))}];
let Players3Rooms = [{players: [], deck: shuffleArray(JSON.parse(JSON.stringify(AllCards)))}];
let Players4Rooms = [{players: [], deck: shuffleArray(JSON.parse(JSON.stringify(AllCards)))}];



async function hashPassword(sql,socket,username,textPass){
  try{
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(textPass, salt);
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
    // console.log("A client conencted "+socket.id);
   
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
        // console.log(`A client with id ${socket.id} disconnected`);
    });

    socket.on('joinroom', function(data){
      let roomname;
      let roomtype = data["roomtype"];
      if(roomtype == "2Player"){
        roomname = roomtype + (Players2Rooms.length-1);
        socket.join(roomname);
        // console.log(roomname);
        Players2Rooms[Players2Rooms.length-1].players.push({username: data["username"], usercards: [], socketid: socket.id});
        let playercards = [];
        for(let i = 0; i < 7; i++){
          playercards.push(Players2Rooms[Players2Rooms.length-1].deck.pop());
          if(i == 6){
           let index = Players2Rooms[Players2Rooms.length-1].players.length - 1;
           Players2Rooms[Players2Rooms.length-1].players[index].usercards = playercards;
          }
        }
        socket.emit("CardsReceive", {cards: playercards});
        if(Players2Rooms[Players2Rooms.length-1].players.length == 2){
          io.to(roomname).emit("startGame", {players: Players2Rooms[Players2Rooms.length-1].players, RoomName: roomname, cards: Players2Rooms[Players2Rooms.length-1].deck});
          Players2Rooms.push({players: [], deck: shuffleArray(JSON.parse(JSON.stringify(AllCards)))});
        }
      }else if(roomtype == "3Player"){
        roomname = roomtype + (Players3Rooms.length-1);
        socket.join(roomname);
        Players3Rooms[Players3Rooms.length-1].players.push({username: data["username"],  usercards: [], socketid: socket.id});
        let playercards = [];
        for(let i = 0; i < 7; i++){
          playercards.push(Players3Rooms[Players3Rooms.length-1].deck.pop());
          if(i == 6){
            let index = Players3Rooms[Players3Rooms.length-1].players.length - 1;
            Players3Rooms[Players3Rooms.length-1].players[index].usercards = playercards;
          }
        }
        socket.emit("CardsReceive", {cards: playercards});
        if(Players3Rooms[Players3Rooms.length-1].players.length == 3){
          io.to(roomname).emit("startGame", {players: Players3Rooms[Players3Rooms.length-1].players, RoomName: roomname, cards: Players3Rooms[Players3Rooms.length-1].deck})
          Players3Rooms.push({players: [], deck: shuffleArray(JSON.parse(JSON.stringify(AllCards)))});
        }
      }else if(roomtype == "4Player"){
        roomname = roomtype + (Players4Rooms.length-1);
        socket.join(roomname);
        Players4Rooms[Players4Rooms.length-1].players.push({username: data["username"],  usercards: [], socketid: socket.id});
        let playercards = [];
        for(let i = 0; i < 7; i++){
          playercards.push(Players4Rooms[Players4Rooms.length-1].deck.pop());
          if(i == 6){
            let index = Players4Rooms[Players4Rooms.length-1].players.length - 1;
            Players4Rooms[Players4Rooms.length-1].players[index].usercards = playercards;
          }
        }
        socket.emit("CardsReceive", {cards: playercards});
        if(Players4Rooms[Players4Rooms.length-1].players.length == 4){
          io.to(roomname).emit("startGame", {players: Players4Rooms[Players4Rooms.length-1].players, RoomName: roomname, cards: Players4Rooms[Players4Rooms.length-1].deck})
          Players4Rooms.push({players: [], deck: shuffleArray(JSON.parse(JSON.stringify(AllCards)))});
        }
      }
     
    });

});

http.listen(PORT, function(err){
    if(err){console.log(err)};
    console.log(`Server listening on ${PORT}`);
});
