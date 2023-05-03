import { Component } from 'react';
import 'socket.io-client';

//LoginForm component: Display for the login page. This allows users to log into their account
//using their saved username and password 
class LoginForm extends Component {
    constructor(props){
        super(props);
        this.state = {
            LoginState: '',  //Message for failed login attempt
            UserLogged: window.sessionStorage.getItem("UserLogged") //The current user that is logged in
        }
        this.handleLoginQuery = this.handleLoginQuery.bind(this);   
    }

    componentDidMount(){
        if(this.state.UserLogged !== null){ //If there is already a user logged in, redirect to home page
            window.location.assign("/");
        }
        const self = this;
        const socket = this.props.socket;
        socket.on("LoginSuccess",function(data){ //Successful login, redirect to home page
            window.sessionStorage.setItem("UserLogged",data["username"]);
            window.location.assign("/");
        });
        socket.on("LoginFailure",function(){ //Uncessful login (Wrong password)
            self.setState({
                LoginState: "NOOOOOOOO WRONG PASSWORD"         
            })
        });
        socket.on("NoUser",function(){ //This user doesn't exist
             self.setState({
                LoginState: "AWW MAN THIS USER DOESN'T EXIST"
            })
        });

        const Userfield = document.getElementById("LoginUser");
        Userfield.addEventListener('keypress',function(event){ //prevent certain special characters and spaces in username
            let regex = /^[^!-,./:-@[-^`{-~]+$/;
            let key = event.key;
            if(!regex.test(key) || key === " "){
                event.preventDefault();
            }
        })
    }

    //handleLoginQuery(): Takes the input username and password and gives this information to the server for a login query
    handleLoginQuery(){
        this.setState({
            LoginState: ''
        })
        const socket = this.props.socket;
        const User = document.getElementById("LoginUser").value;
        const Password =  document.getElementById("LoginPass").value;
        socket.emit("LoginUser",{username: User, password: Password}); //LoginUser emit: sends Username and Password to the server for login verification
    }

    render(){
        return(
            <div className="LoginForm"> {/*Login form*/}
                <div className="LContainer">
                {this.state.UserLogged === null ?  
                <>               
                    <h1>Login</h1>
                    <h2>
                        Enter Username: <br/><input id="LoginUser" type = "text" name = "username"/> <br/><br/> {/*Enter username box*/}
                        Enter Password: <br/><input id="LoginPass" type = "password" name = "password"/> {/*Enter password box*/}
                    </h2>
                    <input type = "submit" value = "Login" onClick={this.handleLoginQuery}/> {/*Login button*/}
                    <br/><br/> Don't have an account? <a href='/SignUp'> Sign Up </a>
                    <br/><br/>
                    <div id="LoginState">{this.state.LoginState}</div>  
                    <a href='/'> Back Home </a> {/*Back home button*/}
                </> 
                : //Nothing shows up if the user is already logged in, the user will be redirected to the home page
                <></>
                }
                </div>
            </div>
        );
    }
}

export default LoginForm;
