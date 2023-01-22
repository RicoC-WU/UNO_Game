const app = require("express")();
const http = require('http').Server(app);
const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const fs = require('fs');

const PORT = process.env.PORT || 3456;
const CARDNUM = 7;
const TWOPLAYERS = 2; const THREEPLAYERS = 3; const FOURPLAYERS = 4;


var con = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "UnoGameProjectPass",
  database: "UNO_Game"
});

const io = require("socket.io")(http, {
  cors:{
    origins: ['localhost:3000','192.168.1.238','174.86.243.203','rockjc01.hopto.org'],
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
  if(['UNOdefault.png','CustomCard.png','AllUnoCards.png',"test.css"].includes(currCard)){
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
      console.log("ERROR COULDN'T LOGIN");
    }
  }
}


io.on('connection', function(socket){
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

    socket.on('disconnecting', function(){
        if(Array.from(socket.rooms).length < 2){
          return;
        }
        let roomname = Array.from(socket.rooms)[1];
        let roomindex = parseInt(roomname.substring(1).replace( /^\D+/g, ''));
        let roomtype = roomname[0];
        let Username;
        let playerindex;
        socket.to(roomname).emit("PlayerLeft");
        if(roomtype === '2'){
          Username = Players2Rooms[roomindex].players.find(Player => Player.socketid === socket.id).username;
          playerindex = Players2Rooms[roomindex].players.indexOf(Players2Rooms[roomindex].players.find(Player => Player.socketid === socket.id));
          Players2Rooms[roomindex].players.splice(playerindex,1);
        }else if(roomtype === '3'){
          Username = Players2Rooms[roomindex].players.find(Player => Player.socketid === socket.id).username;
          if(Players3Rooms[roomindex].players.length !== THREEPLAYERS){
            Players3Rooms.slice(roomindex,1);
          }
        }else if(roomtype === '4'){
          Username = Players2Rooms[roomindex].players.find(Player => Player.socketid === socket.id).username;
          if(Players4Rooms[roomindex].players.length !== FOURPLAYERS){
            Players4Rooms.slice(roomindex,1);
          }
        }
        let UserQuery = [
          [Username]
        ];
        let sql = "UPDATE users SET inGame = FALSE where username = ?"
        con.query(sql, [UserQuery], function(err,result){
          if (err) throw err;
        })
    });

    socket.on('checkInGame',function(data){
      let sql = "SELECT inGame FROM users WHERE username = ?";
      let username = [
        [data["username"]]
      ];
      con.query(sql, [username], function(err,result){
        if (err) throw err;
        let inGame = result[0].inGame;
        if(inGame === 1){
          socket.emit("AlreadyInRoom");
        }else if(inGame === 0){
          socket.emit("ReadyPlayer",{roomtype: data["roomtype"]})
        }
      })
    });

    socket.on('joinroom', function(data){
      let roomname;
      let roomtype = data["roomtype"];
      if(roomtype == "2Player"){
        roomname = roomtype + (Players2Rooms.length-1);
        socket.join(roomname);
        Players2Rooms[Players2Rooms.length-1].players.push({username: data["username"], usercards: [], socketid: socket.id});
        let playercards = [];
        for(let i = 0; i < CARDNUM; i++){
          playercards.push(Players2Rooms[Players2Rooms.length-1].deck.pop());
          if(i == CARDNUM-1){
           let index = Players2Rooms[Players2Rooms.length-1].players.length - 1;
           Players2Rooms[Players2Rooms.length-1].players[index].usercards = playercards;
          }
        }
        socket.emit("CardsReceive", {cards: playercards});
        if(Players2Rooms[Players2Rooms.length-1].players.length == TWOPLAYERS){
          io.to(roomname).emit("startGame", {players: Players2Rooms[Players2Rooms.length-1].players, RoomName: roomname, cards: Players2Rooms[Players2Rooms.length-1].deck});
          Players2Rooms.push({players: [], deck: shuffleArray(JSON.parse(JSON.stringify(AllCards)))});
        }
      }else if(roomtype == "3Player"){
        roomname = roomtype + (Players3Rooms.length-1);
        socket.join(roomname);
        Players3Rooms[Players3Rooms.length-1].players.push({username: data["username"],  usercards: [], socketid: socket.id});
        let playercards = [];
        for(let i = 0; i < CARDNUM; i++){
          playercards.push(Players3Rooms[Players3Rooms.length-1].deck.pop());
          if(i == CARDNUM-1){
            let index = Players3Rooms[Players3Rooms.length-1].players.length - 1;
            Players3Rooms[Players3Rooms.length-1].players[index].usercards = playercards;
          }
        }
        socket.emit("CardsReceive", {cards: playercards});
        if(Players3Rooms[Players3Rooms.length-1].players.length == THREEPLAYERS){
          io.to(roomname).emit("startGame", {players: Players3Rooms[Players3Rooms.length-1].players, RoomName: roomname, cards: Players3Rooms[Players3Rooms.length-1].deck})
          Players3Rooms.push({players: [], deck: shuffleArray(JSON.parse(JSON.stringify(AllCards)))});
        }
      }else if(roomtype == "4Player"){
        roomname = roomtype + (Players4Rooms.length-1);
        socket.join(roomname);
        Players4Rooms[Players4Rooms.length-1].players.push({username: data["username"],  usercards: [], socketid: socket.id});
        let playercards = [];
        for(let i = 0; i < CARDNUM; i++){
          playercards.push(Players4Rooms[Players4Rooms.length-1].deck.pop());
          if(i == CARDNUM-1){
            let index = Players4Rooms[Players4Rooms.length-1].players.length - 1;
            Players4Rooms[Players4Rooms.length-1].players[index].usercards = playercards;
          }
        }
        socket.emit("CardsReceive", {cards: playercards});
        if(Players4Rooms[Players4Rooms.length-1].players.length == FOURPLAYERS){
          io.to(roomname).emit("startGame", {players: Players4Rooms[Players4Rooms.length-1].players, RoomName: roomname, cards: Players4Rooms[Players4Rooms.length-1].deck})
          Players4Rooms.push({players: [], deck: shuffleArray(JSON.parse(JSON.stringify(AllCards)))});
        }
      }
      let sql = "UPDATE users SET inGame = TRUE where username = ?";
      let username = [
        [data["username"]]
      ];
      con.query(sql, [username], function(err,result){
        if (err) throw err;
      })
     
    });

    socket.on("userplaycard",function(data){
      let roomindex = parseInt(data["roomname"].substring(1).replace( /^\D+/g, ''));
      if(parseInt(data["roomtype"]) === TWOPLAYERS){
        Players2Rooms[roomindex].players = data["OrrUsers"];
        socket.to(data["roomname"]).emit("getroundinfo",{players: Players2Rooms[roomindex].players, /*Deck: data["Deck"],*/ trash: data["trash"], currpile: data["currpile"], tr_index: data["tr_index"], currTurn: data["currTurn"], reverse: data["reverse"]});
        if(data["mustDraw"]){
          socket.to(data["roomname"]).emit("setDraw",{currTurn: data["currTurn"]});
        }
      }else if(parseInt(data["roomtype"]) === THREEPLAYERS){
        Players3Rooms[roomindex].players = data["OrrUsers"];
        socket.to(data["roomname"]).emit("getroundinfo",{players: Players3rooms[roomindex].players, /*Deck: data["Deck"],*/ trash: data["trash"], currpile: data["currpile"], tr_index: data["tr_index"], currTurn: data["currTurn"], reverse: data["reverse"]});
        if(data["mustDraw"]){
          socket.to(data["roomname"]).emit("setDraw",{currTurn: data["currTurn"]});
        }
      }else if(parseInt(data["roomtype"]) === FOURPLAYERS){
        Players4Rooms[roomindex].players = data["OrrUsers"];
        socket.to(data["roomname"]).emit("getroundinfo",{players: Players4Rooms[roomindex].players, /*Deck: data["Deck"],*/ trash: data["trash"], currpile: data["currpile"], tr_index: data["tr_index"], currTurn: data["currTurn"], reverse: data["reverse"]});
        if(data["mustDraw"]){
          socket.to(data["roomname"]).emit("setDraw",{currTurn: data["currTurn"]});
        }
      }
    });

    socket.on("userpickdeck", function(data){
      let roomindex = parseInt(data["roomname"].substring(1).replace( /^\D+/g, ''));
      if(parseInt(data["roomtype"]) === TWOPLAYERS){
        Players2Rooms[roomindex].players = data["OrrUsers"];
        socket.to(data["roomname"]).emit("getdeckroundinfo",{players: Players2Rooms[roomindex].players, Deck: data["Deck"], currTurn: data["currTurn"]})
      }else if(parseInt(data["roomtype"]) === THREEPLAYERS){
        Players3Rooms[roomindex].players = data["OrrUsers"];
        socket.to(data["roomname"]).emit("getdeckroundinfo",{players: Players3Rooms[roomindex].players, Deck: data["Deck"], currTurn: data["currTurn"]})
      }else if(parseInt(data["roomtype"]) === FOURPLAYERS){
        Players4Rooms[roomindex].players = data["OrrUsers"];
        socket.to(data["roomname"]).emit("getdeckroundinfo",{players: Players4Rooms[roomindex].players, Deck: data["Deck"], currTurn: data["currTurn"]})
      }
    });

    socket.on("shufflenewdeck",function(data){
      let roomindex = parseInt(data["roomname"].substring(1).replace( /^\D+/g, ''));
      let newDeck = shuffleArray(JSON.parse(JSON.stringify(data["trash"])));
      if(parseInt(data["roomtype"]) === TWOPLAYERS){
        Players2Rooms[roomindex].deck = newDeck;
        io.to(data["roomname"]).emit("emptytrash",{newDeck: Players2Rooms[roomindex].deck});
      }else if(parseInt(data["roomtype"]) === THREEPLAYERS){
        Players3Rooms[roomindex].deck = newDeck;
        io.to(data["roomname"]).emit("emptytrash",{newDeck: Players3Rooms[roomindex].deck});
      }else if(parseInt(data["roomtype"]) === FOURPLAYERS){
        Players4Rooms[roomindex].deck = newDeck;
        io.to(data["roomname"]).emit("emptytrash",{newDeck: Players4Rooms[roomindex].deck});
      }
    })

    socket.on("changeWildColor",function(data){
        socket.to(data["roomname"]).emit("setWildColor",{currTurn: data["currTurn"], wildColor: data["wildColor"]});
        if(data["mustDraw"]){
          socket.to(data["roomname"]).emit("setDraw",{currTurn: data["currTurn"]});
        }
      // }
    })

    socket.on("UNOfail",function(data){
        socket.to(data["roomname"]).emit("penalizeOpponent",{currTurn: data["currTurn"],penaltyuser: data["user"]});
      // }
    });

    socket.on("penalizeuser",function(data){
      let roomindex = parseInt(data["roomname"].substring(1).replace( /^\D+/g, ''));
      if(parseInt(data["roomtype"]) === 2){
        Players2Rooms[roomindex].players = data["OrrUsers"];
        Players2Rooms[roomindex].deck = data["Deck"];
        socket.to(data["roomname"]).emit("addpenalty",{penaltyuser: data["penaltyuser"], players: Players2Rooms[roomindex].players, Deck: Players2Rooms[roomindex].deck});
      }else if(parseInt(data["roomtype"]) === 3){
        Players3Rooms[roomindex].players = data["OrrUsers"];
        Players3Rooms[roomindex].deck = data["Deck"];
        socket.to(data["roomname"]).emit("addpenalty",{penaltyuser: data["penaltyuser"], players: Players3Rooms[roomindex].players, Deck: Players3Rooms[roomindex].deck});
      }else if(parseInt(data["roomtype"]) === 4){
        Players4Rooms[roomindex].players = data["OrrUsers"];
        Players4Rooms[roomindex].deck = data["Deck"];
        socket.to(data["roomname"]).emit("addpenalty",{penaltyuser: data["penaltyuser"], players: Players4Rooms[roomindex].players, Deck: Players4Rooms[roomindex].deck});
      }
    })

    socket.on("UNOdeclared",function(data){
        socket.to(data["roomname"]).emit("setUNOdeclared",{UNOdec: data["UNOdec"]});
    })

    socket.on("GameOver",function(data){
        socket.to(data["roomname"]).emit("setWinner",{winner: data["winner"]});
    })

    socket.on("UpdateWinCount",function(data){
      let sql = "SELECT id FROM users WHERE username = ?";
      let username = [
        [data["user"]]
      ];
      let id;
      con.query(sql, [username], function(err,result){
        if (err) throw err;
        id = result[0].id;
        let sql2 = "UPDATE users SET wins = wins + 1 WHERE id = " + id;
        con.query(sql2,function(err,result){
          if(err) throw err;
        })
      })
    })

    socket.on("UpdateLossCount",function(data){
      let sql = "SELECT id FROM users WHERE username = ?";
      let username = [
        [data["user"]]
      ];
      let id;
      con.query(sql, [username], function(err,result){
        if (err) throw err;
        id = result[0].id;
        let sql2 = "UPDATE users SET losses = losses + 1 WHERE id = " + id;
        con.query(sql2,function(err,result){
          if(err) throw err;
        })
      })
    })

});

http.listen(PORT, function(err){
    if(err){console.log(err)};
    console.log(`Server listening on ${PORT}`);
});
