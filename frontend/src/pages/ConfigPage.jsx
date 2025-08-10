import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; 
import styles from './ConfigPage.module.css';

function ConfigPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleLanguageSelect = (lng) => {
    i18n.changeLanguage(lng); 
    navigate('/'); 
  };

  return (
    <div className={styles['config-page-container']}>
      <h1 className={styles['page-title']}>{t('select_language')}</h1> 
      <div className={styles['language-buttons-container']}>
        <button
          className={styles['language-button']}
          onClick={() => handleLanguageSelect('ja')} 
        >
          日本語
        </button>
        <button
          className={styles['language-button']}
          onClick={() => handleLanguageSelect('en')} 
        >
          English
        </button>
        <button
          className={styles['language-button']}
          onClick={() => handleLanguageSelect('zh')} 
        >
          中文
        </button>
        <button
          className={styles['language-button']}
          onClick={() => handleLanguageSelect('ko')} 
        >
          한국어
        </button>
      </div>
    </div>
  );
}

export default ConfigPage;