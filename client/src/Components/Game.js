import { Component } from 'react';
import 'socket.io-client';

class Game extends Component {
    constructor(props){
        super(props);
        this.state = {
            currentUser: window.sessionStorage.getItem("UserLogged"),
            joinGame: window.sessionStorage.getItem("joining"),
            RoomName: '',
            RoomType: 0,
            OrrUsers: [],
            AllUsers: [],
            Deck: [],
            trash: [],
            UserCards: [],
            currTurn: '',
            order: 0,
            selDisabled: true,
            deckDisabled: true,
            currpile: ['','',''],
            tr_index: 1,
            mustDraw: false,
            wildColor: '',
            reverse: false,
            playable: null,
            drawTurn: false,
            UNOdec: '',
            penaltyuser: '',
            winner: ''
        
        }
        this.handleCardClick = this.handleCardClick.bind(this);
        this.handleDealCard = this.handleDealCard.bind(this);
        this.handleDeckCardDeal = this.handleDeckCardDeal.bind(this);
        this.handleDeckShuffle = this.handleDeckShuffle.bind(this);
        this.handleWildCard = this.handleWildCard.bind(this);
        this.handleDrawAmount = this.handleDrawAmount.bind(this);
        this.handlePlayableCheck = this.handlePlayableCheck.bind(this);
        this.handleUNOPenalty = this.handleUNOPenalty.bind(this);

    }
    

