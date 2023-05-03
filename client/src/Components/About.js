import { Component } from "react";

//About Component: The "About" page for the website. This page simply has a few details of what the
//website is and how it was made.
class About extends Component{

    render(){
        return(
            <div className="About"> {/*Description*/}
                This is an online UNO game created from scratch using React, socket.io, and Node.JS
                <div className="blankspace"></div>
                <div className="blankspace"></div>
                <div className="blankspace"></div>
                <div className="blankspace"></div>
            </div>
        );
    }
}

export default About;