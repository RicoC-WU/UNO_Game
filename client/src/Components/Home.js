import { Component } from 'react';
import 'socket.io-client';

//Home component: Home page of the website
class Home extends Component {
  constructor(props){
    super(props);
    this.state = {
      currentUser: window.sessionStorage.getItem("UserLogged") //current logged in user
    }
  }

  componentDidMount(){
    window.sessionStorage.removeItem("joining"); //tells the website that we are on the homepage and not in a game
    const socket = this.props.socket;
    socket.on("AlreadyInRoom",function(){ //User is already in another game 
      alert("You are already in another game session.")
    })
    socket.on("ReadyPlayer",function(data){ //Joins user a room
      window.sessionStorage.setItem("joining",data["roomtype"]);
      window.location.assign('/Game');
    })
  }

  render(){
    return(
      <div className="Home">
        <img src="UNObackground.png" id='bckgr' alt='bckgr'/>
        <img src="UNObackground.png" id='bckgr2' alt='bckgr2'/> {/*Background of home page*/}
        <img src="UNObackground.png" id='bckgr3' alt='bckgr3'/>
        <div className="HomeContent">
          {
            this.state.currentUser === null ?  //checks if a user is logged in
            <>
              <div id="Login_btn_prnt"><a href="/Login"><button id="Login_btn">LOGIN TO PLAY UNO!</button></a></div> {/*Login button*/}
              <div id="SignUp_btn_prnt"><a href="/SignUp"><button id="SignUp_btn">Don't Have An Account? SIGN UP HERE!</button></a></div> {/*SignUp button*/}
            </>
            :
            <>
            {/*Play buttons for joining a 2 player, 3 player, or 4 player game*/}
            {/*Pressing each button performs a socket emit to check if the player is already in a game.*/}
            <div className="btn_prnt" id="2Player"><button className="play_btn" onClick={()=>this.props.socket.emit("checkInGame",{username: this.state.currentUser, roomtype: "2Player"})}>PLAY 2-PLAYER GAME</button></div>
            <div className="btn_prnt" id="3Player"><button className="play_btn" onClick={()=>this.props.socket.emit("checkInGame",{username: this.state.currentUser, roomtype: "3Player"})}>PLAY 3-PLAYER GAME</button></div>
            <div className="btn_prnt" id="4Player"><button className="play_btn" onClick={()=>this.props.socket.emit("checkInGame",{username: this.state.currentUser, roomtype: "4Player"})}>PLAY 4-PLAYER GAME</button></div>
            </>
          }
        </div>
      </div>
    );
  }
}

export default Home;
