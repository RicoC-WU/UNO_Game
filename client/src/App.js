import logo from './logo.svg';
import './App.css';
import { Component } from 'react';
import Nav from './Nav';
import LoginForm from './Login';
import Home from './Home';
import SignUpForm from './SignUp';
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
          {/* <Home/> */}
          <Route path="/" element={<Home/>} />
            <Route path="/Login" element={<LoginForm socket={this.props.socket}/>}/>
            <Route path="/SignUp" element={<SignUpForm socket={this.props.socket}/>}/>
        </Routes>    
      </div>
      </Router>
    );
  }
}

export default App;
