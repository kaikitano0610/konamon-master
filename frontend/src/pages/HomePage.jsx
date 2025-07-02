import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HomePage.module.css'; 
import '../styles/tmp-takoyan.css';
function HomePage() {
  const navigate = useNavigate();

  const handleMoodSearch = () => {
    navigate('/recommend');
  };

  const handleNearbySearch = () => {
    navigate('/nearby');
  };

  return (
    <div className={styles['home-page-container']}>
      <div className={styles['dialog-bubble']}>
        <p className={styles['takoyan-dialog-text']}>ええ店、探し出すで！</p>
        <p className={styles['takoyan-dialog-text']}>どないして探す？</p>
      </div>
      <div className="takoyan-icon"></div>
      <div className={styles['selection-buttons']}>
        <button
          className={`${styles['selection-button']} ${styles['mood-search-button']}`}
          onClick={handleMoodSearch}
        >
          今日の気分から探す
        </button>
        <button
          className={`${styles['selection-button']} ${styles['nearby-search-button']}`}
          onClick={handleNearbySearch}
        >
          近くの営業中の<br></br>お店から探す
        </button>
      </div>
    </div>
  );
}

export default HomePage;