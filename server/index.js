const app = require("express")();
const http = require('http').Server(app);
const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const fs = require('fs');
const Connection = require("mysql/lib/Connection");

//constants
const PORT = process.env.PORT || 3456;
const CARDNUM = 7;
const TWOPLAYERS = 2; const THREEPLAYERS = 3; const FOURPLAYERS = 4;

//Connect to MariaDB database (using MySQL library)
var SQL_CONNECT = {
  host: "127.0.0.1",
  user: "root",
  password: "UnoGameProjectPass",
  database: "UNO_Game"
};

var con;

//socket connection, there are 4 valid origins
const io = require("socket.io")(http, {
  cors:{
    origins: ['localhost:3000','192.168.1.238','174.86.243.203','rockjc01.hopto.org'],
    // origin: '*',
    methods: ["GET","POST"],
  }
});

//handleDisconnect() --> Keeps the connection to the SQL server alive in case of 
//a connection reset (source: https://stackoverflow.com/questions/20210522/nodejs-mysql-error-connection-lost-the-server-closed-the-connection,
//posted by user CloudyMarble)
function handleDisconnect(){
  console.log("handling connection")
  con = mysql.createConnection(SQL_CONNECT);

  con.connect(function(err){
    if(err){
      console.log('error when connection to SQL database:',err);
      setTimeout(handleDisconnect, 2000);
    }
  });

  con.on('error',function(err){
    console.log('SQL connection error', err);
    if(err.code === "PROTOCOL_CONNECTION_LOST"){
      handleDisconnect();
    } else if (err.code === 'ECONNRESET') {
      console.log('Connection reset, attempting to reconnect...');
      handleDisconnect();
    } else if(err.code === "PROTOCOL_PACKETS_OUT_OF_ORDER"){
      handleDisconnect();
    }else if (err.code === "ECONNREFUSED"){
      handleDisconnect();
    }else{
      throw err;
    }
  });
}

handleDisconnect();

//Pulling all the card png files to use in the game
const folder = '../client/public/Cards';

let cardFiles = fs.readdirSync(folder);
let AllCards = [];

//Card object: has 1 property (Title) for referring to the card file name and 6 other properties
//which determine the properties of that particular UNO card
function Card(Title, Value, Color, WildStatus, DrawStatus, ReverseStatus, SkipStatus){
  this.Title = Title;
  this.Value = Value;
  this.Color = Color;
  this.WildStatus = WildStatus;
  this.DrawStatus = DrawStatus;
  this.ReverseStatus = ReverseStatus;
  this.SkipStatus = SkipStatus; 
}

//iterate through card png files and uses it's name to determine card properties such as color, value, and what type of action the card performs
//that card is then added to an array of card objects
for(var i = 0; i < cardFiles.length; i++){
  let currCard = cardFiles[i];
  if(['UNOdefault.png','CustomCard.png','AllUnoCards.png',"test.css","Draw4WildRed.png","Draw4WildBlue.png",
  "Draw4WildGreen.png","Draw4WildYellow.png","WildBlue.png","WildRed.png","WildGreen.png","WildYellow.png"].includes(currCard)){ //skips  certain card files because some aren't used as actual Deck cards
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
  }else if(val == 0){
    AllCards.push(new Card(title,val,color,wildstatus,drawstatus,reversestatus,skipstatus));
  }else{
    AllCards.push(new Card(title,val,color,wildstatus,drawstatus,reversestatus,skipstatus));
    AllCards.push(new Card(title,val,color,wildstatus,drawstatus,reversestatus,skipstatus));
  }
}

//shuffleArray(): takes in an array of card objects and shuffles them
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

//Array of player rooms. Each room has a set of players and a shuffled card deck
let Players2Rooms = [{players: [], deck: shuffleArray(JSON.parse(JSON.stringify(AllCards)))}];
let Players3Rooms = [{players: [], deck: shuffleArray(JSON.parse(JSON.stringify(AllCards)))}];
let Players4Rooms = [{players: [], deck: shuffleArray(JSON.parse(JSON.stringify(AllCards)))}];


//hashPassword(): takes in an sql query, a particular socket, a username, and a password
//this function hashes the password that the user inputs on the sign up form and puts it into 
//the password field of the users table in the databse
async function hashPassword(sql,socket,username,textPass){
  try{
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(textPass, salt);
    let values = [[username,hashedPassword]];
    let sql2 = mysql.format(sql,values);
    con.query(sql2,function(err,result){
      if(err) throw err
      socket.emit("LoginSuccess", {username: username});
    })
  }catch{
    console.log("ERROR COULDN'T HASH PASSWORD");
  }
}

