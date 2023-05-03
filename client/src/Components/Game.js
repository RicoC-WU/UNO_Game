import { Component } from 'react';
import 'socket.io-client';

//Game Component: The most important part of the website. This is the page for UNO game itself. Players
//can join 2 to 4 player rooms to play against each other. 
class Game extends Component {
    constructor(props){
        super(props);
        this.state = {
            currentUser: window.sessionStorage.getItem("UserLogged"), //current logged in user
            joinGame: window.sessionStorage.getItem("joining"), //current game type for which the user is joining
            RoomName: '', //current Room Name
            RoomType: 0, //current Room Type
            OrrUsers: [], //List of Users in order of them joining the room
            AllUsers: [], //List of Users based on who is next to you in the game
            Deck: [], //List of Cards in the Deck
            trash: [], //List of Cards in the Trash pile
            UserCards: [], //Your cards
            currTurn: '', //Whose turn it is
            order: 0,  //The order for which a player goes (i.e. order == 3 means you go 3rd)
            selDisabled: true, //Determines if your "select" button is disabled
            deckDisabled: true, //Determines if your "draw" button is disabled
            draw4wildDisabled: true, //Determines if you can put down a Draw 4 card or not
            currpile: ['','',''], //The current top 3 cards of the trash pile
            tr_index: 1, //An index that determines the alignment of a trash pile card
            mustDraw: false, //Determines whether you must draw from the pile or not
            wildColor: '', //Determines the current wild color
            reverse: false, //Determines if the turns are going in UNO reverse order
            playable: null, //Detects if a certain card is playablel for the current top card in the trash pile
            drawTurn: false, //Determines whether you have to draw on your turn
            UNOdec: '', //The user who has currently declared UNO
            penaltyuser: '', //The user who is currently being penalized
            challengeuser: '', //The user who is currently being challenged
            challenge: false, //Determines whether there is a challenge or not
            challengestate: '', //Either will be "REFUTE" for refuting a challenge or "CONCEDE" for conceding to a challenge
            concedeuser: '', //The user who conceded to a challenge
            challengedraw: null, //Determines if you have to draw due to failing a challenge
            winner: ''  //The user who is the winner of the game
        }

        //Binding "this" to all functions
        this.handleCardClick = this.handleCardClick.bind(this);
        this.handleDealCard = this.handleDealCard.bind(this);
        this.handleDeckCardDeal = this.handleDeckCardDeal.bind(this);
        this.handleDeckShuffle = this.handleDeckShuffle.bind(this);
        this.handleDrawAndShuffle = this.handleDrawAndShuffle.bind(this);
        this.handleWildCard = this.handleWildCard.bind(this);
        this.handleDrawAmount = this.handleDrawAmount.bind(this);
        this.handlePlayableCheck = this.handlePlayableCheck.bind(this);
        this.handleUNOPenalty = this.handleUNOPenalty.bind(this);
        this.handleChallenge = this.handleChallenge.bind(this);

    }

