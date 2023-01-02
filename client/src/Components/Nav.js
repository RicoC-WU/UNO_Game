import { Component } from 'react';

class Nav extends Component {
  render(){
    return(
      <div className='Nav'>
        <nav>
          <h3>Logo</h3>
          <ul>
              <li>About</li>
              <li>Home</li>
          </ul>
        </nav>
      </div>
    );
  }
}

export default Nav;
