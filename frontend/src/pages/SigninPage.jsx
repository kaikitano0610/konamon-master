// frontend/src/pages/SigninPage.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './AuthPage.module.css'; // 認証ページ共通のCSSを使用

function SigninPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignin = async (e) => {
    e.preventDefault(); // フォームのデフォルト送信を防ぐ
    setError(''); // エラーメッセージをクリア

    try {
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // 登録成功
        // ログインページへリダイレクト
        alert('登録成功！ログインしてください。');
        navigate('/login'); 
      } else {
        // 登録失敗
        setError(data.message || '登録に失敗しました。');
      }
    } catch (err) {
      console.error('登録中にエラーが発生しました:', err);
      setError('サーバーとの通信に失敗しました。');
    }
  };

  return (
    <div className={styles['auth-page-container']}>
      <div className={styles['auth-card']}>
        <h1 className={styles['auth-title']}>新規登録</h1>
        <form onSubmit={handleSignin} className={styles['auth-form']}>
          <input
            type="text"
            placeholder="ユーザー名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={styles['auth-input']}
            required
          />
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles['auth-input']}
            required
          />
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles['auth-input']}
            required
          />
          {error && <p className={styles['error-message']}>{error}</p>}
          <button type="submit" className={styles['auth-button']}>登録</button>
        </form>
        <p className={styles['auth-link-text']}>
          すでにアカウントをお持ちですか？{' '}
          <Link to="/login" className={styles['auth-link']}>ログイン</Link>
        </p>
      </div>
    </div>
  );
}

export default SigninPage;