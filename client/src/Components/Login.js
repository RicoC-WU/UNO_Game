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
        var self = this;
        const socket = this.props.socket;
        socket.on("LoginSuccess",function(data){
            console.log('WE LOGGED IN!');
            window.sessionStorage.setItem("UserLogged",data["username"]);
            window.location.assign("/");
        });
        socket.on("LoginFailure",function(){
            console.log("NOOOOOOOO WRONG PASSWORD");
            self.setState({
                LoginState: "NOOOOOOOO WRONG PASSWORD"         
            })
        });
        socket.on("NoUser",function(){
            console.log("AWW MAN THIS USER DOESN'T EXIST");
             self.setState({
                LoginState: "AWW MAN THIS USER DOESN'T EXIST"
            })
        });
    }

    handleLoginQuery(){
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
