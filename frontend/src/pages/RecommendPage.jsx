import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import styles from './RecommendPage.module.css'; 
import '../styles/tmp-takoyan.css';

function RecommendPage() {
  const [step, setStep] = useState(0);
  const [selectedFoodType, setSelectedFoodType] = useState(null);
  const [moodInput, setMoodInput] = useState('');
  const navigate = useNavigate(); // Initialize navigate

  const handleFoodTypeSelect = (type) => {
    setSelectedFoodType(type);
    setStep(1);
  };

  const handleSearchClick = async () => {
    if (!moodInput.trim()) {
      alert("今日の気分を入力してや！");
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
      alert("お店の検索中にエラーが発生しました。もう一度お試しください。");
    }
  };

  return (
    <div className={styles['recommend-page-container']}>
      {step === 0 && ( 
        <div className={styles['food-select-section']}>
          <div className="takoyan-icon"></div> 
          <h1 className={styles['food-select-title']}>粉もん選択</h1>
          <div className={styles['food-select-buttons']}>
            <button
              className={`${styles['food-button']} ${styles['okonomiyaki-button']}`} 
              onClick={() => handleFoodTypeSelect('お好み焼き')}
            >
              お好み焼き
            </button>
            <button
              className={`${styles['food-button']} ${styles['takoyaki-button']}`}
              onClick={() => handleFoodTypeSelect('たこ焼き')}
            >
              たこ焼き
            </button>
          </div>
        </div>
      )}

      {step === 1 && ( 
        <div className={styles['mood-hearing-section']}>
          <div className={styles["dialog-bubble"]}>
            <p className={styles["takoyan-dialog-text"]}>今日はどんな</p>
            <p className={styles["takoyan-dialog-text"]}>気分なん？？</p>
          </div>
          <div className="takoyan-icon"></div> 
          <div className={styles['mood-input-area']}>
            <textarea
              className={styles['mood-textarea']}
              placeholder="今日の気分やいきたいお店の条件を入力"
              value={moodInput}
              onChange={(e) => setMoodInput(e.target.value)}
            ></textarea>
            <button className={styles['search-button']} onClick={handleSearchClick}> 
              探す
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecommendPage;