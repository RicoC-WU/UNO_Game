import './App.css';
import { Component } from 'react';
import 'socket.io-client';

class LoginForm extends Component {
    constructor(props){
        super(props);
        this.state = {
        }
        this.handleLoginQuery = this.handleLoginQuery.bind(this);
        
    }

    componentDidMount(){
        const socket = this.props.socket;
        socket.on("LoginSuccess",function(){
            console.log('WE LOGGED IN!');
        });
        socket.on("LoginFailure",function(){
            console.log("NOOOOOOOO WRONG PASSWORD");
        });
        socket.on("NoUser",function(){
            console.log("AWW MAN THIS USER DOESN'T EXIST");
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
                <h1>Login</h1>
                <h2>
                    Enter Username: <br/><input id="LoginUser" type = "text" name = "username"/> <br/><br/>
                    Enter Password: <br/><input id="LoginPass" type = "password" name = "password"/>
                </h2>
                <input type = "submit" value = "Login" onClick={this.handleLoginQuery}/> 
                <br/><br/> Don't have an account? <a href='/SignUp'> Sign Up </a>
                <br/> 
            </div>
        );
    }
}

export default LoginForm;