    //Use the componentDidMount to listen for multiple socket emits
    componentDidMount(){
        const self = this;
        const socket = this.props.socket;
        window.sessionStorage.removeItem("joining"); 
        if(this.state.currentUser === null || this.state.joinGame === null){  //redirect to homepage if you haven't properly joined a game or aren't logged in
            window.location.assign('/');
        }
        //"joinroom" socket emit --> sends info to the server that a specific user wants to join a specific room type
        socket.emit("joinroom",{username: this.state.currentUser, roomtype: this.state.joinGame});
        
        //"CardsReceive" socket listener --> assigns the user 7 random cards 
        socket.on("CardsReceive",function(data){
            self.setState({
                UserCards: data["cards"]
            },()=>{
            })
        })

        //"startGame" socket listener --> starts the game and sets up whose turn it is and the order for which users will go
        socket.on("startGame",function(data){
            let AllUsers = data["players"];
            let ShiftUsers = []
            let index = AllUsers.indexOf(AllUsers.find(Player => Player.username === window.sessionStorage.getItem("UserLogged")));
            let trash = [];
            let Deck = data["cards"]; 
            trash.push(Deck[Deck.length-1]); //adds one card to the trash pile to start
            Deck.splice(Deck.length-1,1); //gets rid of one card from the deck for the same reason as above

            self.setState({
                Deck: Deck,
                trash: trash,
                RoomName: data["RoomName"],
                RoomType: data["RoomName"][0],
                order: index
            }, ()=>{
                for(let i = 0; i < AllUsers.length; i++){ //Shifts the Users based on order
                    ShiftUsers.push(AllUsers[index]);
                    if(index+1 === AllUsers.length){
                        index = 0;
                    }else{
                        index++;
                    }
                }
                self.setState({
                    OrrUsers: AllUsers,
                    AllUsers: ShiftUsers,
                    currTurn: AllUsers[0].username,
                    currpile: [self.state.trash[0],'',''] 
                },()=>{
                    if(self.state.currTurn === self.state.currentUser){ //if its your turn, this checks to see which of your cards are playable
                        self.handlePlayableCheck(self);
                    }
                })
            })            
        }) 

        //"getroundinfo" socket listener --> gets the current game round info and displays it for all users
        socket.on("getroundinfo",function(data){
            let players = data["players"];
            let ShiftUsers = []
            let index = self.state.order;
            let trashcards = document.getElementsByClassName("trashcard");
            let tr_index = data["tr_index"];   
            for(let i = 0; i < trashcards.length; i++){       
                trashcards[i].style.zIndex = 0;
            }

            //sets the current top trash card in a specific alignment to visibly be on top
            if(trashcards.length === 3){
                if(tr_index === 1){
                    trashcards[2].style.zIndex = 1;
                }
                if(tr_index === 2){
                    trashcards[0].style.zIndex = 1;
                }
                if(tr_index === 0){
                    trashcards[1].style.zIndex = 1;
                }
            }

            //sets the current previous trash card in a specific alignment
            let tr_index2 = tr_index-1;
            if(trashcards[tr_index2]){
                trashcards[tr_index2].style.zIndex = 2;
            }else if(trashcards[2]){
                trashcards[2].style.zIndex = 2;
            }

            //updates the DOM to have all the current game info
            self.setState({
                trash: data["trash"],
                currpile: data["currpile"],
                tr_index: data["tr_index"],
                currTurn: data["currTurn"],
                wildColor: '',
                UNOdec: ''
            }, ()=>{

                //check for if the game is in reverse order
                if(self.state.reverse === !data["reverse"]){
                    self.setState({
                        reverse: data["reverse"]
                    })
                }

                //check for whose turn it is and see if they have playable cards
                if(self.state.currTurn === self.state.currentUser){
                    self.handlePlayableCheck(self);
                }


                for(let i = 0; i < players.length; i++){
                    ShiftUsers.push(players[index]);
                    if(index+1 === players.length){
                        index = 0;
                    }else{
                        index++;
                    }
                }    
               
                self.setState({
                    OrrUsers: players,
                    AllUsers: ShiftUsers,
                })
            })
        })

        //"getdeckroundinfo" socket listener --> gets the current game round info and displays it for all users (differs from "getroundinfo" because this)
        //is called when the player picks from the deck
        socket.on("getdeckroundinfo",function(data){
            let players = data["players"];
            let ShiftUsers = []
            let index = self.state.order;

            self.setState({
                currTurn: data["currTurn"],
                Deck: data["Deck"],
                drawTurn: false
            },()=>{
                if(self.state.currTurn === self.state.currentUser){
                    self.handlePlayableCheck(self);
                }
    
                for(let i = 0; i < players.length; i++){
                    ShiftUsers.push(players[index]);
                    if(index+1 === players.length){
                        index = 0;
                    }else{
                        index++;
                    }
                }    
                self.setState({
                    OrrUsers: players,
                    AllUsers: ShiftUsers
                })
            })
        })

        //"emptytrash" socket listener --> called when there's no more cards to pull from the deck and the trash deck is shuffled to create a new deck
        socket.on("emptytrash",function(data){
            self.setState({
                Deck: data["newDeck"],
                trash: [],
                currpile: ['','',''],
                tr_index: 0
            })
        })

        //"setWildColor" socket listener --> sets the Wild Color for all users (i.e. the color the user chooses when utting down a wild card)
        socket.on("setWildColor",function(data){
            let challengeuser = self.state.currTurn;
            self.setState({
                currTurn: data["currTurn"],
                wildColor: data["wildColor"],
                currpile: data["currpile"]
            },()=>{
                if(self.state.currTurn === self.state.currentUser){ 
                    self.handlePlayableCheck(self);
                    if(self.state.trash[self.state.trash.length-1].DrawStatus && self.state.trash[self.state.trash.length-1].WildStatus){ //checks if the top card is Draw wild 4 card and sets the challenge user
                        self.setState({
                            challengeuser: challengeuser
                        })
                    }
                }
            })

        })

        //"setDraw" socket listener --> disables the select button and forcefully makes the currennt turn's user draw
        socket.on("setDraw",function(data){
            if(self.state.currentUser === data["currTurn"]){
                self.setState({
                    mustDraw: true,
                    selDisabled: true,
                    deckDisabled: false
                })
            }else{
                self.setState({
                    drawTurn: true
                })
            }
        })

        //"penalizeOpponent" socket listener --> sets the "UNO" button to "PENALIZE" if you aen't the current turn's user
        socket.on("penalizeOpponent",function(data){
            let penaltyind = self.state.OrrUsers.indexOf(self.state.OrrUsers.find(Player => Player.username === data["penaltyuser"]));
            console.log(self.state.OrrUsers[penaltyind]);

            self.setState({
                penaltyuser: data["penaltyuser"],
            },()=>{
                //gives a 3 second window to try and peanlize the user who forgot to declare UNO
                setTimeout(()=>{
                    self.setState({
                        penaltyuser: ''
                    })
                }, 3000)
            })
        })

        //"addpenalty" socket listener --> Adds the penalty to the User who forgot to declare UNO (forces them to take cards from the deck)
        socket.on("addpenalty",function(data){
            let players = data["players"];
            let ShiftUsers = []
            let index = self.state.order;

            if(self.state.currentUser === data["penaltyuser"]){
                self.setState({
                    UserCards: players[index].usercards
                })
            }
            self.setState({
                Deck: data["Deck"],
                penaltyuser: ''
            },()=>{    
                for(let i = 0; i < players.length; i++){
                    ShiftUsers.push(players[index]);
                    if(index+1 === players.length){
                        index = 0;
                    }else{
                        index++;
                    }
                }    
                self.setState({
                    OrrUsers: players,
                    AllUsers: ShiftUsers,
                })
            })
        })

        //"setUNOdeclared" socket listener --> sets UNO for a particular player when they have 1 card left
        socket.on("setUNOdeclared",function(data){
            self.setState({
                UNOdec: data["UNOdec"]
            })
        })

        //"setWinner" socket listener --> sets the winner of the game
        socket.on("setWinner",function(data){
            self.setState({
                winner: data["winner"]
            },()=>{
                socket.emit("UpdateLossCount",{user: self.state.currentUser}) //update the loss count for a particular user if they lost
            })
        })

        //"PlayerLeft" socket listener --> redirects all Users to the home page when a player has left the game (unless the game is over)
        socket.on("PlayerLeft",function(data){
            if(self.state.winner !== ''){
                return;
            }
            alert("A player as left the game. Redirecting...");
            setTimeout(function(){
                window.location.assign("/"); //redirect
            }, 5000);
        })

        //"dochallenge" socket listener --> begins the challenge by setting the challengeuser
        socket.on("dochallenge",function(data){
            let challengeuser = data['challengeuser'];
            if(self.state.currentUser === data['challengeuser']){
                self.setState({
                    challengeuser: challengeuser,
                    challenge: true
                },()=>{
                    self.handlePlayableCheck(self);
                })
            }
        })

        //"endchallenge" socket listener --> Changes the "CHALLENGE" button for the Challenge User to be "REFUTE" if the challenge is not valid
        //or "CONCEDE" if the challenge is valid.
        socket.on("endchallenge",function(data){
            let challengestate = data['challengestate'];
            console.log(challengestate);
            if(self.state.challenge){
                if(challengestate === "REFUTE"){
                    self.setState({
                        challengestate: "REFUTE" ,
                        challengedraw: true,
                        mustDraw: true,
                        deckDisabled: false,
                    })
                }else if(challengestate === "CONCEDE"){
                    self.setState({
                        challengestate: "CONCEDE",
                        challengedraw: false,
                        mustDraw: false,
                    })
                }
            }
            self.setState({
                challenge: false,
                challengeuser: ''
            })

        })

        //"endchallengedraw" socket listener --> ends the challenge for the current turn's user
        socket.on("endchallengedraw",function(){
            if(self.state.currTurn === self.state.currentUser){
                self.setState({
                    challengestate: "",
                })
            }
        })
    }
    
