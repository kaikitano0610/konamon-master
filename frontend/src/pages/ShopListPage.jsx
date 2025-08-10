import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // ★ useTranslationをインポート
import styles from './ShopListPage.module.css';
import RoomIcon from '@mui/icons-material/Room';

function ShopListPage() {
  const { t, i18n } = useTranslation(); // ★ t関数とi18nオブジェクトを取得
  const location = useLocation();
  const navigate = useNavigate();
  // ★ バックエンドからのデータに name_en, address_en が含まれていることを想定
  const { shopData, fromNearby, foodType } = location.state || { shopData: [] };

  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadingImages, setLoadingImages] = useState(true);
  const [hasImageLoadErrors, setHasImageLoadErrors] = useState(false);

  const timeoutIdRef = useRef(null);

  const handleCardClick = (placeId) => {
    navigate(`/shops/${placeId}`, { state: { prevPath: location.pathname, shopData: shopData } });
  };

  const getTodayOpeningHours = (openingHours) => {
    // ★ 全体を多言語対応
    if (!openingHours || !Array.isArray(openingHours) || openingHours.length === 0) {
      return t('opening_hours_unknown');
    }

    const daysOfWeek = [t('day_sun_full'), t('day_mon_full'), t('day_tue_full'), t('day_wed_full'), t('day_thu_full'), t('day_fri_full'), t('day_sat_full')];
    const date = new Date();
    const todayIndex = date.getDay();
    const todayDayOfWeek = daysOfWeek[todayIndex];

    const todayHours = openingHours.find(hour => hour.startsWith(todayDayOfWeek));
    const hoursText = todayHours ? todayHours.split(': ')[1] : t('closed_today_or_unknown');

    return hoursText;
  };

  const formatOpeningHoursForShopList = (periods) => {
    // ★ 全体を多言語対応
    if (!periods || !Array.isArray(periods) || periods.length === 0) {
      return t('opening_hours_unknown');
    }
    const daysOfWeek = [t('day_sun'), t('day_mon'), t('day_tue'), t('day_wed'), t('day_thu'), t('day_fri'), t('day_sat')];
    const now = new Date();
    const today = now.getDay();

    const todayPeriods = periods.filter(p => p.open && p.open.day === today);

    if (todayPeriods.length === 0) {
      return t('closed_today_or_unknown');
    }

    const displayStrings = [];
    todayPeriods.forEach(p => {
      const openTime = `${p.open.time.substring(0, 2)}:${p.open.time.substring(2, 4)}`;
      const closeTime = `${p.close.time.substring(0, 2)}:${p.close.time.substring(2, 4)}`;

      if (p.open.day !== p.close.day) {
         displayStrings.push(`${openTime}〜${t('next_day_prefix')}${daysOfWeek[p.close.day]}${closeTime}`);
      } else {
         displayStrings.push(`${openTime}〜${closeTime}`);
      }
    });

    return `${t('today_label')} (${daysOfWeek[today]}): ${displayStrings.join(' / ')}`;
  };

  useEffect(() => {
    if (shopData && shopData.length > 0) {
      setLoadingImages(true);
      setImagesLoaded(false);
      setHasImageLoadErrors(false);

      const imagesToProcess = shopData.filter(shop => shop.photo_url || shop.main_photo_url);
      
      if (imagesToProcess.length === 0) {
        setImagesLoaded(true);
        setLoadingImages(false);
        return;
      }

      const imagePromises = imagesToProcess.map(shop => {
        return new Promise(resolve => {
          const img = new Image();
          img.src = shop.photo_url || shop.main_photo_url;
          img.onload = () => resolve();
          img.onerror = () => {
            console.warn(t('image_load_failed_message', { url: img.src })); // ★ 翻訳キーを使用
            setHasImageLoadErrors(true);
            resolve();
          };
        });
      });

      Promise.allSettled(imagePromises).then(() => {
        setImagesLoaded(true);
        setLoadingImages(false);
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
      });

      timeoutIdRef.current = setTimeout(() => {
        console.warn(t('image_load_timeout_warning')); // ★ 翻訳キーを使用
        setImagesLoaded(true);
        setLoadingImages(false);
        timeoutIdRef.current = null;
      }, 5000);

      return () => {
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
      };
    } else {
      setImagesLoaded(true);
      setLoadingImages(false);
    }
  }, [shopData, t]); // ★ tも依存配列に追加

  // ★ ページタイトルも多言語対応
  const pageTitleContent = fromNearby
    ? (
        <>
          <span>{foodType || t('unknown')}の</span>
          <br />
          <span>{t('open_shops_nearby_title')}</span>
        </>
      )
    : t('recommended_shops_title');

  if (loadingImages || !shopData || shopData.length === 0) {
    return (
      <div className={styles['shop-list-container']}>
        <h1 className={styles['shop-list-title']}>{pageTitleContent}</h1>
        {loadingImages ? (
          <div className={styles['loading-message']}>
            {t('loading_images_message')}
            <span className={styles['loading-dot']}>.</span>
            <span className={styles['loading-dot']}>.</span>
            <span className={styles['loading-dot']}>.</span>
          </div>
        ) : (
          <h1 className={styles['no-results-title']}>{t('no_shops_found_message')}</h1>
        )}
        <button className={styles['back-button']} onClick={() => navigate('/')}>
          {t('back_button')}
        </button>
      </div>
    );
  }

  return (
    <div className={styles['shop-list-container']}>
      <h1 className={styles['shop-list-title']}>{pageTitleContent}</h1>
      <div className={styles['shop-cards-grid']}>
        {shopData.map((shop, index) => (
          <div
            key={shop.place_id || index}
            className={styles['shop-card']}
            onClick={() => handleCardClick(shop.place_id)}
          >
            {/* ★ 言語設定に応じて店舗名を動的に表示 */}
            <h2 className={styles['shop-name']}>
              {i18n.language === 'en' && shop.name_en ? shop.name_en : shop.name}
            </h2>
            <div className={styles['rating-container']}>
              {shop.displayDistance && <p className={styles['shop-distance']}>{t('from_here_label')}{shop.displayDistance}</p>}
              {shop.rating && (
              <div className={styles['shop-rating']}>
                ⭐️ {shop.rating.toFixed(1)}
                {shop.user_ratings_total && ` (${shop.user_ratings_total})`}
              </div>
            )}
              {/* ★ 言語設定に応じて住所を動的に表示 */}
              <p>{t('address_label')}: {i18n.language === 'en' && shop.address_en ? shop.address_en : shop.address}</p>
            </div>
            {shop.phone && <p className={styles['shop-phone']}>{t('phone_label')}: {shop.phone}</p>}
            <div className={styles['shop-hours']}>
              <h3>{t('opening_hours_label')}:</h3>
              <p>
                {shop.displayOpeningHours
                 || (shop.opening_hours_periods ? formatOpeningHoursForShopList(shop.opening_hours_periods) : getTodayOpeningHours(shop.opening_hours))}
              </p>
            </div>
            {shop.photo_url || shop.main_photo_url ? (
              <img
                src={shop.photo_url || shop.main_photo_url}
                alt={`${shop.name}の外観`}
                className={styles['shop-photo']}
              />
            ) : (
              <div className={styles['no-image-placeholder']}>{t('no_photo_message')}</div>
            )}

            {shop.Maps_url && (
              <a
                href={shop.Maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles['google-maps-link']}
                onClick={(e) => e.stopPropagation()}
              >
                <RoomIcon className={styles['map-icon']} /> {t('view_on_Maps_link')}
              </a>
            )}
          </div>
        ))}
      </div>
      <button
        className={styles['back-button']}
        onClick={() => navigate('/')}
      >
        {t('back_button')}
      </button>
    </div>
  );
}

export default ShopListPage;