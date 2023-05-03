import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import io from 'socket.io-client'

// let socket = io('http://localhost:3456');
let socket;

//checks for the specific origin that a user is coming from and sets the socket to connect to that origin
let ip = window.location.hostname;
if (ip.startsWith('192.168.')) {
  socket = io("http://192.168.1.238");
} else if(ip.includes('localhost')){
  socket = io('http://localhost:3456');
} else{ 
  socket = io("http://174.86.243.203");
} 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App socket={socket}/>  //passes in the socket as a prop to the App component
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
