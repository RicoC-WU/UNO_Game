import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import io from 'socket.io-client'

let socket = io('http://localhost:3456');
//let socket;

// let ip = window.location.hostname;
// if (ip.startsWith('192.168.')) {
//   socket = io("http://192.168.1.105")
// } else {
//   socket = io("http://108.236.64.90");
// } 



// socket.on("printSocket",function(data){
//   console.log(data["socketid"]);
//   console.log(socket);
// })

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
    <App socket={socket}/>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
