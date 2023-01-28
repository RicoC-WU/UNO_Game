import { Component } from 'react';


class SignUpForm extends Component {
    constructor(props){
        super(props);
        this.state = {
            SignUpState: ""
        }
        this.handleSignUpQuery = this.handleSignUpQuery.bind(this);
    }

    componentDidMount(){
        if(window.sessionStorage.getItem("UserLogged") !== null){
            window.location.assign("/");
        }
        const self = this;
        const socket = this.props.socket;
        socket.on("LoginSuccess",function(data){
            window.sessionStorage.setItem("UserLogged",data["username"]);
            window.location.assign("/");
        })
        socket.on("UserAlreadyExists",function(){
            self.setState({
                SignUpState: "NOOOOOOOO, THIS USER EXISTS!"
            })
        })

        socket.on("UsernameTooShort",function(data){
            self.setState({
                SignUpState:  self.state.SignUpState + "Please enter a username that is at least 5 characters"
            })
        })

        socket.on("PasswordTooShort",function(data){
            self.setState({
                SignUpState: self.state.SignUpState + "Please enter a password that is at least 8 characters"
            })
        })

        socket.on("DetailsTooShort",function(data){
            self.setState({
                SignUpState: "Please enter a username that is at least 5 characters and password that is at least 8 characters"
            })
        })

        const SignUpField = document.getElementById("NewUsername");
        SignUpField.addEventListener('keypress',function(event){
            let regex = /^[^!-,./:-@[-^`{-~]+$/;
            let key = event.key;
            if(!regex.test(key) || key === " "){
                event.preventDefault();
            }   
        })
    }

    handleSignUpQuery(){
        this.setState({
            SignUpState: ''
        })
        var self = this;
        const socket = this.props.socket;
        const newUser = document.getElementById("NewUsername").value;
        const newUserPass =  document.getElementById("NewPassword").value;
        const confirm =  document.getElementById("NewPasswordConfirm").value;
        let regex = /^(?=.*[a-zA-Z].*[a-zA-Z].*[a-zA-Z]).*$/;
        if(!regex.test(newUser)){
            self.setState({
                SignUpState: "Please have at least 3 letters in your username"
            })
            return;
        }
        if(newUserPass === confirm){
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
                    Enter Username:<br/> <input id="NewUsername" type = "text" name = "username"/> <br/><br/>
                    Enter Password:<br/> <input id="NewPassword" type = "password" name = "password"/><br/><br/>
                    Confirm Password:<br/> <input id="NewPasswordConfirm" type = "password" name = "confirm"/>
                    </h2>
                    <input type = "submit" value = "Submit" onClick={this.handleSignUpQuery}/> 
                    <br/><br/> Already have an account? <a href='/Login'> Login </a>
                    <br/><br/>
                    <div id="SignUpState">{this.state.SignUpState}</div>
                    <a href='/'> Back Home </a>
                </>
                :
                <></>
                }
                </div>
            </div>
        );
    }
}

export default SignUpForm;