    //handleCardClick() --> Enables a card to be highlighted when it is your turn
    handleCardClick(event){
        if(this.state.currTurn !== this.state.currentUser){ //do nothing if it isn't your turn
            return;
        }
        if(this.state.mustDraw || this.state.winner !== ''){ //do nothing if the game is over or you have to draw
            return;
        }
        if(this.state.challengestate !== ''){ //do nothing if there is a challenge 
            return;
        }

        const self = this;
        let cards = Array.from(document.querySelectorAll('[id^="YourCards"]')); //selects all of your cards

        if(event.target.style.border === "2.5px solid orange"){ //checks if your current card that was clicked is currently highlighted
            event.target.style.border = "2px solid black"; //turns border back to black
            self.setState({
                selDisabled: true //disable the select button
            })
            return;
        }

        self.setState({
            selDisabled: false //enable the select button once a card is clicked
        })

        for(let j = 0; j < cards.length; j++){ //changes all cards to have a black border initally
            cards[j].style.border = "2px solid black";
            cards[j].style.borderRadius = '10px';
            cards[j].className = "unselected";
        }

        event.target.style.border = "2.5px solid orange"; // ---------------------| | | --------------------- //
        event.target.style.borderRadius = "10px";         //  changes clicked card to have an orange border   //
        event.target.className = "selected";              // ---------------------| | | --------------------- //
    }

    //handleDealCard() --> Checks to see if your current selected card can be played once "SELECT" is pressed and plays it if it can be
    handleDealCard(event){
        const socket = this.props.socket; 
        let selectedcard = document.getElementsByClassName("selected")[0];
        let trashcards = document.getElementsByClassName("trashcard");
        let cards = Array.from(document.querySelectorAll('[id^="YourCards"]')); //Your cards as HTML elements
        let index = Array.from(cards).indexOf(selectedcard);  //index of a particular selected card in the list of cards 
        let currcard = this.state.UserCards[index]; //the current card itself
        let playerindex = this.state.OrrUsers.indexOf(this.state.OrrUsers.find(Player => Player.username === this.state.currentUser)); //find the current user's index in the list of players
        let OrrUsers = this.state.OrrUsers; 
        let currind = this.state.OrrUsers.indexOf(this.state.OrrUsers.find(Player => Player.username === this.state.currTurn)); //tracks your order of turn in the list of players 

        if(this.state.winner !== ''){ //limit the player from selecting cards if there is a winner
            return;
        }
            
        let toptrashcard = this.state.trash[this.state.trash.length-1]; //retrieve the top card from the deck to check against the selected card for playability
        
        if(this.state.wildColor !== ''){
            //if the card doesn't match the current Wild Color
            if((currcard.Color !== this.state.wildColor && currcard.Color !== "Black")){
                return;
            }
        }
        else if(currcard.Color !== "Black" && toptrashcard.Color !== "Black"){
            //if it's a draw card
            if(toptrashcard.DrawStatus){
                if(currcard.DrawStatus){
                    if((currcard.Color !== toptrashcard.Color && currcard.Value !== toptrashcard.Value)){
                        return;
                    }
                }
                else if((currcard.Color !== toptrashcard.Color)&&(currcard.DrawStatus !== toptrashcard.DrawStatus)){
                    return;
                }
            } //if it's a skip card
            else if(toptrashcard.SkipStatus){
                if((currcard.Color !== toptrashcard.Color)&&(currcard.SkipStatus !== toptrashcard.SkipStatus)){
                    return;
                }
            } //if it's a reverse card
            else if(toptrashcard.ReverseStatus){
                if((currcard.Color !== toptrashcard.Color)&&(currcard.ReverseStatus !== toptrashcard.ReverseStatus)){
                    return;
                }
            }else{ //if it's a regular number card 
                if((currcard.Value !== toptrashcard.Value)&&(currcard.Color !== toptrashcard.Color)){
                    return;
                }else if(currcard.DrawStatus && currcard.Color !== toptrashcard.Color){
                    return;
                }
            }
        }

        let UserCards = this.state.UserCards;
        let trash = this.state.trash;
        let currpile = this.state.currpile;
        let tr_index = this.state.tr_index;
    
        trash.push(this.state.UserCards[index])
        currpile[tr_index] = JSON.parse(JSON.stringify(this.state.UserCards[index]));

        for(let i = 0; i < trashcards.length; i++){
            trashcards[i].style.zIndex = 0;
        }
        //updates the top trash pile card and their alignments
        if(trashcards.length === 3){
            if(trashcards[tr_index]){
                trashcards[tr_index].style.zIndex = 2;
            }
            if(tr_index === 0){
                if(trashcards[2]){
                    trashcards[2].style.zIndex = 1;
                }
            }
            if(tr_index === 1){
                if(trashcards[0]){
                    trashcards[0].style.zIndex = 1;
                }
            }
            if(tr_index === 2){
                if(trashcards[1]){
                    trashcards[1].style.zIndex = 1;
                }
            }
        }

        tr_index = tr_index + 1;

        if(tr_index === 3){
            tr_index = 0;
        }

        UserCards.splice(index, 1);
        OrrUsers[playerindex].usercards = UserCards; //update the user cards
        
        //update current game info and send current info to all players via socket emits
        this.setState({
            OrrUsers: OrrUsers,
            wildColor: '',
            UserCards: UserCards,
            trash: trash,
            currpile: currpile,
            tr_index: tr_index,
            challenge: false,
            challengedraw: null,
            challengestate: '',
            challengeuser: ''
        },()=>{
            if(this.state.UserCards.length === 0){ //check if there is a winner
                this.setState({ 
                    winner: this.state.currentUser
                },()=>{
                    socket.emit("userplaycard",{OrrUsers: this.state.OrrUsers, roomtype: this.state.RoomType, roomname: this.state.RoomName,
                    trash: this.state.trash, currpile: this.state.currpile, tr_index: this.state.tr_index, currTurn: this.state.currTurn, 
                    reverse: this.state.reverse, mustDraw: false}) //emit to all other players the final current information
                    socket.emit("GameOver", {winner: this.state.winner, roomtype: this.state.RoomType, roomname: this.state.RoomName}) //emit to all other players who won
                    socket.emit("UpdateWinCount",{user: this.state.currentUser}) //emit to all other players information to update their win/loss counts
                })
            }else{
                for(let j = 0; j < cards.length; j++){ //unselects all cards after getting a new card from the deck
                    cards[j].style.border = "2px solid black";
                    cards[j].style.borderRadius = '10px';
                    cards[j].className = "unselected";
                }
                if(currcard.WildStatus){ //check if the card is a wild card
                    document.getElementsByClassName("cover")[0].style.display = "grid"; //unveils the wild carrd selection buttons
                    socket.emit("userplaycard",{OrrUsers: this.state.OrrUsers, roomtype: this.state.RoomType, roomname: this.state.RoomName,
                    trash: this.state.trash, currpile: this.state.currpile, tr_index: this.state.tr_index, currTurn: this.state.currTurn, 
                    reverse: this.state.reverse, mustDraw: false})
                }else if(currcard.SkipStatus || (currcard.ReverseStatus && this.state.OrrUsers.length === 2)){ //reverse and skip do the same thing for 2 player games
                    if(!this.state.reverse){  //anytime currind is updated, this indicates changing the turn to another payer
                        currind = currind + 2;
                    }else{
                        currind = currind - 2;
                    }
                    if(currind >= this.state.OrrUsers.length){ //anytime currind exceeds the number of users playing, it must be updated to start back to 0
                        currind = currind - this.state.OrrUsers.length;
                    }else if(currind < 0){
                        currind = currind + this.state.OrrUsers.length
                    }
                    this.setState({
                        selDisabled: true,
                        deckDisabled: true,
                        currTurn: OrrUsers[currind].username
                    },()=>{
                        if(this.state.currTurn === this.state.currentUser){
                            this.handlePlayableCheck(this);
                        }
                        socket.emit("userplaycard",{OrrUsers: this.state.OrrUsers, roomtype: this.state.RoomType, roomname: this.state.RoomName,
                        trash: this.state.trash, currpile: this.state.currpile, tr_index: this.state.tr_index, currTurn: this.state.currTurn, 
                        reverse: this.state.reverse, mustDraw: false})
                        if(this.state.UserCards.length === 1 && this.state.UNOdec === ''){ //Every turn, a check is used to see if a user who has UNO failed to declare UNO, leaving them vulnerable to a penatly
                            console.log("NOOOOOOOOOOOOOOOOOOOOOOO")
                            socket.emit("UNOfail", {roomtype: this.state.RoomType, roomname: this.state.RoomName, currTurn: this.state.currTurn, user: this.state.currentUser})
                        }else if(this.state.UNOdec !== ''){
                            this.setState({
                                UNOdec: ''
                            })
                        }
                    })
                }else if(currcard.ReverseStatus){ //check if the card is a reverse card
                    this.setState({
                        reverse: !this.state.reverse //reverse the game order 
                    },()=>{
                        if(!this.state.reverse){
                            currind = currind + 1;
                        }else{
                            currind = currind - 1;
                        }

                        if(currind === this.state.OrrUsers.length){
                            currind = 0;
                        }else if(currind < 0){
                            currind = this.state.OrrUsers.length - 1;
                        }
                        this.setState({
                            selDisabled: true,
                            deckDisabled: true,
                            currTurn: OrrUsers[currind].username
                        },()=>{
                            socket.emit("userplaycard",{OrrUsers: this.state.OrrUsers, roomtype: this.state.RoomType, roomname: this.state.RoomName,
                            trash: this.state.trash, currpile: this.state.currpile, tr_index: this.state.tr_index, currTurn: this.state.currTurn, 
                            reverse: this.state.reverse, mustDraw: false}) 
                            if(this.state.UserCards.length === 1 && this.state.UNOdec === ''){ 
                                console.log("NOOOOOOOOOOOOOOOOOOOOOOO")
                                socket.emit("UNOfail", {roomtype: this.state.RoomType, roomname: this.state.RoomName, currTurn: this.state.currTurn, user: this.state.currentUser})
                            }else if(this.state.UNOdec !== ''){
                                this.setState({
                                    UNOdec: ''
                                })
                            }
                        })
                    }) 
                }else if(currcard.DrawStatus){ //check if the card is a draw card
                    if(!this.state.reverse){
                        currind = currind + 1;
                    }else{
                        currind = currind - 1;
                    }

                    if(currind === this.state.OrrUsers.length){ 
                        currind = 0;
                    }else if(currind < 0){
                        currind = this.state.OrrUsers.length - 1;
                    }
                    this.setState({
                        selDisabled: true,
                        deckDisabled: true,
                        currTurn: OrrUsers[currind].username,
                        drawTurn: true
                    },()=>{
                        socket.emit("userplaycard",{OrrUsers: this.state.OrrUsers, roomtype: this.state.RoomType, roomname: this.state.RoomName,
                        trash: this.state.trash, currpile: this.state.currpile, tr_index: this.state.tr_index, currTurn: this.state.currTurn, 
                        reverse: this.state.reverse, mustDraw: true})
                        if(this.state.UserCards.length === 1 && this.state.UNOdec === ''){
                            console.log("NOOOOOOOOOOOOOOOOOOOOOOO")
                            socket.emit("UNOfail", {roomtype: this.state.RoomType, roomname: this.state.RoomName, currTurn: this.state.currTurn, user: this.state.currentUser})
                        }else if(this.state.UNOdec !== ''){
                            this.setState({
                                UNOdec: ''
                            })
                        }
                    })
                }else{ //goes here if the card is a plain UNO card
                    if(!this.state.reverse){
                        currind = currind + 1;
                    }else{
                        currind = currind - 1;
                    }

                    if(currind === this.state.OrrUsers.length){
                        currind = 0;
                    }else if(currind < 0){
                        currind = this.state.OrrUsers.length - 1;
                    }
                    this.setState({
                        selDisabled: true,
                        deckDisabled: true,
                        currTurn: OrrUsers[currind].username
                    },()=>{
                        socket.emit("userplaycard",{OrrUsers: this.state.OrrUsers, roomtype: this.state.RoomType, roomname: this.state.RoomName,
                        trash: this.state.trash, currpile: this.state.currpile, tr_index: this.state.tr_index, currTurn: this.state.currTurn, 
                        reverse: this.state.reverse, mustDraw: false})
                        if(this.state.UserCards.length === 1 && this.state.UNOdec === ''){
                            console.log("NOOOOOOOOOOOOOOOOOOOOOOO")
                            socket.emit("UNOfail", {roomtype: this.state.RoomType, roomname: this.state.RoomName, currTurn: this.state.currTurn, user: this.state.currentUser})
                        }else if(this.state.UNOdec !== ''){
                            this.setState({
                                UNOdec: ''
                            })
                        }
                    })
                }
            }
            
        })
    }

