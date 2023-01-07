import { Component } from 'react';
import 'socket.io-client';

class Game extends Component {
    constructor(props){
        super(props);
        this.state = {
            currentUser: window.sessionStorage.getItem("UserLogged"),
            joinGame: window.sessionStorage.getItem("joining"),
            RoomName: '',
            AllUsers: [],
            Deck: [],
            UserCards: [],
            currTurn: ''
        }
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
            self.setState({
                AllUsers: data["players"],
                currTurn: data["players"][0],
                Deck: data["cards"],
                RoomName: data["RoomName"]
            }, ()=>{
                // console.log("here");
                console.log("Deck:")
                console.log(self.state.Deck);
            })            
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
                <div>
                    Your cards:
                    {/* {JSON.stringify(this.state.UserCards)} */}
                    {this.state.UserCards.map((Card)=>(
                        <img src={'./Cards/'+Card.Title} alt={Card.Title}></img>
                    ))}
                </div></>
                }
            </div>
        );
    }
}

export default Game;
