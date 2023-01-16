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
            tr_index: 0
        }
        this.handleCardClick = this.handleCardClick.bind(this);
        this.handleDealCard = this.handleDealCard.bind(this);
        // this.handleCardPosition = this.handleCardPosition.bind(this);
        this.handleDeckCardDeal = this.handleDeckCardDeal.bind(this);
        this.handleDeckShuffle = this.handleDeckShuffle.bind(this);

    }
    

    componentDidMount(){
        const self = this;
        const socket = this.props.socket;
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
            // console.log(index);
            self.setState({
                // AllUsers: data["players"],
                // currTurn: data["players"][0],
                Deck: data["cards"],
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
                    currTurn: AllUsers[0].username
                },()=>{
                    if(self.state.currTurn === self.state.currentUser){
                        self.setState({
                            deckDisabled: false
                        })
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

            console.log(tr_index);
            
            // console.log(AllUsers);
            for(let i = 0; i < trashcards.length; i++){
                
                trashcards[i].style.zIndex = 0;
            }

            if(trashcards.length === 3){
                if(tr_index == 1){
                    trashcards[2].style.zIndex = 1;
                }
                if(tr_index == 2){
                    trashcards[0].style.zIndex = 1;
                }
                if(tr_index == 0){
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
                currTurn: data["currTurn"]
            }, ()=>{
                if(self.state.currTurn === self.state.currentUser){
                    self.setState({
                        deckDisabled: false
                    })
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
                Deck: data["Deck"]
            },()=>{
                // if(self.state.Deck.length === 0){
                if(self.state.currTurn === self.state.currentUser){
                    self.setState({
                        deckDisabled: false
                    })
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
    }
    

    handleCardClick(event){
        if(this.state.currTurn !== this.state.currentUser){
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
        
        if(this.state.trash.length > 0){
            let currcard = this.state.UserCards[index];
            let toptrashcard = this.state.trash[this.state.trash.length-1];
            if(currcard.Color !== "Black" && toptrashcard.Color !== "Black"){
                //if it's a draw card
                if(toptrashcard.DrawStatus){
                    if(currcard.DrawStatus && (currcard.Value !== toptrashcard.Value)){
                        return;
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
                    }
                }
            }
        }

        let playerindex = this.state.OrrUsers.indexOf(this.state.OrrUsers.find(Player => Player.username === this.state.currentUser));
        let OrrUsers = this.state.OrrUsers;
        
        // console.log(this.state.UserCards[index]);
        let UserCards = this.state.UserCards;
        let trash = this.state.trash;
        let currpile = this.state.currpile;
        let tr_index = this.state.tr_index;

        let currind = this.state.OrrUsers.indexOf(this.state.OrrUsers.find(Player => Player.username === this.state.currTurn));
        
        currind = currind + 1;
        if(currind === this.state.OrrUsers.length){
            currind = 0;
        }

        // console.log(currpile);
        // console.log(tr_index);
    
        trash.push(this.state.UserCards[index])
        currpile[tr_index] = this.state.UserCards[index];

        // if(trashcards.length > 0){
            for(let i = 0; i < trashcards.length; i++){
                // if(trashcards[i]){
                console.log(trashcards[i].style.zIndex);
                trashcards[i].style.zIndex = 0;
                // }
            }
            if(trashcards.length === 3){
                if(trashcards[tr_index]){
                    trashcards[tr_index].style.zIndex = 2;
                }
                if(tr_index == 0){
                    if(trashcards[2]){
                        trashcards[2].style.zIndex = 1;
                    }
                }
                if(tr_index == 1){
                    if(trashcards[0]){
                        trashcards[0].style.zIndex = 1;
                    }
                }
                if(tr_index == 2){
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
        
        // console.log("nigaaaa")
        UserCards.splice(index, 1);
        OrrUsers[playerindex].usercards = UserCards;
        // console.log(this.state.AllUsers);
        // console.log(this.state.OrrUsers);
        this.setState({
            OrrUsers: OrrUsers,
            currTurn: OrrUsers[currind].username,
            UserCards: UserCards,
            trash: trash,
            currpile: currpile,
            tr_index: tr_index
        },()=>{
            for(let j = 0; j < cards.length; j++){
                cards[j].style.border = "2px solid black";
                cards[j].style.borderRadius = '10px';
                cards[j].className = "unselected";
            }
            this.setState({
                selDisabled: true,
                deckDisabled: true
            })
            socket.emit("userplaycard",{OrrUsers: this.state.OrrUsers, roomtype: this.state.RoomType, roomname: this.state.RoomName, /*Deck: this.state.Deck,*/ 
            trash: this.state.trash, currpile: this.state.currpile, tr_index: this.state.tr_index, currTurn: this.state.currTurn})
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

        currind = currind + 1;
        if(currind === this.state.OrrUsers.length){
            currind = 0;
        }

        this.setState({
            OrrUsers: OrrUsers,
            Deck: Deck,
            currTurn: OrrUsers[currind].username,
            UserCards: UserCards
        },()=>{

            for(let j = 0; j < cards.length; j++){
                cards[j].style.border = "2px solid black";
                cards[j].style.borderRadius = '10px';
                cards[j].className = "unselected";
            }
            this.setState({
                selDisabled: true,
                deckDisabled: true
            })

            socket.emit("userpickdeck",{OrrUsers: this.state.OrrUsers, roomtype: this.state.RoomType, roomname: this.state.RoomName, Deck: this.state.Deck, 
            currTurn: this.state.currTurn})

        })
    }

    handleDeckShuffle(){
        const socket = this.props.socket; 
        // let playerindex = this.state.OrrUsers.indexOf(this.state.OrrUsers.find(Player => Player.username === this.state.currentUser));
        // let currind = this.state.OrrUsers.indexOf(this.state.OrrUsers.find(Player => Player.username === this.state.currTurn));

        socket.emit("shufflenewdeck",{roomtype: this.state.RoomType, roomname: this.state.RoomName, 
        trash: this.state.trash})
        
    }

    render(){
        return(
            <div className="UNO_Game">
                {this.state.currTurn === '' ? 
                <>
                    WAITING
                </> 
                : 
                <>
                {/* <div> */}
                    {/* {JSON.stringify(this.state.UserCards)} */}
                    {/* <div className="playercards">
                    {this.state.UserCards.map((Card)=>(
                        <img src={'./Cards/'+Card.Title} alt={Card.Title}></img>
                    ))} */}
                    <div className={"AllPlayers"+this.state.RoomType}>
                        {this.state.AllUsers.map((Player)=>(
                            <div id={"playernext"+this.state.AllUsers.indexOf(this.state.AllUsers.find(newPlayer => newPlayer.username === Player.username))}>
                                
                                {
                                    Player.username === sessionStorage.getItem("UserLogged") ? 
                                    <div className="WhoCards">
                                        <button className="selectBtn" onClick={this.handleDealCard} disabled={this.state.selDisabled}>SELECT</button>
                                        {this.state.Deck.length > 0 ? 
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
                        <div className="Deck">
                            Top Deck Card:
                            {
                                this.state.Deck.length > 0 ? 
                                <>
                                    <img className="DeckCard" src={'./Cards/'+this.state.Deck[this.state.Deck.length-1].Title} alt={'UNO Deck Card'}></img>
                                </>
                                :
                                <>
                                </>
                            }
                            
                        </div>
                    </div> 
                {/* </div> */}
                </>
                }
           
            </div>
            
        );
        
    }
}

export default Game;