//comparePassword(): takes in a socket, an object for storing a searched username and password,
//a username that was used as an input, and an input password. 
//The function compares the hashed password stored in the database with the input password 
async function comparePassword(socket,UserInfo,userEnter,textPass){
  if(UserInfo.length == 0){ //this username doesn't exist
    socket.emit("NoUser");
  }else{
    try{
      const match = await bcrypt.compare(textPass,UserInfo[0].password); //compare input password to password in databse
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

//Functions for socket.io
io.on('connection', function(socket){
    socket.emit("printSocket", {socketid: socket.id});

    //RegisterUser listener: Checks for if the input username and password that one entes when signing up is
    //a valid length. If so, the user successfully signs up assuming the user doesn't already exist
    socket.on("RegisterUser",function(data){
      if(data["username"].length < 3 && data["password"].length < 8){ //password & username too short
        socket.emit("DetailsTooShort");
        return;
      }
      else if(data["username"].length < 3){ //username too short
        socket.emit("UsernameTooShort");
        return;
      }
      else if(data["password"].length < 8){ //password too short
        socket.emit("PasswordTooShort");
        return;
      }

      let search = "SELECT username FROM users WHERE username = " + mysql.escape(data['username']); //SQL query for finding username
      let rowcount;
      con.query(search, function(err, result){
        if(err) throw err;
        rowcount = result.length;
        if(rowcount == 0){
          let sql = 'INSERT INTO users (username, password) VALUES (?)'; //SQL query for adding a new user
          hashPassword(sql,socket,data["username"],data["password"]); //hashes password and adds new user
        }else{
          socket.emit("UserAlreadyExists");
        }
      })
      
    });

    //LoginUser listener: Attempts to login a user with an input username and password
    socket.on("LoginUser",function(data){
      let UserInfo;
      let sql = "SELECT * FROM users WHERE username = ?"; //SQL query for finding username
      let username = [
        [data["username"]]
      ];
      sql = mysql.format(sql,username);
      con.query(sql, function(err,result){
        if (err) throw err;
        UserInfo = result;
        comparePassword(socket,UserInfo,data['username'],data["password"]); //compares password and logs user in if they exist
      })
    })

    //checkInGame listener: Checks if a particular user is already in a game
    socket.on('checkInGame',function(data){
      let sql = "SELECT inGame FROM users WHERE username = ?"; //SQL query for checking if the user is in a game
      let username = [
        [data["username"]]
      ];
      sql = mysql.format(sql, username);
      con.query(sql, function(err,result){
        if (err) throw err;
        let inGame = result[0].inGame;
        if(inGame === 1){ //Already in a game
          socket.emit("AlreadyInRoom");
        }else if(inGame === 0){ //Not in a game
          socket.emit("ReadyPlayer",{roomtype: data["roomtype"]})
        }
      })
    });

    //joinroom listener: Creates a room of users and gives them a shuffled Deck. Each user gets random 7 cards
    socket.on('joinroom', function(data){
      let roomname;
      let roomtype = data["roomtype"];
      if(roomtype == "2Player"){ //2 Player room
        roomname = roomtype + (Players2Rooms.length-1); //Roomname is based on the index of the room in the rooms array 
        socket.join(roomname);
        Players2Rooms[Players2Rooms.length-1].players.push({username: data["username"], usercards: [], socketid: socket.id});
        let playercards = [];
        for(let i = 0; i < CARDNUM; i++){ //Give a user 7 cards from the deck
          playercards.push(Players2Rooms[Players2Rooms.length-1].deck.pop());
          if(i == CARDNUM-1){
           let index = Players2Rooms[Players2Rooms.length-1].players.length - 1;
           Players2Rooms[Players2Rooms.length-1].players[index].usercards = playercards;
          }
        }
        socket.emit("CardsReceive", {cards: playercards}); //"CardReceive" emit: gives a player their cards
        if(Players2Rooms[Players2Rooms.length-1].players.length == TWOPLAYERS){
          io.to(roomname).emit("startGame", {players: Players2Rooms[Players2Rooms.length-1].players, RoomName: roomname, cards: Players2Rooms[Players2Rooms.length-1].deck});
          Players2Rooms.push({players: [], deck: shuffleArray(JSON.parse(JSON.stringify(AllCards)))});
        }
      }else if(roomtype == "3Player"){ //3 Player room
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
      }else if(roomtype == "4Player"){ //4 Player room
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
      let sql = "UPDATE users SET inGame = TRUE where username = ?"; //SQL query for setting a player to be in a game
      let username = [
        [data["username"]]
      ];
      sql = mysql.format(sql,username);
      con.query(sql, function(err,result){
        if (err) throw err;
      })
     
    });

    //userplaycard listener: Finds a particular room based on the provided room name and updates the set of all player cards
    //based on the card that a user just played
    socket.on("userplaycard",function(data){
      let roomindex = parseInt(data["roomname"].substring(1).replace( /^\D+/g, ''));
      if(parseInt(data["roomtype"]) === TWOPLAYERS){ //2 Player room
        Players2Rooms[roomindex].players = data["OrrUsers"];
        //getroundinfo emit: sends information of the updated cards after a player has played
        socket.to(data["roomname"]).emit("getroundinfo",{players: Players2Rooms[roomindex].players, trash: data["trash"], currpile: data["currpile"], tr_index: data["tr_index"], currTurn: data["currTurn"], reverse: data["reverse"]});
      }else if(parseInt(data["roomtype"]) === THREEPLAYERS){ //3 player room
        Players3Rooms[roomindex].players = data["OrrUsers"];
        socket.to(data["roomname"]).emit("getroundinfo",{players: Players3Rooms[roomindex].players, trash: data["trash"], currpile: data["currpile"], tr_index: data["tr_index"], currTurn: data["currTurn"], reverse: data["reverse"]});
      }else if(parseInt(data["roomtype"]) === FOURPLAYERS){ //4 player room
        Players4Rooms[roomindex].players = data["OrrUsers"];
        socket.to(data["roomname"]).emit("getroundinfo",{players: Players4Rooms[roomindex].players, trash: data["trash"], currpile: data["currpile"], tr_index: data["tr_index"], currTurn: data["currTurn"], reverse: data["reverse"]});
      }
      //setdraw emit: let's al other players know that a player is currently drawing (either from draw 2 or draw 4)
      if(data["mustDraw"]){
        socket.to(data["roomname"]).emit("setDraw",{currTurn: data["currTurn"]});
      }
    });

    //userpickdeck listener: updates the deck for all players after a user has picked a card from the deck
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

    //shufflenewdeck listener: takes the discard pile and shuffles it to make a new deck
    socket.on("shufflenewdeck",function(data){
      let roomindex = parseInt(data["roomname"].substring(1).replace( /^\D+/g, ''));
      let newDeck = shuffleArray(JSON.parse(JSON.stringify(data["trash"]))); //shuffling a new deck
      if(parseInt(data["roomtype"]) === TWOPLAYERS){
        Players2Rooms[roomindex].deck = newDeck;
        //emptytrash emit: let's all other players know that a new deck has been shuffled 
        io.to(data["roomname"]).emit("emptytrash",{newDeck: Players2Rooms[roomindex].deck}); 
      }else if(parseInt(data["roomtype"]) === THREEPLAYERS){
        Players3Rooms[roomindex].deck = newDeck;
        io.to(data["roomname"]).emit("emptytrash",{newDeck: Players3Rooms[roomindex].deck});
      }else if(parseInt(data["roomtype"]) === FOURPLAYERS){
        Players4Rooms[roomindex].deck = newDeck;
        io.to(data["roomname"]).emit("emptytrash",{newDeck: Players4Rooms[roomindex].deck});
      }
    })

    //changeWildColor listener: let's other players know what color a player has set the wild color to
    socket.on("changeWildColor",function(data){
        socket.to(data["roomname"]).emit("setWildColor",{currTurn: data["currTurn"], wildColor: data["wildColor"], currpile: data["currpile"]});
        if(data["mustDraw"]){
          socket.to(data["roomname"]).emit("setDraw",{currTurn: data["currTurn"]});
        }
    })

    //trychallenge listener: listens for a user who has just claimed a challenge
    socket.on("trychallenge",function(data){
      socket.to(data["roomname"]).emit("dochallenge",{challengeuser: data["challengeuser"]})
    })

    //challengeresponse listener: emits "endchallenge" to let the user who just challenged know the response to their challenged
    socket.on("challengeresponse",function(data){
      socket.to(data["roomname"]).emit("endchallenge",{challengeuser: data["challengeuser"], challengestate: data["challengestate"]})
    })

    //contgame listener: let's other players know that the game is continuing after a challenge is done
    socket.on("contgame",function(data){
      socket.to(data["roomname"]).emit("endchallengedraw")
    })

    //UNOfail listener: called when a user doesn't declare "UNO" if they have 2 cards left and emits penalizeOpponent all other users
    //to allow them to catch the user who failed to declare
    socket.on("UNOfail",function(data){
        socket.to(data["roomname"]).emit("penalizeOpponent",{currTurn: data["currTurn"],penaltyuser: data["user"]});
    });

    //UNOdeclared listener: called when a user successfully declares UNO and emits "setUNOdeclared"
    socket.on("UNOdeclared",function(data){
      socket.to(data["roomname"]).emit("setUNOdeclared",{UNOdec: data["UNOdec"]});
    })

    //penalizeuser listener: called when a user presses the "PENALIZE" button on a particular user who has failed to declare UNO
    socket.on("penalizeuser",function(data){
      let roomindex = parseInt(data["roomname"].substring(1).replace( /^\D+/g, ''));
      if(parseInt(data["roomtype"]) === 2){ //2 player room
        Players2Rooms[roomindex].players = data["OrrUsers"];
        Players2Rooms[roomindex].deck = data["Deck"];
        socket.to(data["roomname"]).emit("addpenalty",{penaltyuser: data["penaltyuser"], players: Players2Rooms[roomindex].players, Deck: Players2Rooms[roomindex].deck});
      }else if(parseInt(data["roomtype"]) === 3){ //3 player room
        Players3Rooms[roomindex].players = data["OrrUsers"];
        Players3Rooms[roomindex].deck = data["Deck"];
        socket.to(data["roomname"]).emit("addpenalty",{penaltyuser: data["penaltyuser"], players: Players3Rooms[roomindex].players, Deck: Players3Rooms[roomindex].deck});
      }else if(parseInt(data["roomtype"]) === 4){ //4 player room
        Players4Rooms[roomindex].players = data["OrrUsers"];
        Players4Rooms[roomindex].deck = data["Deck"];
        socket.to(data["roomname"]).emit("addpenalty",{penaltyuser: data["penaltyuser"], players: Players4Rooms[roomindex].players, Deck: Players4Rooms[roomindex].deck});
      }
    })

    //GameOver listener: called when a winner is declared and emits "setWinner" to set the winner 
    socket.on("GameOver",function(data){
        socket.to(data["roomname"]).emit("setWinner",{winner: data["winner"]});
    })

    //UpdateWinCount listener: queries the database to find the user who has won and update their win count
    socket.on("UpdateWinCount",function(data){
      let sql = "SELECT id FROM users WHERE username = ?";
      let username = [
        [data["user"]]
      ];
      sql = mysql.format(sql,username);
      let id;
      con.query(sql, function(err,result){
        if (err) throw err;
        id = result[0].id;
        let sql2 = "UPDATE users SET wins = wins + 1 WHERE id = ?";
        let values = [[id]];
        sql2 = mysql.format(sql2,values);
        con.query(sql2,function(err,result){
          if(err) throw err;
        })
      })
    })

    //UpdateLossCount listener: queries the database to find a use who has lost and update their loss count
    socket.on("UpdateLossCount",function(data){
      let sql = "SELECT id FROM users WHERE username = ?";
      let username = [
        [data["user"]]
      ];
      let id;
      sql = mysql.format(sql,username);
      con.query(sql, function(err,result){
        if (err) throw err;
        id = result[0].id;
        let sql2 = "UPDATE users SET losses = losses + 1 WHERE id = ?";
        let values = [[id]];
        sql2 = mysql.format(sql2, values);
        con.query(sql2,function(err,result){
          if(err) throw err;
        })
      })
    })

    //Disccontecting listener: Finds all users in a specific room and let's them know that a user has disconnected from the game
    //via the "Playerleft" emit. 
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
        Username = Players3Rooms[roomindex].players.find(Player => Player.socketid === socket.id).username;
        playerindex = Players3Rooms[roomindex].players.indexOf(Players3Rooms[roomindex].players.find(Player => Player.socketid === socket.id));
        Players3Rooms[roomindex].players.splice(playerindex,1);
      }else if(roomtype === '4'){
        Username = Players4Rooms[roomindex].players.find(Player => Player.socketid === socket.id).username;
        playerindex = Players4Rooms[roomindex].players.indexOf(Players4Rooms[roomindex].players.find(Player => Player.socketid === socket.id));
        Players4Rooms[roomindex].players.splice(playerindex,1);
      }
      let UserQuery = [
        [Username]
      ];
      let sql = "UPDATE users SET inGame = FALSE where username = ?"; //SQL query for setting "inGame" column for a specific user to FALSE
      sql = mysql.format(sql, UserQuery);
      con.query(sql, function(err,result){
        if (err) throw err;
      })
    })

  }
);

http.listen(PORT, function(err){
    if(err){console.log(err)};
    console.log(`Server listening on ${PORT}`);
});
