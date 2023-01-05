import { Component } from 'react';

class Nav extends Component {
  constructor(props){
    super(props);
    this.state = {
      currentUser: window.sessionStorage.getItem("UserLogged")
    }
  }

  componentDidMount(){
    console.log(!document.URL.includes("/Login"));
  }

  render(){
    return(
      <div className='Nav'>
        <img src='UNO_Logo.png' id='Logo' alt='Logo' height='100'/>
        <div className="interact">
          {
            (this.state.currentUser === null) && (!document.URL.includes("/Login")) && (!document.URL.includes("/SignUp")) ?  
            <>
              <div className="iconContainer"><a href='/Login'><i className="fa-solid fa-user"></i><span>Login</span></a></div>
              <div id='SignInIcon' className="iconContainer"><a href='/SignUp'><i className="fa-solid fa-right-to-bracket"></i><span>Sign Up</span></a></div>
            </> 
            : 
            (this.state.currentUser !== null) ?
            <>
            <div id='welcomeuser'>Hello, {this.state.currentUser}!</div>
            <div id='SignOutIcon' className="iconContainer"><a href='/' onClick={()=>window.sessionStorage.removeItem("UserLogged")}><i className="fa-solid fa-arrow-right-from-bracket"></i><span>Sign Out</span></a></div>
            </>
            :
            <></>
          }
          <div className="iconContainer"><a href='/'><i className="fa-solid fa-house"></i><span>Home</span></a></div>
          <div className="iconContainer"><a href='/About'><i className="fa-solid fa-circle-info"></i><span>About</span></a></div>
        </div>
      </div>
    );
  }
}

export default Nav;
