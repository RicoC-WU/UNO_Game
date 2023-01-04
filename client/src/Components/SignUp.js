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
        var self = this;
        const socket = this.props.socket;
        socket.on("LoginSuccess",function(data){
            console.log('LETS GOOO, YOU REGISTERED!');
            window.sessionStorage.setItem("UserLogged",data["username"]);
            window.location.assign("/");
        })
        socket.on("UserAlreadyExists",function(){
            console.log("NOOOOOOOO, THIS USER EXISTS!");
            self.setState({
                SignUpState: "NOOOOOOOO, THIS USER EXISTS!"
            })
        })
    }

    handleSignUpQuery(){
        var self = this;
        const socket = this.props.socket;
        const newUser = document.getElementById("NewUsername").value;
        const newUserPass =  document.getElementById("NewPassword").value;
        const confirm =  document.getElementById("NewPasswordConfirm").value;
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
                    {/* <br/> <a href='homepage.php'> Back To Home </a> */}
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
