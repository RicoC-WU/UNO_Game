import { Component } from 'react';
import 'socket.io-client';

//SignUpForm Component: Display for the Sign Up page. This allows users to create a new account. 
//Users will make their own username and a new password using this form.
class SignUpForm extends Component {
    constructor(props){
        super(props);
        this.state = {
            SignUpState: ""
        }
        this.handleSignUpQuery = this.handleSignUpQuery.bind(this);
    }

    componentDidMount(){
        if(window.sessionStorage.getItem("UserLogged") !== null){ //a user is already logged in --> redirect to home page
            window.location.assign("/");
        }
        const self = this;
        const socket = this.props.socket;
        socket.on("LoginSuccess",function(data){ //Successful sign up, automatically logs in the user
            window.sessionStorage.setItem("UserLogged",data["username"]);
            window.location.assign("/");
        })
        socket.on("UserAlreadyExists",function(){ //The user already exists, must make a new username
            self.setState({
                SignUpState: "NOOOOOOOO, THIS USER EXISTS!"
            })
        })

        socket.on("UsernameTooShort",function(data){ //The username is too short
            self.setState({
                SignUpState:  self.state.SignUpState + "Please enter a username that is at least 5 characters"
            })
        })

        socket.on("PasswordTooShort",function(data){ //The password is too short
            self.setState({
                SignUpState: self.state.SignUpState + "Please enter a password that is at least 8 characters"
            })
        })

        socket.on("DetailsTooShort",function(data){ //Both username & password is too short
            self.setState({
                SignUpState: "Please enter a username that is at least 5 characters and password that is at least 8 characters"
            })
        })

        const SignUpField = document.getElementById("NewUsername"); //Get the new username
        SignUpField.addEventListener('keypress',function(event){ //prevent spaces and special characters in the username
            let regex = /^[^!-,./:-@[-^`{-~]+$/;
            let key = event.key;
            if(!regex.test(key) || key === " "){
                event.preventDefault();
            }   
        })
    }

    //handleSignUpQuery(): Checks the username and password that the new user has input to see if they fit username and password criteria.
    handleSignUpQuery(){
        this.setState({
            SignUpState: ''
        })
        var self = this;
        const socket = this.props.socket;
        const newUser = document.getElementById("NewUsername").value; //Username
        const newUserPass =  document.getElementById("NewPassword").value; //Password
        const confirm =  document.getElementById("NewPasswordConfirm").value; //Confirm Password
        let regex = /^(?=.*[a-zA-Z].*[a-zA-Z].*[a-zA-Z]).*$/;
        if(!regex.test(newUser)){ //makes sure that there are at least 3 letter characters in the username
            self.setState({
                SignUpState: "Please have at least 3 letters in your username"
            })
            return;
        }
        if(newUserPass === confirm){ //Check if Password matches Confirm Password
            socket.emit("RegisterUser",{username: newUser, password: newUserPass});
        }else{
            self.setState({
                SignUpState: "THE CONFIRM DOESN'T MATCH YOUR PASSWORD!"
            })
        }
    }

    render(){
        return(
            <div className="SignUpForm">
                <div className='SContainer'>
                {window.sessionStorage.getItem("UserLogged") === null ?  
                <>
                    <h1>Sign Up</h1>
                    <h2>
                    Enter Username:<br/> <input id="NewUsername" type = "text" name = "username"/> <br/><br/> {/*Sign Up with new username*/}
                    Enter Password:<br/> <input id="NewPassword" type = "password" name = "password"/><br/><br/> {/*Sign Up with new password*/}
                    Confirm Password:<br/> <input id="NewPasswordConfirm" type = "password" name = "confirm"/> {/*confirm password*/}
                    </h2>
                    <input type = "submit" value = "Submit" onClick={this.handleSignUpQuery}/> 
                    <br/><br/> Already have an account? <a href='/Login'> Login </a> {/*Go to login if already have an account*/}
                    <br/><br/>
                    <div id="SignUpState">{this.state.SignUpState}</div>
                    <a href='/'> Back Home </a> {/*Back to Home Page*/}
                </>
                : //Nothing shows up if the user is already logged in, the user will be redirected to the home page
                <></>
                }
                </div>
            </div>
        );
    }
}

export default SignUpForm;
