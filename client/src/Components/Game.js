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
            currTurn: '',
            order: 0
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
            let AllUsers = data["players"];
            console.log(AllUsers);
            let ShiftUsers = []
            let index = AllUsers.indexOf(AllUsers.find(Player => Player.username === window.sessionStorage.getItem("UserLogged")));
            console.log(index);
            self.setState({
                // AllUsers: data["players"],
                // currTurn: data["players"][0],
                Deck: data["cards"],
                RoomName: data["RoomName"],
                order: index
            }, ()=>{
                // console.log("here");
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
                console.log(ShiftUsers);
                self.setState({
                    AllUsers: ShiftUsers,
                    currTurn: data["players"][0]
                })
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
                    {/* {JSON.stringify(this.state.UserCards)} */}
                    {/* <div className="playercards">
                    {this.state.UserCards.map((Card)=>(
                        <img src={'./Cards/'+Card.Title} alt={Card.Title}></img>
                    ))} */}

                    
                        <div className="AllPlayers">
                            
                            {this.state.AllUsers.map((Player)=>(
                                <div>
                                    {
                                        Player.username === sessionStorage.getItem("UserLogged") ? 
                                        <>
                                            Your Cards:
                                        </>
                                        :
                                        <>
                                            {Player.username}'s Cards:
                                        </>
                                    }
                                    <div className="playercards">
                                    {Player.usercards.map((Card)=>(
                                        <>
                                        
                                            {
                                                Player.username === sessionStorage.getItem("UserLogged") ? 
                                                <>
                                                    <img src={'./Cards/'+Card.Title} alt={Card.Title}></img>
                                                </> 
                                                : 
                                                <> 
                                                    
                                                    <img src={'./Cards/UNOdefault.png'} alt={'UNO Default Card'}></img>
                                                </>
                                            }

                                        </>
                                    ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
                }
            </div>
        );
    }
}

export default Game;
