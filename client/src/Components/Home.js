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
        <div>This da home page</div><br/>
        {
          this.state.currentUser === null ?  
          <>
            Already have an account? <a href='/Login'> Login </a><br/>
            Don't have an account? <a href='/SignUp'> Sign Up </a>
          </>
          :
          <>
            <div>Welcome {this.state.currentUser}!</div>
            <a href='/' onClick={()=>window.sessionStorage.removeItem("UserLogged")}> Sign Out </a>
          </>
        }
       
      </div>
    );
  }
}

export default Home;
