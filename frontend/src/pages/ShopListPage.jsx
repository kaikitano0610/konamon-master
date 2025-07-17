// frontend/src/pages/ShopListPage.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './ShopListPage.module.css';

function ShopListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { shopData } = location.state || { shopData: [] };

  const handleCardClick = (placeId) => {
    navigate(`/shops/${placeId}`);
  };

  const getTodayOpeningHours = (openingHours) => {
    if (!openingHours || openingHours.length === 0) {
      return '営業時間不明';
    }

    const daysOfWeek = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
    const date = new Date();
    const month = date.getMonth() + 1; // Month is 0-indexed
    const dayOfMonth = date.getDate();
    const todayIndex = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const todayDayOfWeek = daysOfWeek[todayIndex];

    const todayHours = openingHours.find(hour => hour.startsWith(todayDayOfWeek));
    const hoursText = todayHours ? todayHours.split(': ')[1] : '本日は定休日、または営業時間不明';

    return `${month}/${dayOfMonth} (${todayDayOfWeek.charAt(0)}) ${hoursText}`; // Formats as 7/12 (土)
  };

  if (!shopData || shopData.length === 0) {
    return (
      <div className={styles['shop-list-container']}>
        <h1 className={styles['no-results-title']}>お店が見つかりませんでした…🐙</h1>
        <button className={styles['back-button']} onClick={() => navigate('/')}>
          戻る
        </button>
      </div>
    );
  }

  return (
    <div className={styles['shop-list-container']}>
      <h1 className={styles['shop-list-title']}>おすすめのお店やで！</h1>
      <div className={styles['shop-cards-grid']}>
        {shopData.map((shop, index) => (
          <div 
            key={index} 
            className={styles['shop-card']}
            onClick={() => handleCardClick(shop.place_id)} 
            >
            <h2 className={styles['shop-name']}>{shop.name}</h2>
            <p className={styles['shop-address']}>住所: {shop.address}</p>
            {shop.phone && <p className={styles['shop-phone']}>電話: {shop.phone}</p>}
            <div className={styles['shop-hours']}>
              <h3>営業時間:</h3>
              <p>{getTodayOpeningHours(shop.opening_hours)}</p>
            </div>
            {shop.photo_url && ( // ここを修正
              <img
                src={shop.photo_url} // ここを修正
                alt={`${shop.name}の外観`}
                className={styles['shop-photo']}
              />
            )}
          </div>
        ))}
      </div>
      <button className={styles['back-button']} onClick={() => navigate('/')}>
        戻る
      </button>
    </div>
  );
}

export default ShopListPage;