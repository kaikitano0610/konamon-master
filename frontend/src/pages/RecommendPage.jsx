import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // ★ useTranslationをインポート
import styles from './RecommendPage.module.css';
import '../styles/takoyan.css';

function RecommendPage() {
  const { t } = useTranslation(); // ★ t関数を取得
  const [step, setStep] = useState(0);
  const [selectedFoodType, setSelectedFoodType] = useState(null);
  const [moodInput, setMoodInput] = useState('');
  const navigate = useNavigate();

  const handleFoodTypeSelect = (type) => {
    setSelectedFoodType(type);
    setStep(1);
  };

  const handleSearchClick = async () => {
    if (!moodInput.trim()) {
      alert(t('enter_mood_alert')); // ★ 翻訳キーを使用
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/shops/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mood_query: moodInput,
          food_type: selectedFoodType,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const shopData = await response.json();
      navigate('/recommend/list', { state: { shopData } });
    } catch (error) {
      console.error("API呼び出し中にエラーが発生しました:", error);
      alert(t('search_shops_failed_alert')); // ★ 翻訳キーを使用
    }
  };

  return (
    <div className={styles['recommend-page-container']}>
      {step === 0 && (
        <div className={styles['food-select-section']}>
          <div className={styles["dialog-bubble"]}>
            <p className={styles["takoyan-dialog-text"]}>{t('recommend_dialog_1')}</p> {/* ★ 翻訳キーを使用 */}
            <p className={styles["takoyan-dialog-text"]}>{t('recommend_dialog_2')}</p> {/* ★ 翻訳キーを使用 */}
          </div>
          <div className="takoyan-icon"></div>
          <h1 className={styles['food-select-title']}>{t('food_select_title')}</h1> {/* ★ 翻訳キーを使用 */}
          <div className={styles['food-select-buttons']}>
            <button
              className={`${styles['food-button']} ${styles['okonomiyaki-button']}`}
              onClick={() => handleFoodTypeSelect('お好み焼き')}
            >
              {t('okonomiyaki_button')} {/* ★ 翻訳キーを使用 */}
            </button>
            <button
              className={`${styles['food-button']} ${styles['takoyaki-button']}`}
              onClick={() => handleFoodTypeSelect('たこ焼き')}
            >
              {t('takoyaki_button')} {/* ★ 翻訳キーを使用 */}
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className={styles['mood-hearing-section']}>
          <div className={styles["dialog-bubble"]}>
            <p className={styles["takoyan-dialog-text"]}>{t('mood_dialog_1')}</p> {/* ★ 翻訳キーを使用 */}
            <p className={styles["takoyan-dialog-text"]}>{t('mood_dialog_2')}</p> {/* ★ 翻訳キーを使用 */}
          </div>
          <div className="takoyan-icon"></div>
          <div className={styles['mood-input-area']}>
            <textarea
              className={styles['mood-textarea']}
              placeholder={t('mood_input_placeholder')} // ★ 翻訳キーを使用
              value={moodInput}
              onChange={(e) => setMoodInput(e.target.value)}
            ></textarea>
            <button className={styles['search-button']} onClick={handleSearchClick}>
              {t('search_button')} {/* ★ 翻訳キーを使用 */}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecommendPage;