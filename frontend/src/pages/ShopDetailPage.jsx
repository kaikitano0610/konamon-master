import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // ★ useTranslationをインポート
import styles from './ShopDetailPage.module.css';

function ShopDetailPage() {
  const { t, i18n } = useTranslation(); // ★ t関数とi18nオブジェクトを取得
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
  // ★ 曜日名を翻訳キーで取得
  const daysOfWeekFull = [t('day_sun_full'), t('day_mon_full'), t('day_tue_full'), t('day_wed_full'), t('day_thu_full'), t('day_fri_full'), t('day_sat_full')];
  const daysOfWeekShort = [t('day_sun'), t('day_mon'), t('day_tue'), t('day_wed'), t('day_thu'), t('day_fri'), t('day_sat')];

  const getDayOpeningHours = (openingHoursData, dayIndex) => {
    if (!openingHoursData || !Array.isArray(openingHoursData) || openingHoursData.length === 0) {
      return t('opening_hours_unknown');
    }

    if (openingHoursData[0] && openingHoursData[0].open && typeof openingHoursData[0].open.day === 'number') {
      const targetDayPeriods = openingHoursData.filter(p => p.open && p.open.day === dayIndex);
      if (targetDayPeriods.length === 0) {
        return t('closed_today_or_unknown');
      }
      const displayStrings = [];
      targetDayPeriods.forEach(p => {
        const openTime = `${p.open.time.substring(0, 2)}:${p.open.time.substring(2, 4)}`;
        const closeTime = `${p.close.time.substring(0, 2)}:${p.close.time.substring(2, 4)}`;
        if (p.open.day !== p.close.day) {
            displayStrings.push(`${openTime}〜${t('next_day_prefix')}${daysOfWeekShort[p.close.day]}${closeTime}`);
        } else {
            displayStrings.push(`${openTime}〜${closeTime}`);
        }
      });
      return displayStrings.join(' / ');
    }
    else if (typeof openingHoursData[0] === 'string') {
        const targetDayFull = daysOfWeekFull[dayIndex];
        const hours = openingHoursData.find(hour => hour.startsWith(targetDayFull));
        return hours ? hours.split(': ')[1] : t('closed_today_or_unknown');
    }
    return t('opening_hours_unknown');
  };

  useEffect(() => {
    const fetchShopDetail = async () => {
      try {
        setLoading(true);
        // ★ APIリクエストに現在の言語を渡す
        const response = await fetch(`http://localhost:5001/api/shops/${placeId}?lang=${i18n.language}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setShopDetail(data);
      } catch (err) {
        console.error("店舗詳細の取得中にエラーが発生しました:", err);
        setError(t('failed_to_load_shop_detail_message')); // ★ 翻訳キーを使用
      } finally {
        setLoading(false);
      }
    };

    if (placeId) {
      fetchShopDetail();
    }
  }, [placeId, i18n.language, t]); // i18n.language と t も依存配列に追加

  if (loading) {
    return (
      <div className={styles['shop-detail-container']}>
        <p className={styles['loading-message']}>{t('loading_shop_detail_message')}</p> {/* ★ 翻訳キーを使用 */}
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['shop-detail-container']}>
        <p className={styles['error-message']}>{error}</p>
        <button className={styles['back-button']} onClick={() => navigate(-1)}>
          {t('back_button')} {/* ★ 翻訳キーを使用 */}
        </button>
      </div>
    );
  }

  if (!shopDetail) {
    return (
      <div className={styles['shop-detail-container']}>
        <p className={styles['no-data-message']}>{t('no_shop_detail_found_message')}</p> {/* ★ 翻訳キーを使用 */}
        <button className={styles['back-button']} onClick={() => navigate(-1)}>
          {t('back_button')} {/* ★ 翻訳キーを使用 */}
        </button>
      </div>
    );
  }

  // ★ 言語設定に応じて表示するテキストを動的に選択する
  const shopName = i18n.language === 'en' && shopDetail.name_en ? shopDetail.name_en : shopDetail.name;
  const shopAddress = i18n.language === 'en' && shopDetail.address_en ? shopDetail.address_en : shopDetail.address;
  const shopPhone = i18n.language === 'en' && shopDetail.phone_en ? shopDetail.phone_en : shopDetail.phone;

  return (
    <div className={styles['shop-detail-container']}>
      <h1 className={styles['shop-name']}>{shopName}</h1> {/* ★ 動的に表示 */}
      <div className={styles['shop-detail-content']}>
        {shopDetail.photo_url && (
          <img
            src={shopDetail.photo_url}
            alt={`${shopName}の外観`}
            className={styles['shop-photo-detail']}
          />
        )}
        {!shopDetail.photo_url && <p className={styles['no-photo-message']}>{t('no_photo_message')}</p>} {/* ★ 翻訳キーを使用 */}

        {shopDetail.rating && (
          <div className={styles['shop-rating']}>
            ⭐️ {shopDetail.rating.toFixed(1)}
            {shopDetail.user_ratings_total && ` (${shopDetail.user_ratings_total})`}
          </div>
        )}
        {shopDetail.price_level_text && (
          <p className={styles['price-level']}>{t('price_range_label')}: {shopDetail.price_level_text}</p> 
        )}

        <p className={styles['detail-item']}><strong>{t('address_label')}:</strong> {shopAddress}</p> {/* ★ 動的に表示 */}
        {shopPhone && <p className={styles['detail-item']}><strong>{t('phone_label')}:</strong> {shopPhone}</p>} {/* ★ 動的に表示 */}

        <div className={styles['opening-hours-detail']}>
          <h3>{t('opening_hours_label')}:</h3> {/* ★ 翻訳キーを使用 */}
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
        {t('back_button')} {/* ★ 翻訳キーを使用 */}
      </button>
    </div>
  );
}

export default ShopDetailPage;