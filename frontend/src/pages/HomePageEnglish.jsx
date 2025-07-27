import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HomePage.module.css'; 
import '../styles/takoyan.css';

function HomePageEnglish() {
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
        {/* Translated from: ええ店、探し出すで！ */}
        <p className={styles['takoyan-dialog-text']}>I'll find you a great place!</p>
        {/* Translated from: どないして探す？ */}
        <p className={styles['takoyan-dialog-text']}>How do you want to search?</p>
      </div>
      <div className="takoyan-icon"></div>
      <div className={styles['selection-buttons']}>
        <button
          className={`${styles['selection-button']} ${styles['mood-search-button']}`}
          onClick={handleMoodSearch}
        >
          {/* Translated from: 今日の気分から探す */}
          Search by Mood
        </button>
        <button
          className={`${styles['selection-button']} ${styles['nearby-search-button']}`}
          onClick={handleNearbySearch}
        >
          {/* Translated from: 近くの営業中のお店から探す */}
          Search Nearby <br></br> Open Shops
        </button>
      </div>
    </div>
  );
}

export default HomePageEnglish;