import './App.css';
import { Component } from 'react';


class SignUpForm extends Component {
    constructor(props){
        super(props);
        this.state = {
            onLogin: true,
            socket: this.props.socket
        }
        this.handleSignUpQuery = this.handleSignUpQuery.bind(this);
    }

    handleSignUpQuery(){
        const socket = this.props.socket;
        const newUser = document.getElementById("NewUsername").value;
        const newUserPass =  document.getElementById("NewPassword").value;
        const confirm =  document.getElementById("NewPasswordConfirm").value;
        if(newUserPass == confirm){
            socket.emit("RegisterUser",{username: newUser, password: newUserPass});
            socket.once("LoginSuccess",function(){
                console.log('LETS GOOO, YOU REGISTERED!');
            })
            socket.once("UserAlreadyExists",function(){
                console.log("NOOOOOOOO, THIS USER EXISTS!");
            })
        }
    }

    render(){
    return(
        <div className="SignUpForm">
            <h1>Sign Up</h1>
            <h2>
            Enter Username:<br/> <input id="NewUsername" type = "text" name = "username"/> <br/><br/>
            Enter Password:<br/> <input id="NewPassword" type = "password" name = "password"/><br/><br/>
            Confirm Password:<br/> <input id="NewPasswordConfirm" type = "password" name = "confirm"/>
            </h2>
            <input type = "submit" value = "Submit" onClick={this.handleSignUpQuery}/> 
            <br/><br/> Already have an account? <a href='/Login'> Login </a>
            {/* <br/> <a href='homepage.php'> Back To Home </a> */}
        </div>
    );
    }
}

export default SignUpForm;