    //handleWildCard() --> Allows a player to update the wild color by pressing a button for a specific color. The wild card changes from black
    //to the appropiate color in this function.
    handleWildCard(color){ 
        const socket = this.props.socket;
        let currind = this.state.OrrUsers.indexOf(this.state.OrrUsers.find(Player => Player.username === this.state.currTurn));
        let currpile = this.state.currpile;
        let tr_index = this.state.tr_index-1;
        if(tr_index < 0){
            tr_index = 2;
        }

        //checks for each color after a specific color button is pressed. Each check has an additional check to see whether the color placed
        //was a regular wild card or a draw 4 wild card. It updates for the appropiate card placed down. 
        if(color === "Red"){ //red check
            currpile[tr_index].Color = "Red"
            if(!this.state.trash[this.state.trash.length-1].DrawStatus){ 
                currpile[tr_index].Title = "WildRed.png"; 
            }else{
                currpile[tr_index].Title = "Draw4WildRed.png"
            }
        }
        else if(color === "Blue"){ //blue check
            currpile[tr_index].Color = "Blue"
            if(!this.state.trash[this.state.trash.length-1].DrawStatus){
                currpile[tr_index].Title = "WildBlue.png"
            }else{
                currpile[tr_index].Title = "Draw4WildBlue.png"
            }
        }
        else if(color === "Yellow"){ //yellow check
            currpile[tr_index].Color = "Yellow"
            if(!this.state.trash[this.state.trash.length-1].DrawStatus){
                currpile[tr_index].Title = "WildYellow.png"
            }else{
                currpile[tr_index].Title = "Draw4WildYellow.png"
            }
        }
        else if(color === "Green"){ //green check
            currpile[tr_index].Color = "Green"
            if(!this.state.trash[this.state.trash.length-1].DrawStatus){
                currpile[tr_index].Title = "WildGreen.png"
            }else{
                currpile[tr_index].Title = "Draw4WildGreen.png"
            }
        }                                            
        

        if(!this.state.reverse){ //updates the turn after the wild color is chosen 
            currind = currind + 1;
        }else{
            currind = currind - 1;
        }

        if(currind === this.state.OrrUsers.length){
            currind = 0;
        }else if(currind < 0){
            currind = this.state.OrrUsers.length - 1;
        }

        this.setState({ //update game info
            deckDisabled: true,
            selDisabled: true,
            currTurn: this.state.OrrUsers[currind].username,
            currpile: currpile,
            wildColor: color,
        },()=>{
            document.getElementsByClassName("cover")[0].style.display = "none"; //the display for choosing the wild color disappears
            if(this.state.UserCards.length === 1 && this.state.UNOdec === ''){ //Uno declare check
                socket.emit("UNOfail", {roomtype: this.state.RoomType, roomname: this.state.RoomName, currTurn: this.state.currTurn, user: this.state.currentUser})
            }else if(this.state.UNOdec !== ''){
                this.setState({
                    UNOdec: ''
                })
            }
            if(this.state.trash[this.state.trash.length-1].DrawStatus){ //check for whether the next user has to draw based on if the wild card is a draw 4
                this.setState({drawTurn: true});
                socket.emit("changeWildColor", {roomtype: this.state.RoomType, roomname: this.state.RoomName, currTurn: this.state.currTurn, wildColor: this.state.wildColor, currpile: this.state.currpile, mustDraw: true})    
            }else{
                socket.emit("changeWildColor", {roomtype: this.state.RoomType, roomname: this.state.RoomName, currTurn: this.state.currTurn, wildColor: this.state.wildColor, currpile: this.state.currpile, mustDraw: false})
            }
        })
        
    }

