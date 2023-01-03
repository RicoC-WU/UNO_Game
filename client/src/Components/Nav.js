import { Component } from 'react';

class Nav extends Component {
  render(){
    return(
      <div className='Nav'>
        <nav>
          {/* <h3>Logo</h3> */}
          <img src='UNO_Logo.png' alt='Logo' height='100'/>
          <ul>
              <li><b><a href='/About'>About</a></b></li>
              <li><b><a href='/'>Home</a></b></li>
          </ul>
        </nav>
      </div>
    );
  }
}

export default Nav;
