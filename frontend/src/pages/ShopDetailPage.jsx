import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styles from './ShopDetailPage.module.css';

function ShopDetailPage() {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [shopDetail, setShopDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentDay = currentDate.getDate();
  const currentDayOfWeekIndex = currentDate.getDay();
  const daysOfWeekFull = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
  const daysOfWeekShort = ['日', '月', '火', '水', '木', '金', '土'];

  const getDayOpeningHours = (openingHoursData, dayIndex) => {
    // ★修正箇所: openingHoursDataがnullまたはundefinedの場合のチェックを最初に追加★
    if (!openingHoursData || !Array.isArray(openingHoursData) || openingHoursData.length === 0) {
      return '営業時間不明';
    }

    // opening_hoursDataが配列（periods形式）の場合の処理
    // APIの応答形式に応じて、ここに `openingHoursData[0].open` が存在するかどうかのチェックも追加するとより堅牢になります。
    if (openingHoursData[0] && openingHoursData[0].open && typeof openingHoursData[0].open.day === 'number') {
      const targetDayPeriods = openingHoursData.filter(p => p.open && p.open.day === dayIndex); // p.open の存在もチェック
      if (targetDayPeriods.length === 0) {
        return "定休日、または営業時間不明";
      }
      const displayStrings = [];
      targetDayPeriods.forEach(p => {
        const openTime = `${p.open.time.substring(0, 2)}:${p.open.time.substring(2, 4)}`;
        const closeTime = `${p.close.time.substring(0, 2)}:${p.close.time.substring(2, 4)}`;
        if (p.open.day !== p.close.day) {
           displayStrings.push(`${openTime}〜翌${daysOfWeekShort[p.close.day]}${closeTime}`);
        } else {
           displayStrings.push(`${openTime}〜${closeTime}`);
        }
      });
      return displayStrings.join(' / ');
    }
    // opening_hoursDataが文字列配列（ShopListPageが元々使っていた形式）の場合の処理
    else if (typeof openingHoursData[0] === 'string') {
        const targetDayFull = daysOfWeekFull[dayIndex];
        const hours = openingHoursData.find(hour => hour.startsWith(targetDayFull));
        return hours ? hours.split(': ')[1] : '定休日、または営業時間不明';
    }
    return '営業時間不明';
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

        {shopDetail.rating && (
          <div className={styles['shop-rating']}>
            ⭐️ {shopDetail.rating.toFixed(1)}
            {shopDetail.user_ratings_total && ` (${shopDetail.user_ratings_total})`}
          </div>
        )}
        {shopDetail.price_level_text && (
          <p className={styles['price-level']}>価格帯: {shopDetail.price_level_text}</p>
        )}

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