    //handleDeckCardDeal() --> called when a user has taken a card from the deck. If a draw turn occured, the turn is updated. Otherwise, the
    //player can keep drawing until they have a playable card.
    handleDeckCardDeal(){
        const socket = this.props.socket;

        let Deck = this.state.Deck; 
        let UserCards = this.state.UserCards;
        let OrrUsers = this.state.OrrUsers;
        let playerindex = this.state.OrrUsers.indexOf(this.state.OrrUsers.find(Player => Player.username === this.state.currentUser));
        let currind = this.state.OrrUsers.indexOf(this.state.OrrUsers.find(Player => Player.username === this.state.currTurn));
        let cards = Array.from(document.querySelectorAll('[id^="YourCards"]'));

        UserCards.push(Deck[Deck.length-1]); //Update user cards and deck accordingly
        Deck.splice(Deck.length-1,1);

        OrrUsers[playerindex].usercards = UserCards;

        if(!this.state.mustDraw){ //check if the current turn was a draw turn or not. If so, the turn is updated
            if(!this.state.reverse){
                currind = currind + 1;
            }else{
                currind = currind - 1;
            }

            if(currind === this.state.OrrUsers.length){
                currind = 0;
            }else if(currind < 0){
                currind = this.state.OrrUsers.length - 1;
            }
        }

        this.setState({ //update game info
            OrrUsers: OrrUsers,
            Deck: Deck,
            UserCards: UserCards,
            UNOdec: ''
        },()=>{
            this.handlePlayableCheck(this,()=>{; 
                if(!this.state.playable){ //check to see if a player can keep drawing based on if they have a playable card based on handlePlayableCheck
                    this.setState({
                        currTurn: OrrUsers[currind].username
                    })
                }
            })
    
            for(let j = 0; j < cards.length; j++){ //unselects any previous selected cards
                cards[j].style.border = "2px solid black";
                cards[j].style.borderRadius = '10px';
                cards[j].className = "unselected";
            }

            this.setState({
                selDisabled: true, 
            },()=>{
                socket.emit("userpickdeck",{OrrUsers: this.state.OrrUsers, roomtype: this.state.RoomType, roomname: this.state.RoomName, Deck: this.state.Deck, 
                currTurn: this.state.currTurn}) //updates all users with the info that the current turn's user has picked from the deck
            })

        })
    }

    //handleDeckShuffle() --> Shuffles a new deck from the trash pile
    handleDeckShuffle(){ 
        const socket = this.props.socket; 
        socket.emit("shufflenewdeck",{roomtype: this.state.RoomType, roomname: this.state.RoomName, 
        trash: this.state.trash})
    }

    //handleDrawAndShuffle --> allows user to draw AND shuffles a new deck if forceful drawing makes the deck run out of cards
    handleDrawAndShuffle(){
        const socket = this.props.socket;
        let currind;
        let concedeuser = this.state.concedeuser;
        let drawAmount = this.state.concedeuser === '' && this.state.challengedraw ? 6 : this.state.trash[this.state.trash.length-1].Value; //the draw amount depends on whether there was a challenge that failed or if there was no challenge then
                                                                                                                                            //it depends on the draw amount of the actual draw card.
        if(concedeuser === ''){ //check to see if there is a user who conceded a chellenge
            currind = this.state.OrrUsers.indexOf(this.state.OrrUsers.find(Player => Player.username === this.state.currTurn));
        }else{
            currind = this.state.OrrUsers.indexOf(this.state.OrrUsers.find(Player => Player.username === concedeuser));
        }

        //keeps drawing from the deck as much as possible until the deck runs out of cards
        for(let i = 0; i < this.state.Deck.length; i++){ 
            this.handleDeckCardDeal();
            drawAmount--;
        } 
        this.handleDeckShuffle(); //shuffles the deck once the deck runs out of cards
        for(let i = 0; i < drawAmount; i++){ //continues taking cards from the new deck until the draw amount if met.
            this.handleDeckCardDeal();
        }

        if(!this.state.reverse){ //update turn
            currind = currind + 1;
        }else{
            currind = currind - 1;
        }

        if(currind === this.state.OrrUsers.length){
            currind = 0;
        }else if(currind < 0){
            currind = this.state.OrrUsers.length - 1;
        }
        
        this.setState({ //update game info
            currTurn: this.state.OrrUsers[currind].username,
            selDisabled: true,
            mustDraw: false,
            challenge: false,
            challengedraw: null,
            challengestate: '',
            challengeuser: '',
            concedeuser: '',
            drawTurn: false
        },()=>{
            this.setState({ deckDisabled: true})
            socket.emit("userpickdeck",{OrrUsers: this.state.OrrUsers, roomtype: this.state.RoomType, roomname: this.state.RoomName, Deck: this.state.Deck, 
            currTurn: this.state.currTurn}) //updates info to all players that a user has picked from the deck
            if(concedeuser === this.state.currentUser){ //emit to all users that the game can continue since the challenge is over
                socket.emit("contgame",{roomname: this.state.RoomName})
            }
        })
    }

