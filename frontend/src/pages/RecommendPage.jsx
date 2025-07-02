import React, { useState } from 'react';
import styles from './RecommendPage.module.css'; 
import '../styles/tmp-takoyan.css';

function RecommendPage() {
  const [step, setStep] = useState(0);
  const [selectedFoodType, setSelectedFoodType] = useState(null);
  const [moodInput, setMoodInput] = useState('');

  const handleFoodTypeSelect = (type) => {
    setSelectedFoodType(type);
    setStep(1);
  };

  const handleSearchClick = () => {
    if (!moodInput.trim()) {
      alert("今日の気分を入力してや！");
      return;
    }
    console.log("API呼び出し実行予定:");
    console.log("気分:", moodInput);
    console.log("粉もん:", selectedFoodType);
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