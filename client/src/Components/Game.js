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
            disabled: true
        }
        this.handleCardClick = this.handleCardClick.bind(this);
        this.handleDealCard = this.handleDealCard.bind(this);

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
                    currTurn: data["players"][0]
                })
            })            
        }) 
        let selectBtn = document.getElementsByClassName("selectBtn")[0];
        console.log(selectBtn); 
    }

    handleCardClick(event){
        const self = this;
        let selectBtn = document.getElementsByClassName("selectBtn")[0];
        let cards = document.getElementsByClassName("YourCards");

        if(event.target.style.border === "thick solid orange"){
            event.target.style.border = "none";
            // selectBtn.style.display = "none";
            self.setState({
                disabled: true
            })
            return;
        }

        // selectBtn.style.display = "block";
        self.setState({
            disabled: false
        })

        for(let j = 0; j < cards.length; j++){
            cards[j].style.border = "none";
            cards[j].classList.remove("selected");
        }

        event.target.style.border = "thick solid orange";
        event.target.style.borderRadius = "10px";
        event.target.classList.add("selected");
    }

    handleDealCard(event){
        const self = this;
        const socket = this.props.socket;
        let selectedcard = document.getElementsByClassName("selected")[0];
        let cards = document.getElementsByClassName("YourCards");
        // console.log(selectedcard);
        let index = Array.from(cards).indexOf(selectedcard);
        // console.log(this.state.UserCards[index]);
        let UserCards = this.state.UserCards;
        let trash = this.state.trash;
        trash.push(this.state.UserCards[index])
        UserCards.splice(index, 1);
        selectedcard.remove();
        this.setState({
            UserCards: UserCards,
            trash: trash,
            disabled: true
        },()=>{
            console.log(this.state.UserCards);
            console.log(this.state.trash);
        })

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
                                                <img className="YourCards" src={'./Cards/'+Card.Title} alt={Card.Title} onClick={this.handleCardClick} ></img>
                                            </> 
                                            : 
                                            <>  
                                                <img className="OtherUserCards" src={'./Cards/UNOdefault.png'} alt={'UNO Default Card'}></img>
                                            </>
                                        }

                                    </>
                                ))}
                                </div>
                            </div>
                        ))}
                        <button className="selectBtn" onClick={this.handleDealCard} disabled={this.state.disabled}>SELECT</button>
                        {
                        <>
                        {this.state.RoomType == 2 ?
                        <>
                        <div className="blankspace"></div>
                        <div className="blankspace"></div>
                        </>
                        :
                        this.state.RoomType == 3 ?
                        <>
                        <div className="blankspace"></div>
                        </>
                        :
                        <>
                        </>
                        }
                        </>
                        }
                        
                    </div> 
                {/* </div> */}
                </>
                }
            </div>
        );
    }
}

export default Game;
