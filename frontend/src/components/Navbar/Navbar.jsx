import React ,{ useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; 
import './Navbar.css';

function Navbar() {
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () =>{
    setIsOpen(!isOpen);
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/"><span>粉</span>もんベストマッチ</Link>
      </div>
      <button className="navbar-toggler" onClick={toggleMenu}>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </button>
      <div className={`navbar-menu ${isOpen ? 'open' : ''}`}>
        <ul className="navbar-nav">
          <li>
            <Link to={"/"} onClick={() => setIsOpen(false)}>{t('home')}</Link>
          </li>
          <li>
            <Link to={"/nearby"} onClick={() => setIsOpen(false)}>{t('shops')}</Link>
          </li>
          <li>
            <Link to={"/recommend"} onClick={() => setIsOpen(false)}>{t('recommend')}</Link> 
          </li>
          <li>
            <Link to={"/recipes"} onClick={() => setIsOpen(false)}>{t('recipes')}</Link>
          </li>
          <li>
            <Link to={"/login"} onClick={() => setIsOpen(false)}>{t('login')}</Link> 
          </li>
          <li>
            <Link to={"/config"} onClick={() => setIsOpen(false)}>{t('config')}</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;