    componentDidMount(){
        const self = this;
        const socket = this.props.socket;
        window.sessionStorage.removeItem("joining");
        if(this.state.currentUser === null || this.state.joinGame === null){
            // window.sessionStorage.removeItem("joining");
            window.location.assign('/');
        }
        socket.emit("joinroom",{username: this.state.currentUser, roomtype: this.state.joinGame});
        socket.on("CardsReceive",function(data){
            self.setState({
                UserCards: data["cards"]
            },()=>{
                // console.log(self.state.UserCards);
            })
        })
        socket.on("startGame",function(data){
            let AllUsers = data["players"];
            // console.log(AllUsers);
            let ShiftUsers = []
            let index = AllUsers.indexOf(AllUsers.find(Player => Player.username === window.sessionStorage.getItem("UserLogged")));
            let trash = [];
            let Deck = data["cards"];
            trash.push(Deck[Deck.length-1]);
            Deck.splice(Deck.length-1,1);
            // console.log(index);
            self.setState({
                Deck: Deck,
                trash: trash,
                RoomName: data["RoomName"],
                RoomType: data["RoomName"][0],
                order: index
            }, ()=>{
                // console.log(self.state.RoomType)
                // console.log("Deck:")
                // console.log(self.state.Deck);
                for(let i = 0; i < AllUsers.length; i++){
                    ShiftUsers.push(AllUsers[index]);
                    if(index+1 === AllUsers.length){
                        index = 0;
                    }else{
                        index++;
                    }
                }
                // console.log(ShiftUsers);
                self.setState({
                    OrrUsers: AllUsers,
                    AllUsers: ShiftUsers,
                    currTurn: AllUsers[0].username,
                    currpile: [self.state.trash[0],'','']
                },()=>{
                    if(self.state.currTurn === self.state.currentUser){
                        self.handlePlayableCheck(self);
                        // self.setState({
                        //     deckDisabled: true
                        // })
                    }
                })
            })            
        }) 

        socket.on("getroundinfo",function(data){
            let players = data["players"];
            let ShiftUsers = []
            let index = self.state.order;
            let trashcards = document.getElementsByClassName("trashcard");
            let tr_index = data["tr_index"];

            for(let i = 0; i < trashcards.length; i++){
                
                trashcards[i].style.zIndex = 0;
            }

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

            let tr_index2 = tr_index-1;
            if(trashcards[tr_index2]){
                trashcards[tr_index2].style.zIndex = 2;
            }else if(trashcards[2]){
                trashcards[2].style.zIndex = 2;
            }

            self.setState({
                trash: data["trash"],
                currpile: data["currpile"],
                tr_index: data["tr_index"],
                currTurn: data["currTurn"],
                wildColor: '',
                UNOdec: ''
            }, ()=>{

                if(self.state.reverse === !data["reverse"]){
                    self.setState({
                        reverse: data["reverse"]
                    })
                }
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
                    // currpile: data["currpile"]
                })
            })
        })

        socket.on("getdeckroundinfo",function(data){
            let players = data["players"];
            let ShiftUsers = []
            let index = self.state.order;

            self.setState({
                currTurn: data["currTurn"],
                Deck: data["Deck"],
                drawTurn: false,
                // UNOdec: ''
            },()=>{
                // if(self.state.Deck.length === 0){
                if(self.state.currTurn === self.state.currentUser){
                    self.handlePlayableCheck(self);
                    // self.setState({
                    //     deckDisabled: false
                    // })
                }
                // }
    
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
                    // currpile: data["currpile"]
                })
            })
        })

        socket.on("emptytrash",function(data){
            self.setState({
                Deck: data["newDeck"],
                trash: [],
                currpile: ['','',''],
                tr_index: 0
            })
        })

        socket.on("setWildColor",function(data){
            self.setState({
                currTurn: data["currTurn"],
                wildColor: data["wildColor"]
            },()=>{
                if(self.state.currTurn === self.state.currentUser){ 
                    // self.setState({
                    //     deckDisabled: false
                    // })
                    self.handlePlayableCheck(self);
                }
            })

        })

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

        socket.on("penalizeOpponent",function(data){
            // let currind = this.state.OrrUsers.indexOf(this.state.OrrUsers.find(Player => Player.username === this.state.currTurn));
            let penaltyind = self.state.OrrUsers.indexOf(self.state.OrrUsers.find(Player => Player.username === data["penaltyuser"]));
            console.log(self.state.OrrUsers[penaltyind]);
            // if(self.state.currTurn === self.state.currentUser){
                self.setState({
                    penaltyuser: data["penaltyuser"],
                },()=>{
                    setTimeout(()=>{
                        self.setState({
                            penaltyuser: ''
                        })
                    }, 3000)
                })
            // }
        })

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
                    // currpile: data["currpile"]
                })
            })
        })

        socket.on("setUNOdeclared",function(data){
            self.setState({
                UNOdec: data["UNOdec"]
            })
        })

        socket.on("setWinner",function(data){
            self.setState({
                winner: data["winner"]
            },()=>{
                socket.emit("UpdateLossCount",{user: self.state.currentUser})
            })
        })

        socket.on("PlayerLeft",function(data){
            alert("A player as left the game. Redirecting...");
            setTimeout(function(){
                window.location.assign("/");
            }, 5000);
        })
    }
    

    handleCardClick(event){
        if(this.state.currTurn !== this.state.currentUser){
            return;
        }
        if(this.state.mustDraw || this.state.winner !== ''){
            return;
        }

        const self = this;
        let cards = Array.from(document.querySelectorAll('[id^="YourCards"]'));
        // console.log(cards);
        

        if(event.target.style.border === "2.5px solid orange"){
            event.target.style.border = "2px solid black";
            self.setState({
                selDisabled: true
            })
            return;
        }

        self.setState({
            selDisabled: false
        })

        for(let j = 0; j < cards.length; j++){
            cards[j].style.border = "2px solid black";
            cards[j].style.borderRadius = '10px';
            cards[j].className = "unselected";
        }

        event.target.style.border = "2.5px solid orange";
        event.target.style.borderRadius = "10px";
        event.target.className = "selected";
    }

    handleDealCard(event){
        const socket = this.props.socket;
        let selectedcard = document.getElementsByClassName("selected")[0];
        // console.log("selected:");
        // console.log(selectedcard);
        let trashcards = document.getElementsByClassName("trashcard");
        let cards = Array.from(document.querySelectorAll('[id^="YourCards"]'));
        // console.log(selectedcard);
        let index = Array.from(cards).indexOf(selectedcard);
        let currcard = this.state.UserCards[index];
        //let wildstatus = currcard.WildStatus;
        let playerindex = this.state.OrrUsers.indexOf(this.state.OrrUsers.find(Player => Player.username === this.state.currentUser));
        let OrrUsers = this.state.OrrUsers;
        let currind = this.state.OrrUsers.indexOf(this.state.OrrUsers.find(Player => Player.username === this.state.currTurn));

        if(this.state.winner !== ''){
            return;
        }
        
        // if(this.state.trash.length > 0){
            
            let toptrashcard = this.state.trash[this.state.trash.length-1];
            if(this.state.wildColor !== ''){
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
        // }

        
        // console.log(this.state.UserCards[index]);
        let UserCards = this.state.UserCards;
        let trash = this.state.trash;
        let currpile = this.state.currpile;
        let tr_index = this.state.tr_index;
        // console.log(currpile);
        // console.log(tr_index);
    
        trash.push(this.state.UserCards[index])
        currpile[tr_index] = this.state.UserCards[index];

        // if(trashcards.length > 0){
            for(let i = 0; i < trashcards.length; i++){
                // if(trashcards[i]){
                // console.log(trashcards[i].style.zIndex);
                trashcards[i].style.zIndex = 0;
                // }
            }
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
        // }

        tr_index = tr_index + 1;

        if(tr_index === 3){
            tr_index = 0;
        }

        UserCards.splice(index, 1);
        OrrUsers[playerindex].usercards = UserCards;




        this.setState({
            OrrUsers: OrrUsers,
            // currTurn: OrrUsers[currind].username,
            wildColor: '',
            UserCards: UserCards,
            trash: trash,
            currpile: currpile,
            tr_index: tr_index,
            // UNOdec: ''
        },()=>{
            if(this.state.UserCards.length === 0){
                this.setState({
                    winner: this.state.currentUser
                },()=>{
                    socket.emit("GameOver", {winner: this.state.winner, roomtype: this.state.RoomType, roomname: this.state.RoomName})
                    socket.emit("UpdateWinCount",{user: this.state.currentUser})
                })
            }else{
                for(let j = 0; j < cards.length; j++){
                    cards[j].style.border = "2px solid black";
                    cards[j].style.borderRadius = '10px';
                    cards[j].className = "unselected";
                }
                if(currcard.WildStatus){
                    document.getElementsByClassName("cover")[0].style.display = "grid";
                    socket.emit("userplaycard",{OrrUsers: this.state.OrrUsers, roomtype: this.state.RoomType, roomname: this.state.RoomName,
                    trash: this.state.trash, currpile: this.state.currpile, tr_index: this.state.tr_index, currTurn: this.state.currTurn, 
                    reverse: this.state.reverse, mustDraw: false})
                    // if(this.state.UserCards.length === 1 && !this.state.UNOdec){
                    //     console.log("NOOOOOOOOOOOOOOOOOOOOOOO")
                    //     socket.emit("UNOfail", {roomtype: this.state.RoomType, roomname: this.state.RoomName, currTurn: this.state.currTurn, user: this.state.currentUser})
                    // }
                }else if(currcard.SkipStatus || (currcard.ReverseStatus && this.state.OrrUsers.length === 2)){
                    if(!this.state.reverse){
                        currind = currind + 2;
                    }else{
                        currind = currind - 2;
                    }
                    if(currind >= this.state.OrrUsers.length){
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
                            // this.setState({
                            //     deckDisabled: false
                            // })
                            this.handlePlayableCheck(this);
                        }
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
                }else if(currcard.ReverseStatus){
                    this.setState({
                        reverse: !this.state.reverse
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
                }else if(currcard.DrawStatus){
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
                }else{
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

    handleWildCard(color){ 
        const socket = this.props.socket;
        let currind = this.state.OrrUsers.indexOf(this.state.OrrUsers.find(Player => Player.username === this.state.currTurn));

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
            deckDisabled: true,
            selDisabled: true,
            currTurn: this.state.OrrUsers[currind].username,
            wildColor: color
        },()=>{
            document.getElementsByClassName("cover")[0].style.display = "none";
            if(this.state.UserCards.length === 1 && this.state.UNOdec === ''){
                console.log("NOOOOOOOOOOOOOOOOOOOOOOO")
                socket.emit("UNOfail", {roomtype: this.state.RoomType, roomname: this.state.RoomName, currTurn: this.state.currTurn, user: this.state.currentUser})
            }else if(this.state.UNOdec !== ''){
                this.setState({
                    UNOdec: ''
                })
            }
            if(this.state.trash[this.state.trash.length-1].DrawStatus){
                this.setState({drawTurn: true});
                socket.emit("changeWildColor", {roomtype: this.state.RoomType, roomname: this.state.RoomName, currTurn: this.state.currTurn, wildColor: this.state.wildColor, mustDraw: true})    
            }else{
                socket.emit("changeWildColor", {roomtype: this.state.RoomType, roomname: this.state.RoomName, currTurn: this.state.currTurn, wildColor: this.state.wildColor, mustDraw: false})
            }
        })
        
    }

    componentDidUpdate(){
        // this.handleCardPosition();
    }

    handleDeckCardDeal(){
        const socket = this.props.socket;

        let Deck = this.state.Deck;
        let UserCards = this.state.UserCards;
        let OrrUsers = this.state.OrrUsers;
        let playerindex = this.state.OrrUsers.indexOf(this.state.OrrUsers.find(Player => Player.username === this.state.currentUser));
        let currind = this.state.OrrUsers.indexOf(this.state.OrrUsers.find(Player => Player.username === this.state.currTurn));
        let cards = Array.from(document.querySelectorAll('[id^="YourCards"]'));

        UserCards.push(Deck[Deck.length-1]);
        Deck.splice(Deck.length-1,1);

        OrrUsers[playerindex].usercards = UserCards;

        if(!this.state.mustDraw){
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

        this.setState({
            OrrUsers: OrrUsers,
            Deck: Deck,
            UserCards: UserCards,
            UNOdec: ''
        },()=>{
            this.handlePlayableCheck(this,()=>{;
                if(!this.state.playable){
                    this.setState({
                        currTurn: OrrUsers[currind].username
                    })
                }
            })
    
            for(let j = 0; j < cards.length; j++){
                cards[j].style.border = "2px solid black";
                cards[j].style.borderRadius = '10px';
                cards[j].className = "unselected";
            }

            this.setState({
                selDisabled: true,
            },()=>{
                socket.emit("userpickdeck",{OrrUsers: this.state.OrrUsers, roomtype: this.state.RoomType, roomname: this.state.RoomName, Deck: this.state.Deck, 
                currTurn: this.state.currTurn})
            })

        })
    }

    handleDeckShuffle(){
        const socket = this.props.socket; 
        socket.emit("shufflenewdeck",{roomtype: this.state.RoomType, roomname: this.state.RoomName, 
        trash: this.state.trash})
    }

    handleDrawAmount(){
        const socket = this.props.socket;
        let currind = this.state.OrrUsers.indexOf(this.state.OrrUsers.find(Player => Player.username === this.state.currTurn));
        for(let i = 0 ; i < this.state.trash[this.state.trash.length-1].Value; i++){
            this.handleDeckCardDeal();
        }
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
            currTurn: this.state.OrrUsers[currind].username,
            selDisabled: true,
            mustDraw: false
        },()=>{
            this.setState({ deckDisabled: true})
            socket.emit("userpickdeck",{OrrUsers: this.state.OrrUsers, roomtype: this.state.RoomType, roomname: this.state.RoomName, Deck: this.state.Deck, 
            currTurn: this.state.currTurn})
        })
    }

    handlePlayableCheck(self){
        let UserCards = self.state.UserCards;
        let count = 0;
        let toptrashcard = self.state.trash[self.state.trash.length-1];
        for(let i = 0; i < self.state.UserCards.length; i++){
            let playable = true;
            let currcard = UserCards[i];
            if(this.state.wildColor !== ''){
                if((currcard.Color !== this.state.wildColor && currcard.Color !== "Black")){
                    playable = false;
                }
            }
            else if(currcard.Color !== "Black" && toptrashcard.Color !== "Black"){
                //if it's a draw card
                if(toptrashcard.DrawStatus){
                    if(currcard.DrawStatus){
                        if((currcard.Color !== toptrashcard.Color && currcard.Value !== toptrashcard.Value)){
                            playable = false;
                        }
                    }
                    else if((currcard.Color !== toptrashcard.Color)&&(currcard.DrawStatus !== toptrashcard.DrawStatus)){
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
                    if((currcard.Value !== toptrashcard.Value)&&(currcard.Color !== toptrashcard.Color)){
                        playable = false;
                    }
                    else if(currcard.DrawStatus && currcard.Color !== toptrashcard.Color){
                        playable = false;
                    }
                }
            }
            // console.log(playable);
            if(playable){
                count++;
            }
        }

        // console.log("got here");
        if(count >= 1){
            self.setState({
                deckDisabled: true,
                playable: true,
            },()=>{
                if(self.state.mustDraw){
                    self.setState({
                        deckDisabled: false
                    })
                }
            })
        }else{
            self.setState({
                deckDisabled: false,
                playable: false,
            })
        }
    }

    handleUNOPenalty(){
        const socket = this.props.socket;
        let penaltyuser = this.state.penaltyuser;
        let penaltyind = this.state.OrrUsers.indexOf(this.state.OrrUsers.find(Player => Player.username === this.state.penaltyuser));
        let penaltyUserCards = this.state.OrrUsers[penaltyind].usercards;
        let Deck = this.state.Deck;
        let OrrUsers = this.state.OrrUsers;

        penaltyUserCards.push(Deck[Deck.length-1])
        Deck.splice(Deck.length-1,1);
        penaltyUserCards.push(Deck[Deck.length-1])
        Deck.splice(Deck.length-1,1);

        OrrUsers[penaltyind].usercards = penaltyUserCards;

        this.setState({
            OrrUsers: OrrUsers,
            penaltyuser: ''
        },()=>{
            socket.emit("penalizeuser",{penaltyuser: penaltyuser, OrrUsers: this.state.OrrUsers, roomtype: this.state.RoomType, roomname: this.state.RoomName, Deck: this.state.Deck})
        })
    }

    render(){
        return(
            <div className="UNO_Game">
                {this.state.currTurn === '' ? 
                <>
                    WAITING
                    <div className="blankspace"></div>
                    <div className="blankspace"></div>
                    <div className="blankspace"></div>
                    <div className="blankspace"></div>
                </> 
                : 
                <>
                <div className="GameInfo">
                    {this.state.currTurn === this.state.currentUser ? <div className="currTurn">Your Turn!</div> : <div className="currTurn">{this.state.currTurn}'s Turn!</div>}
                    
                    {this.state.trash.length > 1 && this.state.trash[this.state.trash.length-1].ReverseStatus ? <div className="reversestatus">UNO REVERSE!</div> : <div></div>}

                    {this.state.wildColor !== "" ? <div>The color is now {this.state.wildColor}</div> : <div></div>}   

                    {this.state.trash[this.state.trash.length-1].DrawStatus 
                    && (this.state.drawTurn || this.state.mustDraw) ? <div className="drawstatus">DRAW {this.state.trash[this.state.trash.length-1].Value}!</div> : <div></div>}

                    {this.state.trash.length > 1 && this.state.trash[this.state.trash.length-1].SkipStatus ? <div className="skipstatus">TURN SKIP!</div> : <div></div>} 

                    {this.state.UNOdec !== "" ? <div className="UNOdeclared">{this.state.UNOdec} has declared UNO!</div> : <div></div>}
                  
                    {
                        this.state.penaltyuser !== '' ? <div className='UNObtnContainer'><button className="Penaltybtn" onClick={this.handleUNOPenalty}>PENALIZE</button></div> : this.state.UserCards.length === 2 && this.state.currTurn === this.state.currentUser && !this.state.mustDraw && this.state.playable? 
                        <div className='UNObtnContainer'><button className="UNObtn" onClick={()=>this.setState({UNOdec: this.state.currentUser},()=>{this.props.socket.emit("UNOdeclared",{UNOdec: this.state.UNOdec, roomtype: this.state.RoomType, roomname: this.state.RoomName})})}>UNO</button></div> 
                        :<div className='UNObtnContainer'><button className="UNObtn" disabled={true}>UNO</button> </div> 
                    
                    }
                    {this.state.winner ? 
                    <div className="winner">
                        The Winner is {this.state.winner}!
                    </div>
                    :
                    <></>
                    }
                </div>
                
                <div className={"AllPlayers"+this.state.RoomType}>
                    {this.state.AllUsers.map((Player)=>(
                        <div id={"playernext"+this.state.AllUsers.indexOf(this.state.AllUsers.find(newPlayer => newPlayer.username === Player.username))}>
                            
                            {
                                Player.username === sessionStorage.getItem("UserLogged") ? 
                                <div className="WhoCards">
                                    <button className="selectBtn" onClick={this.handleDealCard} disabled={this.state.selDisabled}>SELECT</button>
                                    {  this.state.Deck.length > 0 && this.state.mustDraw ? 
                                        <>
                                        <button className="DeckDrawBtn" onClick={this.handleDrawAmount} disabled={this.state.deckDisabled}>DRAW {this.state.trash[this.state.trash.length-1].Value} CARDS FROM DECK</button>
                                        </>
                                        :
                                        this.state.Deck.length > 0 ?
                                        <>
                                        <button className="DeckDrawBtn" onClick={this.handleDeckCardDeal} disabled={this.state.deckDisabled}>DRAW FROM DECK</button>
                                        </>
                                        :
                                        <>
                                        <button className="DeckDrawBtn" onClick={this.handleDeckShuffle} disabled={this.state.deckDisabled}>SHUFFLE NEW DECK</button>
                                        </>
                                    }
                                    <br></br>
                                    Your Cards:
                                </div>
                                :
                                <div className="WhoCards">
                                    {Player.username}'s Cards:
                                </div>
                            }
                            <div className={"playercards"} id={"cards"+this.state.AllUsers.indexOf(this.state.AllUsers.find(newPlayer => newPlayer.username === Player.username))}>
                            {Player.usercards.map((Card)=>(
                                <>
                                    {
                                        Player.username === sessionStorage.getItem("UserLogged") ? 
                                        <>
                                            <img id={"YourCards"+Player.usercards.indexOf(Card)} src={'./Cards/'+Card.Title} alt={Card.Title} onClick={this.handleCardClick} ></img>
                                        </> 
                                        : 
                                        <>  
                                            <img id={"OtherUserCards"+Player.usercards.indexOf(Card)} src={'./Cards/UNOdefault.png'} alt={'UNO Default Card'}></img>
                                        </>
                                    }

                                </>
                            ))}
                            </div>
                        </div>
                    ))}
                    {
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
                <div className='cover'> 
                    <div className="btncontainer">
                        <button className="colorbtn" id="REDbtn" onClick={()=>this.handleWildCard("Red")}>RED</button>
                        <button className="colorbtn" id="BLUEbtn" onClick={()=>this.handleWildCard("Blue")}>BLUE</button>
                        <br/><br/>
                        <button className="colorbtn" id="YELLOWbtn" onClick={()=>this.handleWildCard("Yellow")}>YELLOW</button>
                        <button className="colorbtn" id="GREENbtn" onClick={()=>this.handleWildCard("Green")}>GREEN</button>
                    </div>
                </div>
                </>
                }
           
            </div>
            
        );
        
    }
}

export default Game;
