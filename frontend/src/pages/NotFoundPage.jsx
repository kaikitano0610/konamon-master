import React from 'react';
import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

function NotFoundPage() {
  return (
    <div className={styles['not-found-container']}>
      <h1 className={styles['not-found-title']}>404</h1>
      <p className={styles['not-found-message']}>おっと、お探しのページは見つからへんかったで！</p>
      <Link to="/" className={styles['home-link']}>ホームに戻る</Link>
    </div>
  );
}

export default NotFoundPage;