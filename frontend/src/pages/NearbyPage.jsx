import React, { useState, useEffect } from 'react';
import styles from './NearbyPage.module.css';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // ★ useTranslationをインポート

function NearbyPage() {
  const { t, i18n } = useTranslation(); // ★ t関数とi18nオブジェクトを取得
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedFoodType, setSelectedFoodType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance.toFixed(1);
  };

  const formatOpeningHours = (periods) => {
    if (!periods || periods.length === 0) {
      return t('opening_hours_unknown');
    }

    const daysOfWeek = [t('day_sun'), t('day_mon'), t('day_tue'), t('day_wed'), t('day_thu'), t('day_fri'), t('day_sat')];
    const now = new Date();
    const today = now.getDay();

    const todayPeriods = periods.filter(p => p.open.day === today);

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

  const handleFoodTypeSelect = (type) => {
    setSelectedFoodType(type);
    setStep(1);
  };

  useEffect(() => {
    if (step === 1 && selectedFoodType) {
      setLoading(true);
      setError(null);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const userPos = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setCurrentLocation(userPos);

            try {
              // ★ APIリクエストに現在の言語を渡す
              const apiUrl = `http://localhost:5001/api/nearby?food_type=${selectedFoodType}&lat=${userPos.latitude}&lng=${userPos.longitude}&lang=${i18n.language}`;
              const response = await fetch(apiUrl);

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
              }

              const data = await response.json();
              
              const shopsWithAdditionalInfo = data.map(shop => {
                const distance = calculateDistance(
                  userPos.latitude,
                  userPos.longitude,
                  shop.latitude,
                  shop.longitude
                );
                const displayHours = formatOpeningHours(shop.opening_hours_periods);

                return {
                  ...shop,
                  displayDistance: `${distance} ${t('km_unit')}`,
                  rawDistance: parseFloat(distance),
                  displayOpeningHours: displayHours,
                };
              });

              shopsWithAdditionalInfo.sort((a, b) => a.rawDistance - b.rawDistance);

              navigate('/nearby/list', {
                state: {
                  shopData: shopsWithAdditionalInfo,
                  fromNearby: true,
                  foodType: selectedFoodType
                }
              });

            } catch (err) {
              console.error("周辺店舗の取得中にエラーが発生しました:", err);
              setError(t('search_shops_failed_message', { error: err.message || t('unknown_error') }));
              setLoading(false);
            }

          },
          (geoError) => {
            console.error("Geolocation error:", geoError);
            setError(t('geolocation_failed_message'));
            setLoading(false);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        setError(t('geolocation_not_supported_message'));
        setLoading(false);
      }
    } else if (step === 0) {
      setLoading(false);
    }
  }, [step, selectedFoodType, navigate, t, i18n.language]); // i18n.language も依存配列に追加

  if (step === 1 && loading) {
    return (
      <div className={styles['nearby-page-container']}>
        <div className={styles['shop-list-section']}>
          <h1 className={styles['shop-list-title']}>{selectedFoodType}<br></br>{t('open_shops_nearby_title')}</h1>
          <div className={styles['loading-message']}>
            {t('searching_shops_message')}
            <span className={styles['loading-dot']}>.</span>
            <span className={styles['loading-dot']}>.</span>
            <span className={styles['loading-dot']}>.</span>
          </div>
        </div>
      </div>
    );
  }

  if (step === 1 && error) {
    return (
      <div className={styles['nearby-page-container']}>
        <div className={styles['shop-list-section']}>
          <h1 className={styles['shop-list-title']}>{t('nearby_open_shops_title', { food_type: selectedFoodType })}</h1>
          <div className={styles['error-message']}>{t('error_occurred_message')}: {error}</div>
          <button className={styles['back-button']} onClick={() => navigate('/')}>
            {t('back_to_home_button')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['nearby-page-container']}>
      {step === 0 && (
        <div className={styles['food-select-section']}>
          <div className={styles["dialog-bubble"]}>
            <p className={styles["takoyan-dialog-text"]}>{t('nearby_dialog_1')}</p>
            <p className={styles["takoyan-dialog-text"]}>{t('nearby_dialog_2')}</p>
          </div>
          <div className="takoyan-icon"></div>
          <h1 className={styles['food-select-title']}>{t('food_select_title')}</h1>
          <div className={styles['food-select-buttons']}>
            <button
              className={`${styles['food-button']} ${styles['okonomiyaki-button']}`}
              onClick={() => handleFoodTypeSelect('お好み焼き')}
            >
              {t('okonomiyaki_button')}
            </button>
            <button
              className={`${styles['food-button']} ${styles['takoyaki-button']}`}
              onClick={() => handleFoodTypeSelect('たこ焼き')}
            >
              {t('takoyaki_button')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NearbyPage;