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
            disabled: true,
            currpile: ['','',''],
            tr_index: 0
        }
        this.handleCardClick = this.handleCardClick.bind(this);
        this.handleDealCard = this.handleDealCard.bind(this);
        // this.handleCardPosition = this.handleCardPosition.bind(this);
        this.handleDeckCardDeal = this.handleDeckCardDeal.bind(this);

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
                })
            })            
        }) 
        socket.on("getroundinfo",function(data){
            let ShiftUsers = [];
            let players = data["players"];
            let index = self.state.order;
            let trashcards = document.getElementsByClassName("trashcard");
            let tr_index = data["tr_index"]
            
            // console.log(AllUsers);
            if(trashcards.length > 0){
                for(let i = 0; i < 3; i++){
                    if(trashcards[i]){
                        trashcards[i].style.zIndex = 0;
                    }
                }
                // console.log("Z index:");
                // console.log(trashcards[0].style.zIndex);
                // console.log(trashcards[1].style.zIndex);
                // console.log(trashcards[2].style.zIndex);
                let tr_index2 = tr_index - 1;
                if(tr_index2 >= 0 && trashcards[tr_index2]){
                    trashcards[tr_index2].style.zIndex = 1;
                }else if(trashcards[2]){
                    trashcards[2].style.zIndex = 1;
                }
            }

            self.setState({
                Deck: data["Deck"],
                trash: data["trash"],
                // currpile: data["currpile"],
                tr_index: data["tr_index"],
                currTurn: data["currTurn"]
            }, ()=>{
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
                    currpile: data["currpile"]
                })
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
                disabled: true
            })
            return;
        }

        self.setState({
            disabled: false
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

        if(trashcards.length > 0){
            for(let i = 0; i < 3; i++){
                if(trashcards[i]){
                    trashcards[i].style.zIndex = 0;
                }
            }
            // console.log("Z index:");
            // console.log(trashcards[0].style.zIndex);
            // console.log(trashcards[1].style.zIndex);
            // console.log(trashcards[2].style.zIndex);
            if(trashcards[tr_index]){
                trashcards[tr_index].style.zIndex = 1;
            }
        }

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
                disabled: true
            })
            socket.emit("showothers",{OrrUsers: this.state.OrrUsers, roomtype: this.state.RoomType, roomname: this.state.RoomName, Deck: this.state.Deck, 
            trash: this.state.trash, currpile: this.state.currpile, tr_index: this.state.tr_index, currTurn: this.state.currTurn})
        })

    }

    componentDidUpdate(){
        // this.handleCardPosition();
    }

    // handleCardPosition(){
    //     var cards = document.getElementsByClassName('YourCards');
    //     var j = -Math.round(cards.length/2);

    

    //     for (let i = 0; i < cards.length; i++) {
    //         cards[i].style.position = 'absolute';
    //         cards[i].style.top = `${j * 10}px`;
    //         cards[i].style.left = `${j * 10}px`;
    //         cards[i].style.zIndex = i;
    //         cards[i].style.transform = `rotate(${j * 10}deg)`;
    //         j++;
    //     }

    //     var cards2 = document.getElementsByClassName('OtherUserCards');

    //     for (let i = 0; i < cards.length; i++) {
    //         cards2[i].style.position = 'absolute';
    //         cards2[i].style.top = `${i * 10}px`;
    //         cards2[i].style.left = `${i * 10}px`;
    //         cards2[i].style.zIndex = i;
    //         cards2[i].style.transform = `rotate(${i * 5}deg)`;
    //     }
    // }

    handleDeckCardDeal(){

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
                                        <button className="selectBtn" onClick={this.handleDealCard} disabled={this.state.disabled}>SELECT</button>
                                        <button className="DeckDrawBtn">DRAW FROM DECK</button>
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
                            <img className="DeckCard" src={'./Cards/'+this.state.Deck[this.state.Deck.length-1].Title} alt={'UNO Deck Card'}></img>
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
