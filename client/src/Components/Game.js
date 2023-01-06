import { Component } from 'react';
import 'socket.io-client';


class Game extends Component {
    constructor(props){
        super(props);
        this.state = {
            currentUser: window.sessionStorage.getItem("UserLogged"),
            joinGame: window.sessionStorage.getItem("joining"),
            AllUsers: [],
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
        socket.on("startGame",function(data){
            self.setState({
                AllUsers: data["players"],
                currTurn: data["players"][0]
            }, ()=>{
                console.log(self.state.AllUsers);
            })
            
        })

    }

    render(){
        return(
            <div className="UNO_Game">
                {
                    this.state.currTurn === '' ? <>WAITING</> : <></>
                }
            </div>
        );
    }
}

export default Game;
