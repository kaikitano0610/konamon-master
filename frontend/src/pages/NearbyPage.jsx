import React, { useState, useEffect } from 'react';
import styles from './NearbyPage.module.css';
import { useNavigate } from 'react-router-dom'; // useLocation は不要になる

function NearbyPage() {
  const navigate = useNavigate(); // useNavigate を初期化

  const [step, setStep] = useState(0);
  const [selectedFoodType, setSelectedFoodType] = useState(null); 

  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // 地球の半径（km）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance.toFixed(1); // 小数点以下1桁に丸める
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

  const handleFoodTypeSelect = (type) => {
    setSelectedFoodType(type);
    setStep(1);
    // ここでAPI呼び出しを開始
  };

  useEffect(() => {
    if (step === 1 && selectedFoodType) {
      setLoading(true);
      setError(null);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const userPos = {
              latitude:34.68477, //position.coords.latitude,
              longitude:135.505971  //position.coords.longitude,
            };
            setCurrentLocation(userPos);

            try {
              const apiUrl = `http://localhost:5001/api/nearby?food_type=${selectedFoodType}&lat=${userPos.latitude}&lng=${userPos.longitude}`;
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
                  displayDistance: `${distance} km`,
                  rawDistance: parseFloat(distance),
                  displayOpeningHours: displayHours,
                };
              });

              shopsWithAdditionalInfo.sort((a, b) => a.rawDistance - b.rawDistance);

              // ★ShopListPageにデータを渡し、遷移する★
              navigate('/nearby/list', { 
                state: { 
                  shopData: shopsWithAdditionalInfo,
                  fromNearby: true, // NearbyPageから来たことを示すフラグ
                  foodType: selectedFoodType // 表示するフードタイプも渡す
                } 
              });

            } catch (err) {
              console.error("周辺店舗の取得中にエラーが発生しました:", err);
              setError(`お店の検索に失敗しました: ${err.message || '不明なエラー'}`);
              setLoading(false);
              // エラーが発生した場合はステップ1に留まるが、店舗リストはクリア
              // setShops([]); // ここではもうshopsをセットしないので不要
            }

          },
          (geoError) => {
            console.error("Geolocation error:", geoError);
            setError("位置情報の取得に失敗しました。周辺店舗を表示できません。");
            setLoading(false);
            // setShops([]); // ここではもうshopsをセットしないので不要
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        setError("お使いのブラウザは位置情報サービスをサポートしていません。");
        setLoading(false);
        // setShops([]); // ここではもうshopsをセットしないので不要
      }
    } else if (step === 0) {
      setLoading(false);
    }
  }, [step, selectedFoodType, navigate]); // navigate を依存配列に追加

  // ステップ1のコンテンツはShopListPageに移動するため、ここでは表示しない
  // ローディングとエラー表示はNearbyPageで行う
  if (step === 1 && loading) {
    return (
      <div className={styles['nearby-page-container']}>
        <div className={styles['shop-list-section']}>
          <h1 className={styles['shop-list-title']}>{selectedFoodType}の<br></br>営業中のお店</h1>
          {/* ★修正: ローディングメッセージのテキストと構造を変更★ */}
          <div className={styles['loading-message']}>
            お店を探し中やで！
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
        <div className={styles['shop-list-section']}> {/* スタイルを合わせるため */}
          <h1 className={styles['shop-list-title']}>近くの開いているお店 ({selectedFoodType})</h1>
          <div className={styles['error-message']}>エラー発生: {error}</div>
          {/* エラー時も戻るボタンはホームへ */}
          <button className={styles['back-button']} onClick={() => navigate('/')}>
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['nearby-page-container']}>
      {/* ステップ0のコンテンツはそのまま */}
      {step === 0 && (
        <div className={styles['food-select-section']}>
          <div className={styles["dialog-bubble"]}>
            <p className={styles["takoyan-dialog-text"]}>ほな、近所のお店から探そか！</p>
            <p className={styles["takoyan-dialog-text"]}>どっちを探しましょ？</p>
          </div>
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
      {/* step === 1 のレンダリングは削除。ShopListPage に遷移する */}
    </div>
  );
}

export default NearbyPage;