    //handleDrawAmount() --> Makes the player continually draw from the deck until they can stop
    handleDrawAmount(){
        const socket = this.props.socket;
        let currind;
        let concedeuser = this.state.concedeuser;
        if(concedeuser === ''){
            currind = this.state.OrrUsers.indexOf(this.state.OrrUsers.find(Player => Player.username === this.state.currTurn)); //
        }else{
            currind = this.state.OrrUsers.indexOf(this.state.OrrUsers.find(Player => Player.username === concedeuser));
        }
        if(this.state.challengedraw && this.state.concedeuser === ''){ //checks to see if there is a concede user and they have to draw
            for(let i = 0; i < 6; i++){
                this.handleDeckCardDeal();
            }
        } else {
            for(let i = 0 ; i < this.state.trash[this.state.trash.length-1].Value; i++){
                this.handleDeckCardDeal();
            }
        }

        if(!this.state.reverse){ //update turn
            currind = currind + 1;
        }else{
            currind = currind - 1;
        }

        if(currind === this.state.OrrUsers.length){
            currind = 0;
        }else if(currind < 0){
            currind = this.state.OrrUsers.length - 1;
        }

        this.setState({ //update game info
            currTurn: this.state.OrrUsers[currind].username,
            selDisabled: true,
            mustDraw: false,
            challenge: false,
            challengedraw: null,
            challengestate: '',
            challengeuser: '',
            concedeuser: '',
            drawTurn: false
        },()=>{
            this.setState({ deckDisabled: true})
            socket.emit("userpickdeck",{OrrUsers: this.state.OrrUsers, roomtype: this.state.RoomType, roomname: this.state.RoomName, Deck: this.state.Deck, 
            currTurn: this.state.currTurn}) //update to other users that a user has picked from the deck
            if(concedeuser === this.state.currentUser){
                socket.emit("contgame",{roomname: this.state.RoomName}) //update to other users that the game can continue and the challenge is over
            }
        })
    }

    //handlePlayableCheck() --> A function that goes over every card for a particular User and sees if there is at least 1 playable card
    handlePlayableCheck(self){
        let UserCards = self.state.UserCards; 
        let count = 0;
        let draw4wildcount = 0;
        let toptrashcard;
        let tr_index = self.state.tr_index - 2;
        if(tr_index === -1){
            tr_index = 2;
        }else if(tr_index === -2){
            tr_index = 1;
        }

        if(self.state.challengeuser === ''){
            toptrashcard = self.state.trash[self.state.trash.length-1];
        }else if(self.state.challengeuser === self.state.currentUser){
            toptrashcard = self.state.currpile[tr_index]
        }

        for(let i = 0; i < self.state.UserCards.length; i++){
            let draw4wild = false;
            let playable = true; //by default sets a card to be playable, going through the if statements
            let currcard = UserCards[i]; 
            if(currcard.DrawStatus && currcard.WildStatus){ //a check to see if the partciular card is a draw 4 wild card (both Draw and Wild status)
                draw4wild = true;
            }
            if(this.state.wildColor !== '' && !this.state.challenge){ //checks if there's a wild card placed during regular play (i.e. not during a challenge)
                if((currcard.Color !== this.state.wildColor && currcard.Color !== "Black")){ //checks if the current card matches the wild color
                    playable = false;
                }
            }
            else if(currcard.Color !== "Black" && toptrashcard.Color !== "Black"){ //the cases for which both the current card and the top trash card are not black
                //if it's a draw card ("it" being the top trash card)
                if(toptrashcard.DrawStatus){
                    if(currcard.DrawStatus){
                        if((currcard.Color !== toptrashcard.Color && currcard.Value !== toptrashcard.Value)){ //checks if the current card matches both color and value for the draw card
                            playable = false;
                        }
                    }
                    else if((currcard.Color !== toptrashcard.Color)&&(currcard.DrawStatus !== toptrashcard.DrawStatus)){ //checks if current card and top trash card are the same color if the top trash card is a draw card
                        playable = false;
                    }
                } //if it's a skip card
                else if(toptrashcard.SkipStatus){
                    if((currcard.Color !== toptrashcard.Color)&&(currcard.SkipStatus !== toptrashcard.SkipStatus)){
                        playable = false;
                    }
                } //if it's a reverse card
                else if(toptrashcard.ReverseStatus){
                    if((currcard.Color !== toptrashcard.Color)&&(currcard.ReverseStatus !== toptrashcard.ReverseStatus)){
                        playable = false;
                    }
                }else{ //if it's a regular number card 
                    if((currcard.Value !== toptrashcard.Value)&&(currcard.Color !== toptrashcard.Color)){ //if the current card is also a regular card 
                        playable = false;
                    }
                    else if(currcard.DrawStatus && currcard.Color !== toptrashcard.Color){ //if the current card is Draw card
                        playable = false;
                    }
                }
            }
            // if(self.state.challengeuser){
            //  console.log(playable);
            // }

            //updates the playable card count and the number of draw 4 wild cards
            if(playable){
                count++;
                if(draw4wild){
                    draw4wildcount++;
                }
            }
        }
        //disables the player's deck draw if there is more than one playable card or if the playable count is the same as the draw 4 wild count 
        //(i.e. you can only play the draw 4 card).
        if(count >= 1 || (count === draw4wildcount && draw4wildcount > 0)){
            self.setState({
                deckDisabled: true, //disable the deck
                playable: true,
            },()=>{
                if(self.state.mustDraw && !self.state.challenge){
                    self.setState({
                        deckDisabled: false
                    })
                }
                else if(self.state.challenge){ //You lost the challenge
                    self.setState({
                        challengestate: "CONCEDE",
                    })
                }
                
            })
        }else{
            self.setState({
                deckDisabled: false,
                playable: false,
            },()=>{
                if(self.state.challenge){ //You won the challenge
                    self.setState({
                        challengestate: "REFUTE",
                        deckDisabled: true
                    })
                }
            })
        }
    }

