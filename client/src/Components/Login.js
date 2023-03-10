import { Component } from 'react';
import 'socket.io-client';

class LoginForm extends Component {
    constructor(props){
        super(props);
        this.state = {
            LoginState: '',
            UserLogged: window.sessionStorage.getItem("UserLogged")
        }
        this.handleLoginQuery = this.handleLoginQuery.bind(this);
        
    }

    componentDidMount(){
        if(this.state.UserLogged !== null){
            window.location.assign("/");
        }
        const self = this;
        const socket = this.props.socket;
        socket.on("LoginSuccess",function(data){
            window.sessionStorage.setItem("UserLogged",data["username"]);
            window.location.assign("/");
        });
        socket.on("LoginFailure",function(){
            self.setState({
                LoginState: "NOOOOOOOO WRONG PASSWORD"         
            })
        });
        socket.on("NoUser",function(){
             self.setState({
                LoginState: "AWW MAN THIS USER DOESN'T EXIST"
            })
        });

        const Userfield = document.getElementById("LoginUser");
        Userfield.addEventListener('keypress',function(event){
            let regex = /^[^!-,./:-@[-^`{-~]+$/;
            let key = event.key;
            if(!regex.test(key) || key === " "){
                event.preventDefault();
            }
        })
    }

    handleLoginQuery(){
        this.setState({
            LoginState: ''
        })
        const socket = this.props.socket;
        const User = document.getElementById("LoginUser").value;
        const Password =  document.getElementById("LoginPass").value;
        socket.emit("LoginUser",{username: User, password: Password});
    }

    render(){
        return(
            <div className="LoginForm">
                <div className="LContainer">
                {this.state.UserLogged === null ?  
                <>               
                    <h1>Login</h1>
                    <h2>
                        Enter Username: <br/><input id="LoginUser" type = "text" name = "username"/> <br/><br/>
                        Enter Password: <br/><input id="LoginPass" type = "password" name = "password"/>
                    </h2>
                    <input type = "submit" value = "Login" onClick={this.handleLoginQuery}/> 
                    <br/><br/> Don't have an account? <a href='/SignUp'> Sign Up </a>
                    <br/><br/>
                    <div id="LoginState">{this.state.LoginState}</div>  
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

export default LoginForm;
