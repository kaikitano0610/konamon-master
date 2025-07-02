import React, { useState, useEffect } from 'react';
import styles from './NearbyPage.module.css';
import { useLocation } from 'react-router-dom';

function NearbyPage() {
  const location = useLocation();

  const [step, setStep] = useState(0);
  const [selectedFoodType, setSelectedFoodType] = useState(null); 

  const handleFoodTypeSelect = (type) => {
    setSelectedFoodType(type);
    setStep(1);
  };

  const [currentLocation, setCurrentLocation] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hardcodedApiShops = [
    {
      place_id: 'place1',
      name: '本場のたこ焼き屋 A',
      address: '大阪府大阪市中央区道頓堀1-1-1',
      latitude: 34.6687,
      longitude: 135.5026,
      Maps_url: 'https://maps.app.goo.gl/dummy-takoyaki-A',
      user_ratings_total: 1200,
      rating: 4.2,
      main_photo_url: 'https://via.placeholder.com/150/FFD700/000000?text=TakoyakiA',
      opening_hours_periods: [
        { "close": { "day": 0, "time": "1400" }, "open": { "day": 0, "time": "1130" } }, // 日曜午前
        { "close": { "day": 1, "time": "0300" }, "open": { "day": 0, "time": "1700" } }, // 日曜夜〜月曜早朝
        { "close": { "day": 1, "time": "2200" }, "open": { "day": 1, "time": "1100" } }, // 月曜
        { "close": { "day": 2, "time": "2200" }, "open": { "day": 2, "time": "1100" } }, // 火曜
        { "close": { "day": 3, "time": "2200" }, "open": { "day": 3, "time": "1100" } }, // 水曜
        { "close": { "day": 4, "time": "2300" }, "open": { "day": 4, "time": "1100" } }, // 木曜
        { "close": { "day": 5, "time": "2300" }, "open": { "day": 5, "time": "1100" } }, // 金曜
        { "close": { "day": 6, "time": "2330" }, "open": { "day": 6, "time": "1000" } }, // 土曜
      ],
      food_type: 'たこ焼き',
    },
    {
      place_id: 'place2',
      name: '絶品お好み焼き B',
      address: '大阪府大阪市北区梅田3-1-1',
      latitude: 34.7022,
      longitude: 135.4958,
      Maps_url: 'https://maps.app.goo.gl/dummy-okonomi-B',
      user_ratings_total: 800,
      rating: 4.5,
      main_photo_url: 'https://via.placeholder.com/150/FF6347/FFFFFF?text=OkonomiB',
      opening_hours_periods: [
        { "close": { "day": 0, "time": "2100" }, "open": { "day": 0, "time": "1000" } },
        { "close": { "day": 1, "time": "2200" }, "open": { "day": 1, "time": "1000" } },
        { "close": { "day": 2, "time": "2200" }, "open": { "day": 2, "time": "1000" } },
        { "close": { "day": 3, "time": "2200" }, "open": { "day": 3, "time": "1000" } },
        { "close": { "day": 4, "time": "2300" }, "open": { "day": 4, "time": "1000" } },
        { "close": { "day": 5, "time": "2300" }, "open": { "day": 5, "time": "1000" } },
        { "close": { "day": 6, "time": "2300" }, "open": { "day": 6, "time": "1000" } },
      ],
      food_type: 'お好み焼き',
    },
    {
      place_id: 'place3',
      name: '秘伝のたこ焼き C',
      address: '大阪府大阪市淀川区宮原1-1-1',
      latitude: 34.7335,
      longitude: 135.5005,
      Maps_url: 'https://maps.app.goo.gl/dummy-takoyaki-C',
      user_ratings_total: 50,
      rating: 3.8,
      main_photo_url: 'https://via.placeholder.com/150/8A2BE2/FFFFFF?text=TakoyakiC',
      opening_hours_periods: [], 
      food_type: 'たこ焼き',
    },
    {
      place_id: 'place4',
      name: 'まったりお好み焼き D',
      address: '大阪府大阪市淀川区宮原1-2-3',
      latitude: 34.7340,
      longitude: 135.5010,
      Maps_url: 'https://maps.app.goo.gl/dummy-okonomi-D',
      user_ratings_total: 100,
      rating: 4.0,
      main_photo_url: 'https://via.placeholder.com/150/00FFFF/000000?text=OkonomiD',
      opening_hours_periods: [
          { "close": { "day": 0, "time": "2100" }, "open": { "day": 0, "time": "1000" } },
          { "close": { "day": 1, "time": "2100" }, "open": { "day": 1, "time": "1000" } },
          { "close": { "day": 2, "time": "2100" }, "open": { "day": 2, "time": "1000" } },
          { "close": { "day": 3, "time": "2100" }, "open": { "day": 3, "time": "1000" } },
          { "close": { "day": 4, "time": "2200" }, "open": { "day": 4, "time": "1000" } },
          { "close": { "day": 5, "time": "2200" }, "open": { "day": 5, "time": "1000" } },
          { "close": { "day": 6, "time": "2200" }, "open": { "day": 6, "time": "1000" } },
      ],
      food_type: 'お好み焼き',
    },
  ];

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
      return "営業時間不明";
    }

    const daysOfWeek = ["日", "月", "火", "水", "木", "金", "土"];
    const now = new Date(); 
    const today = now.getDay(); 

    const todayPeriods = periods.filter(p => p.open.day === today);

    if (todayPeriods.length === 0) {
      return "本日定休日 / 営業時間不明";
    }

    const displayStrings = [];
    todayPeriods.forEach(p => {
      const openTime = `${p.open.time.substring(0, 2)}:${p.open.time.substring(2, 4)}`;
      const closeTime = `${p.close.time.substring(0, 2)}:${p.close.time.substring(2, 4)}`;
      
      if (p.open.day !== p.close.day) { 
         displayStrings.push(`${openTime}〜翌${daysOfWeek[p.close.day]}${closeTime}`);
      } else {
         displayStrings.push(`${openTime}〜${closeTime}`);
      }
    });
    
    return `今日 (${daysOfWeek[today]}): ${displayStrings.join(' / ')}`;
  };


  useEffect(() => {
    if (step === 1 && selectedFoodType) {
      setLoading(true);
      setError(null);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userPos = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setCurrentLocation(userPos);

            const filteredShops = hardcodedApiShops.filter(shop =>
              shop.food_type === selectedFoodType
            );

            const shopsWithDistanceAndHours = filteredShops.map(shop => {
              const distance = calculateDistance(
                userPos.latitude,
                userPos.longitude,
                shop.latitude,
                shop.longitude
              );
              const displayHours = formatOpeningHours(shop.opening_hours_periods);

              return {
                ...shop,
                displayDistance: `${distance} km`,
                rawDistance: distance,
                displayOpeningHours: displayHours,
              };
            });
            
            shopsWithDistanceAndHours.sort((a, b) => a.rawDistance - b.rawDistance);

            setShops(shopsWithDistanceAndHours);
            setLoading(false);

          },
          (geoError) => {
            console.error("Geolocation error:", geoError);
            setError("位置情報の取得に失敗しました。周辺店舗を表示できません。");
            setLoading(false);
            setShops(hardcodedApiShops.filter(shop => shop.food_type === selectedFoodType));
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        setError("お使いのブラウザは位置情報サービスをサポートしていません。");
        setLoading(false);
        setShops(hardcodedApiShops.filter(shop => shop.food_type === selectedFoodType));
      }
    } else if (step === 0) {
      setLoading(false);
    }
  }, [step, selectedFoodType, location.search]);

  return (
    <div className={styles['nearby-page-container']}>
      {step === 0 && (
        <div className={styles['food-select-section']}>
          <div className="takoyan-icon"></div>
          <h1 className={styles['food-select-title']}>粉もん選択</h1>
          <div className={styles['food-select-buttons']}>
            <button
              className={`${styles['food-button']} ${styles['okonomiyaki-button']}`}
              onClick={() => handleFoodTypeSelect('お好み焼き')}
            >
              お好み焼き
            </button>
            <button
              className={`${styles['food-button']} ${styles['takoyaki-button']}`}
              onClick={() => handleFoodTypeSelect('たこ焼き')}
            >
              たこ焼き
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className={styles['shop-list-section']}>
          <h1 className={styles['page-title']}>近くの開いているお店 ({selectedFoodType})</h1>
          {loading ? (
            <div className={styles['loading-message']}>お店を探し中やで！</div>
          ) : error ? (
            <div className={styles['error-message']}>エラー発生: {error}</div>
          ) : shops.length === 0 ? (
            <p className={styles['no-shops-message']}>周辺に開いているお店が見つかりませんでした。</p>
          ) : (
            <ul className={styles['shop-list']}>
              {shops.map((shop) => (
                <li key={shop.place_id} className={styles['shop-card']}>
                  <img src={shop.main_photo_url} alt={shop.name} className={styles['shop-image']} />
                  <div className={styles['shop-info']}>
                    <h2 className={styles['shop-name']}>{shop.name}</h2>
                    <p className={styles['shop-distance']}>{shop.displayDistance}</p>
                    <p className={styles['shop-address']}>{shop.address}</p>
                    <p className={styles['shop-hours']}>営業時間: {shop.displayOpeningHours}</p>
                    {shop.Maps_url && (
                      <a href={shop.Maps_url} target="_blank" rel="noopener noreferrer" className={styles['google-maps-link']}>
                        Google マップで見る
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default NearbyPage;