    //handleUNOPenalty() --> Handles the UNO penalty if a player fails to declare UNO
    handleUNOPenalty(){
        const socket = this.props.socket;
        let penaltyuser = this.state.penaltyuser; //the user whose being penalized
        let penaltyind = this.state.OrrUsers.indexOf(this.state.OrrUsers.find(Player => Player.username === this.state.penaltyuser));
        let penaltyUserCards = this.state.OrrUsers[penaltyind].usercards; //the penalized users cards
        let Deck = this.state.Deck;
        let OrrUsers = this.state.OrrUsers;

        //automatically gives 2 cards onto the penalty user
        penaltyUserCards.push(Deck[Deck.length-1])
        Deck.splice(Deck.length-1,1);
        penaltyUserCards.push(Deck[Deck.length-1])
        Deck.splice(Deck.length-1,1);

        //updates the cards on the client's end 
        OrrUsers[penaltyind].usercards = penaltyUserCards;

        this.setState({
            OrrUsers: OrrUsers,
            penaltyuser: ''
        },()=>{ //sends the updated information to all other users
            socket.emit("penalizeuser",{penaltyuser: penaltyuser, OrrUsers: this.state.OrrUsers, roomtype: this.state.RoomType, roomname: this.state.RoomName, Deck: this.state.Deck})
        })
    }

    //handleChallenge() --> Handles the challenge for when a user proposes one on another
    handleChallenge(event){
        const socket = this.props.socket;
        let challengestate = this.state.challengestate;
        if(challengestate === "CONCEDE"){ //the challenge was conceded
            this.setState({
                deckDisabled: false,
                mustDraw: true,
                concedeuser: this.state.challengeuser,
                challengedraw: true,
                drawTurn: false
            },()=>{  
                //send updated information to other players
                socket.emit("challengeresponse",{challengestate: challengestate, challengeuser: this.state.concedeuser, OrrUsers: this.state.OrrUsers, roomname: this.state.RoomName})
            })
        }else if(this.state.challengestate === "REFUTE"){ //the challenge was refuted
            this.setState({
                challengedraw: false,
                challenge: false
            }) 
            //send updated information to other players
            socket.emit("challengeresponse",{challengestate: challengestate, challengeuser: this.state.challengeuser, OrrUsers: this.state.OrrUsers, roomname: this.state.RoomName})
        }
        this.setState({ 
            challengestate: '',
            challengeuser: ''
        })
    }

