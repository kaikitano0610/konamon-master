// frontend/src/pages/ShopDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './ShopDetailPage.module.css'; // 新しいCSSモジュールを使用

function ShopDetailPage() {
  const { placeId } = useParams(); // URLからplace_idを取得
  const navigate = useNavigate();
  const [shopDetail, setShopDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 現在の日付を取得 (ShopListPageと共通化すると良い)
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentDay = currentDate.getDate();
  const currentDayOfWeekIndex = currentDate.getDay();
  const daysOfWeekFull = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
  const daysOfWeekShort = ['日', '月', '火', '水', '木', '金', '土'];

  const getDayOpeningHours = (openingHours, dayIndex) => {
    if (!openingHours || openingHours.length === 0) {
      return '営業時間不明';
    }
    const targetDayFull = daysOfWeekFull[dayIndex];
    const hours = openingHours.find(hour => hour.startsWith(targetDayFull));
    return hours ? hours.split(': ')[1] : '定休日、または営業時間不明';
  };

  useEffect(() => {
    const fetchShopDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5001/api/shops/${placeId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setShopDetail(data);
      } catch (err) {
        console.error("店舗詳細の取得中にエラーが発生しました:", err);
        setError("店舗詳細の読み込みに失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    if (placeId) {
      fetchShopDetail();
    }
  }, [placeId]);

  if (loading) {
    return (
      <div className={styles['shop-detail-container']}>
        <p className={styles['loading-message']}>お店の詳細情報を読み込み中...🐙</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['shop-detail-container']}>
        <p className={styles['error-message']}>{error}</p>
        <button className={styles['back-button']} onClick={() => navigate(-1)}>
          戻る
        </button>
      </div>
    );
  }

  if (!shopDetail) {
    return (
      <div className={styles['shop-detail-container']}>
        <p className={styles['no-data-message']}>お店の詳細情報が見つかりませんでした。</p>
        <button className={styles['back-button']} onClick={() => navigate(-1)}>
          戻る
        </button>
      </div>
    );
  }

  return (
    <div className={styles['shop-detail-container']}>
      <h1 className={styles['shop-name']}>{shopDetail.name}</h1>
      <div className={styles['shop-detail-content']}>
        {shopDetail.photo_url && (
          <img
            src={shopDetail.photo_url}
            alt={`${shopDetail.name}の外観`}
            className={styles['shop-photo-detail']}
          />
        )}
        {!shopDetail.photo_url && <p className={styles['no-photo-message']}>写真はありません</p>}

        <p className={styles['detail-item']}><strong>住所:</strong> {shopDetail.address}</p>
        {shopDetail.phone && <p className={styles['detail-item']}><strong>電話:</strong> {shopDetail.phone}</p>}

        <div className={styles['opening-hours-detail']}>
          <h3>営業時間:</h3>
          <p className={styles['today-hours']}>
            {currentMonth}/{currentDay} ({daysOfWeekShort[currentDayOfWeekIndex]}): {getDayOpeningHours(shopDetail.opening_hours, currentDayOfWeekIndex)}
          </p>
          <ul className={styles['full-hours-list']}>
            {daysOfWeekFull.map((day, index) => (
              <li key={day} className={index === currentDayOfWeekIndex ? styles['highlight-today'] : ''}>
                {day}: {getDayOpeningHours(shopDetail.opening_hours, index)}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <button className={styles['back-button']} onClick={() => navigate(-1)}>
        戻る
      </button>
    </div>
  );
}

export default ShopDetailPage;