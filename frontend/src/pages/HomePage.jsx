import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // ★ useTranslationをインポート
import styles from './HomePage.module.css';
import '../styles/takoyan.css';

function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation(); // ★ t関数を取得

  const handleMoodSearch = () => {
    navigate('/recommend');
  };

  const handleNearbySearch = () => {
    navigate('/nearby');
  };

  return (
    <div className={styles['home-page-container']}>
      <div className={styles['dialog-bubble']}>
        <p className={styles['takoyan-dialog-text']}>{t('home_dialog_1')}</p> {/* ★ 翻訳キーを使用 */}
        <p className={styles['takoyan-dialog-text']}>{t('home_dialog_2')}</p> {/* ★ 翻訳キーを使用 */}
      </div>
      <div className="takoyan-icon"></div>
      <div className={styles['selection-buttons']}>
        <button
          className={`${styles['selection-button']} ${styles['mood-search-button']}`}
          onClick={handleMoodSearch}
        >
          {t('search_by_mood_button')} {/* ★ 翻訳キーを使用 */}
        </button>
        <button
          className={`${styles['selection-button']} ${styles['nearby-search-button']}`}
          onClick={handleNearbySearch}
        >
          {t('search_nearby_button')} {/* ★ 翻訳キーを使用 */}
        </button>
      </div>
    </div>
  );
}

export default HomePage;