    render(){
        return(
            <div className="UNO_Game"> {/*The entire game page*/}
                {this.state.currTurn === '' ? 
                <>
                    WAITING {/*Displays "WAITING" when there is isn't enough users in the room yet*/}
                    <div className="blankspace"></div>
                    <div className="blankspace"></div>
                    <div className="blankspace"></div>
                    <div className="blankspace"></div>
                </> 
                : 
                <>
                <div className="GameInfo"> {/*Displays notifications/information related to the game*/}

                    {/*The current user's turn*/}
                    {this.state.currTurn === this.state.currentUser ? <div className="currTurn">Your Turn!</div> : <div className="currTurn">{this.state.currTurn}'s Turn!</div>}
                    
                    {/*Notification for UNO Reverse*/}
                    {this.state.trash.length > 1 && this.state.trash[this.state.trash.length-1].ReverseStatus ? <div className="reversestatus">UNO REVERSE!</div> : <div></div>}

                    {/*Notification for changing of Wild color*/}
                    {this.state.wildColor !== "" ? <div>The color is now {this.state.wildColor}</div> : <div></div>}   

                    {/*Notifications for drawing and challenges*/}
                    {this.state.trash[this.state.trash.length-1].DrawStatus && (this.state.drawTurn || this.state.mustDraw || this.state.challengedraw === false) ? 

                        (this.state.challengedraw && this.state.concedeuser === ''? <div className="drawstatus">CHALLENGE LOST, DRAW 6!</div> //you failed to challenge the user who put the card down
                        : this.state.challengedraw ? <div>YOU GOT CAUGHT! DRAW 4</div> //you lost the challenge and you were the one who put the card down
                        : this.state.challengedraw === false ? <div className="drawstatus">CHALLENGE WON</div> //you suceeded to challenge the user who put the card down
                        : <div className="drawstatus">DRAW {this.state.trash[this.state.trash.length-1].Value}!</div>) //regular draw 
                        : <div></div>}

                    {/*Notification for a turn skip*/}
                    {this.state.trash.length > 1 && this.state.trash[this.state.trash.length-1].SkipStatus ? <div className="skipstatus">TURN SKIP!</div> : <div></div>} 

                    {/*Notificaiton for a player declaring UNO*/}
                    {this.state.UNOdec !== "" ? <div className="UNOdeclared">{this.state.UNOdec} has declared UNO!</div> : <div></div>}
                  
                    { //Enabling the UNO button/changing it to "PENALIZE"
                        this.state.penaltyuser !== '' ? <div className='UNObtnContainer'><button className="Penaltybtn" onClick={this.handleUNOPenalty}>PENALIZE</button></div> : this.state.UserCards.length === 2 && this.state.currTurn === this.state.currentUser && !this.state.mustDraw && this.state.playable? 
                        <div className='UNObtnContainer'><button className="UNObtn" onClick={()=>this.setState({UNOdec: this.state.currentUser},()=>{this.props.socket.emit("UNOdeclared",{UNOdec: this.state.UNOdec, roomtype: this.state.RoomType, roomname: this.state.RoomName})})}>UNO</button></div> 
                        :<div className='UNObtnContainer'><button className="UNObtn" disabled={true}>UNO</button> </div> 
                    
                    }
                    { //Enabling challenge button
                        this.state.challengeuser === this.state.currentUser ?
                                                
                        <div className="ChallengeBtnContainer"><button className="Challengebtn" onClick={this.handleChallenge}>{this.state.challengestate}</button></div> : 

                        this.state.challengeuser !== '' ? 

                        <div className="ChallengeBtnContainer"><button className="Challengebtn" onClick={()=>this.setState({challenge: true, deckDisabled: true},()=>{this.props.socket.emit("trychallenge",{challengeuser: this.state.challengeuser, roomname: this.state.RoomName})})}>CHALLENGE</button></div> : 
                        
                        <div className="ChallengeBtnContainer"><button className="Challengebtn" disabled={true}>CHALLENGE</button></div>
                    }
                    {//Winner notification if there is a winner
                    this.state.winner ? 
                    
                    <div className="winner">
                        The Winner is {this.state.winner}!
                    </div>
                    :
                    <></>
                    }
                </div>
                {/*All players div --> display info for players, their cards, and challenge information*/}
                <div className={"AllPlayers"+this.state.RoomType}>
                    {/*show all the player cards*/}
                    {this.state.AllUsers.map((Player)=>(
                        <div id={"playernext"+this.state.AllUsers.indexOf(this.state.AllUsers.find(newPlayer => newPlayer.username === Player.username))}>  
                            {
                                //All information regarding the client's set up for selecting cards, drawing, etc.
                                Player.username === sessionStorage.getItem("UserLogged") ? 
                                //WhoCards div --> information for player cards and editing the draw button depending on if there's a chellenge 
                                <div className="WhoCards">
                                    <button className="selectBtn" onClick={this.handleDealCard} disabled={this.state.selDisabled}>SELECT</button>  {/*select button for selecting a card*/}
                                    {   this.state.challenge && this.state.challengedraw === null ? 
                                        <>
                                        <button className="DeckDrawBtn" disabled={true}>...WAITING...</button> {/*waiting to see if the challenge is valid or not to the challenged player*/}
                                        </>
                                        :
                                        this.state.Deck.length > 0 && this.state.challengestate === "REFUTE" && this.state.concedeuser === "" ? 
                                            this.state.Deck.length >= 6 ? 
                                            //Challenge was refuted, draw 6 cards! (changes the draw button to this)
                                            <button className="DeckDrawBtn" onClick={this.handleDrawAmount} disabled={this.state.deckDisabled}>DRAW 6 CARDS FROM DECK</button>
                                            :
                                            <button className="DeckDrawBtn" onClick={this.handleDrawAndShuffle} disabled={this.state.deckDisabled}>DRAW AND SHUFFLE 6 CARDS</button>
                                        :
                                        this.state.Deck.length > 0 && this.state.mustDraw ? 
                                            //changes the draw button to draw a specific amount if the top card is a draw card
                                            this.state.Deck.length >= this.state.trash[this.state.trash.length-1].Value ?
                                            <>
                                            <button className="DeckDrawBtn" onClick={this.handleDrawAmount} disabled={this.state.deckDisabled}>DRAW {this.state.trash[this.state.trash.length-1].Value} CARDS FROM DECK</button>
                                            </>
                                            :
                                            <>
                                            <button className="DeckDrawBtn" onClick={this.handleDrawAndShuffle} disabled={this.state.deckDisabled}>DRAW AND SHUFFLE NEW DECK{this.state.trash[this.state.trash.length-1].Value} CARDS FROM DECK</button>
                                            </>
                                        :
                                        this.state.Deck.length > 0 ?
                                        <> {/*default draw button*/}
                                        <button className="DeckDrawBtn" onClick={this.handleDeckCardDeal} disabled={this.state.deckDisabled}>DRAW FROM DECK</button>
                                        </>
                                        :
                                        <>  {/*shuffle button if there are no more deck cards*/}
                                        <button className="DeckDrawBtn" onClick={this.handleDeckShuffle} disabled={this.state.deckDisabled}>SHUFFLE NEW DECK</button>
                                        </>
                                    }
                                    <br></br>
                                    Your Cards:
                                </div>
                                :
                                //all other players cars
                                <div className="WhoCards">
                                    {Player.username}'s Cards:
                                </div>
                            }
                            
                            <div className={"playercards"} id={"cards"+this.state.AllUsers.indexOf(this.state.AllUsers.find(newPlayer => newPlayer.username === Player.username))}>
                            {//all physical player card images 
                            Player.usercards.map((Card)=>(
                                <>
                                    {
                                        Player.username === sessionStorage.getItem("UserLogged") || (Player.username === this.state.challengeuser && this.state.challenge)? 
                                        <>  {/*Your cards*/}
                                            <img id={"YourCards"+Player.usercards.indexOf(Card)} src={'./Cards/'+Card.Title} alt={Card.Title} onClick={this.handleCardClick} ></img>
                                        </> 
                                        : 
                                        <>   {/*Shows UNO default cards for other player cards (so you can't see them)*/}
                                            <img id={"OtherUserCards"+Player.usercards.indexOf(Card)} src={'./Cards/UNOdefault.png'} alt={'UNO Default Card'}></img>
                                        </>
                                    }

                                </>
                            ))}
                            </div>
                        </div>
                    ))}
                    {
                    //Adding more blankspace depending on number of players
                    <>
                    {this.state.RoomType === "2" ?
                    <>
                    <div className="blankspace"></div>
                    <div className="blankspace"></div>
                    </>
                    :
                    this.state.RoomType === "3" ?
                    <>
                    <div className="blankspace"></div>
                    </>
                    :
                    <>
                    </>
                    }
                    </>
                    } 
                    {/*Trash card pile. This div visually shows the top 3 trash pile cards*/}
                    <div className="trashpile">
                        {
                        this.state.currpile[0] !== '' ? <><img className="trashcard" src={'./Cards/'+this.state.currpile[0].Title} alt={'UNO trash Card'}></img></> :<></>
                        }
                        {
                        this.state.currpile[1] !== '' ? <><img className="trashcard" src={'./Cards/'+this.state.currpile[1].Title} alt={'UNO trash Card'}></img></> :<></>
                        }
                        {
                        this.state.currpile[2] !== '' ? <><img className="trashcard" src={'./Cards/'+this.state.currpile[2].Title} alt={'UNO trash Card'}></img></> :<></>
                        }
                    </div>
                    {/*The top deck card and how many deck cards are left (shows the top card to the current turn's player
                     and shows the UNO default card toall other players)*/}
                    <div className="DeckHolder">
                        <div className="Deck">
                        Top Deck Card ({this.state.Deck.length} left):
                        {
                            (this.state.Deck.length > 0 && this.state.currTurn === this.state.currentUser) && this.state.playable === false ? 
                            <>
                                <img className="DeckCard" src={'./Cards/'+this.state.Deck[this.state.Deck.length-1].Title} alt={'UNO Deck Card'}></img>
                            </>
                            :
                            this.state.Deck.length > 0 ?
                            <>
                              <img className="DeckCard" src={'./Cards/UNOdefault.png'} alt={'UNO Deck Card'}></img>
                            </>
                            :
                            <>
                            </>
                        }
                        </div>
                    </div>
                </div>
                <div className='cover'>  {/*Wild Card buttons to select a color. This only appears when a wild card is placed*/}
                    <div className="btncontainer">
                        <button className="colorbtn" id="REDbtn" onClick={()=>this.handleWildCard("Red")}>RED</button>  {/*Red button*/}
                        <button className="colorbtn" id="BLUEbtn" onClick={()=>this.handleWildCard("Blue")}>BLUE</button>  {/*Blue button*/}
                        <br/><br/>
                        <button className="colorbtn" id="YELLOWbtn" onClick={()=>this.handleWildCard("Yellow")}>YELLOW</button>  {/*Yellow button*/}
                        <button className="colorbtn" id="GREENbtn" onClick={()=>this.handleWildCard("Green")}>GREEN</button>  {/*Green button*/}
                    </div>
                </div>
                </>
                }
            </div>
        );      
    }
}

export default Game;
