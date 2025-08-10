// frontend/src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // ★ useTranslationをインポート
import styles from './AuthPage.module.css';

function LoginPage() {
  const { t } = useTranslation(); // ★ t関数を取得
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user_id', data.user.id);
        localStorage.setItem('username', data.user.username);

        navigate('/recipes');
      } else {
        setError(data.message || t('login_failed_message')); // ★ 翻訳キーを使用
      }
    } catch (err) {
      console.error('ログイン中にエラーが発生しました:', err);
      setError(t('server_communication_error_message')); // ★ 翻訳キーを使用
    }
  };

  return (
    <div className={styles['auth-page-container']}>
      <div className={styles['auth-card']}>
        <h1 className={styles['auth-title']}>{t('login_title')}</h1> {/* ★ 翻訳キーを使用 */}
        <form onSubmit={handleLogin} className={styles['auth-form']}>
          <input
            type="text"
            placeholder={t('username_placeholder')} // ★ 翻訳キーを使用
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={styles['auth-input']}
            required
          />
          <input
            type="password"
            placeholder={t('password_placeholder')} // ★ 翻訳キーを使用
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles['auth-input']}
            required
          />
          {error && <p className={styles['error-message']}>{error}</p>}
          <button type="submit" className={styles['auth-button']}>{t('login_button')}</button> {/* ★ 翻訳キーを使用 */}
        </form>
        <p className={styles['auth-link-text']}>
          {t('no_account_text')}{' '} {/* ★ 翻訳キーを使用 */}
          <br />
          <Link to="/signin" className={styles['auth-link']}>{t('signup_link')}</Link> {/* ★ 翻訳キーを使用 */}
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
