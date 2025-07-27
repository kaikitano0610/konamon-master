import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ConfigPage.module.css';

function ConfigPage() {
  const navigate = useNavigate();

  const handleLanguageSelect = (language) => {
    // You can add logic here to set the language preference in localStorage
    // or a global state management system if your app supports multiple languages.
    console.log(`Selected language: ${language}`);

    if (language === 'English') {
      navigate('/home-english'); // Navigate to HomePageEnglish
    }
    // For other languages, you might navigate to a localized homepage or just set a preference
    // For now, we only handle navigation for English.
  };

  return (
    <div className={styles['config-page-container']}>
      <h1 className={styles['page-title']}>言語を選択してください</h1>
      <div className={styles['language-buttons-container']}>
        <button
          className={styles['language-button']}
          onClick={() => handleLanguageSelect('Japanese')}
        >
          日本語
        </button>
        <button
          className={styles['language-button']}
          onClick={() => handleLanguageSelect('English')}
        >
          English
        </button>
        <button
          className={styles['language-button']}
          onClick={() => handleLanguageSelect('Chinese')}
        >
          中文
        </button>
        <button
          className={styles['language-button']}
          onClick={() => handleLanguageSelect('Korean')}
        >
          한국어
        </button>
      </div>
    </div>
  );
}

export default ConfigPage;