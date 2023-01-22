import { Component } from 'react';
import 'socket.io-client';

class Home extends Component {
  constructor(props){
    super(props);
    this.state = {
      currentUser: window.sessionStorage.getItem("UserLogged")
    }
  }

  componentDidMount(){
    window.sessionStorage.removeItem("joining");
    const socket = this.props.socket;
    socket.on("AlreadyInRoom",function(){
      alert("You are already in another game session.")
    })
    socket.on("ReadyPlayer",function(data){
      window.sessionStorage.setItem("joining",data["roomtype"]);
      window.location.assign('/Game');
    })
  }

  render(){
    return(
      <div className="Home">
        <img src="UNObackground.png" id='bckgr' alt='bckgr'/>
        <img src="UNObackground.png" id='bckgr2' alt='bckgr2'/>
        <img src="UNObackground.png" id='bckgr3' alt='bckgr3'/>
        {/* <img src="UNObackground.png" id='bckgr4' alt='bckgr4'/> */}
        {/* <img src="UNObackground.png" id='bckgr5' alt='bckgr5'/> */}
        <div className="HomeContent">
          {
            this.state.currentUser === null ?  
            <>
              <div id="Login_btn_prnt"><a href="/Login"><button id="Login_btn">LOGIN TO PLAY UNO!</button></a></div>
              <div id="SignUp_btn_prnt"><a href="/SignUp"><button id="SignUp_btn">Don't Have An Account? SIGN UP HERE!</button></a></div>
            </>
            :
            <>
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
