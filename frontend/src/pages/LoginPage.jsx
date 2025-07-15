// frontend/src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './AuthPage.module.css'; // 認証ページ共通のCSSを使用

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // フォームのデフォルト送信を防ぐ
    setError(''); // エラーメッセージをクリア

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
        // ログイン成功
        // アクセストークンをLocalStorageに保存
        localStorage.setItem('access_token', data.access_token);
        // 必要に応じてユーザー情報も保存
        localStorage.setItem('user_id', data.user.id);
        localStorage.setItem('username', data.user.username);

        alert('ログイン成功！');
        navigate('/recipes'); // トップページなどへリダイレクト
      } else {
        // ログイン失敗
        setError(data.message || 'ログインに失敗しました。');
      }
    } catch (err) {
      console.error('ログイン中にエラーが発生しました:', err);
      setError('サーバーとの通信に失敗しました。');
    }
  };

  return (
    <div className={styles['auth-page-container']}>
      <div className={styles['auth-card']}>
        <h1 className={styles['auth-title']}>ログイン</h1>
        <form onSubmit={handleLogin} className={styles['auth-form']}>
          <input
            type="text"
            placeholder="ユーザー名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
          <button type="submit" className={styles['auth-button']}>ログイン</button>
        </form>
        <p className={styles['auth-link-text']}>
          アカウントをお持ちでないですか？{' '}
          <Link to="/signin" className={styles['auth-link']}>新規登録</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;