import './App.css'
import { Component } from 'react';
import Nav from './Components/Nav';
import LoginForm from './Components/Login';
import Home from './Components/Home';
import SignUpForm from './Components/SignUp';
import Game from './Components/Game';
import About from './Components/About';
import Footer from './Components/Footer';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';

//App component: governs the entire website and renders a specific component based on the page
//each component gets the socket from the index.js as a prop.
class App extends Component {
  render(){
    return(
      <Router>
      <div className="App">
        <Nav/> {/*Navigation menu*/}
        <Routes>
            <Route path="/" element={<Home socket={this.props.socket}/>}/> {/*Home page*/}
            <Route path="/About" element={<About/>}/>  {/*About page*/}
            <Route path="/Login" element={<LoginForm socket={this.props.socket}/>}/>  {/*LogIn page*/}
            <Route path="/SignUp" element={<SignUpForm socket={this.props.socket}/>}/>  {/*SignUp page*/}
            <Route path="/Game" element={<Game socket={this.props.socket}/>}/>  {/*Uno Game page*/}
        </Routes>  
        <Footer/> {/*Footer of website*/}
      </div>
      </Router>
    );
  }
}

export default App;
