// import logo from './logo.svg';
import './App.css'
import { Component } from 'react';
import Nav from './Components/Nav';
import LoginForm from './Components/Login';
import Home from './Components/Home';
import SignUpForm from './Components/SignUp';
import Game from './Components/Game';
import About from './Components/About';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';

class App extends Component {
  componentDidMount(){
  }
  render(){
    return(
      <Router>
      <div className="App">
        <Nav/>
        <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/About" element={<About/>}/>
            <Route path="/Login" element={<LoginForm socket={this.props.socket}/>}/>
            <Route path="/SignUp" element={<SignUpForm socket={this.props.socket}/>}/>
            <Route path="/Game" element={<Game socket={this.props.socket}/>}/>
        </Routes>    
      </div>
      </Router>
    );
  }
}

export default App;
