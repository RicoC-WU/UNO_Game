import { Component } from 'react';
// import LoginForm from './Login';
// import SignUpForm from './SignUp';

class Home extends Component {
  constructor(props){
    super(props);
    this.state = {
      currentUser: window.sessionStorage.getItem("UserLogged")
    }
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
              {/* Already have an account? <a href='/Login'> Login </a><br/> */}
              <div id="Login_btn_prnt"><a href="/Login"><button id="Login_btn">LOGIN TO PLAY UNO!</button></a></div>
              {/* Don't have an account? <a href='/SignUp'> Sign Up </a><br/> */}
              <div id="SignUp_btn_prnt"><a href="/SignUp"><button id="SignUp_btn">Don't Have An Account? SIGN UP HERE!</button></a></div>
            </>
            :
            <>
            </>
          }
        </div>
      </div>
    );
  }
}

export default Home;
