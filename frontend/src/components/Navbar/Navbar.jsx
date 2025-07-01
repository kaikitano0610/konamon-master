import React ,{ useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; 

function Navbar() {

  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () =>{
    setIsOpen(!isOpen);
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">粉もんベストマッチ</Link>
      </div> 
      <button className="navbar-toggler" onClick={toggleMenu}>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </button>
      <div className={`navbar-menu ${isOpen ? 'open' : ''}`}>
        <ul className="navbar-nav">
          <li>
            <Link to={"/"} onClick={() => setIsOpen(false)}>ホーム</Link>
          </li>
          <li>
            <Link to={"/nearby"} onClick={() => setIsOpen(false)}>お店を探す</Link>
          </li>
          <li>
            <Link to={"/recommend"} onClick={() => setIsOpen(false)}>気分で探す</Link>
          </li>
          <li>
            <Link to={"/recipes"} onClick={() => setIsOpen(false)}>レシピ一覧</Link>
          </li>
          <li>
            <Link to={"/login"} onClick={() => setIsOpen(false)}>ログイン</Link>
          </li>
          <li>
            <Link to={"/signin"} onClick={() => setIsOpen(false)}>サインイン</Link>
          </li>
          <li>
            <Link to={"/config"} onClick={() => setIsOpen(false)}>設定</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;