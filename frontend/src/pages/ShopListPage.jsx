import React, { useState, useEffect, useRef } from 'react'; // useRef を追加
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './ShopListPage.module.css';
import RoomIcon from '@mui/icons-material/Room';

function ShopListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { shopData, fromNearby, foodType } = location.state || { shopData: [] };

  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadingImages, setLoadingImages] = useState(true);
  const [hasImageLoadErrors, setHasImageLoadErrors] = useState(false); // 画像読み込みエラーがあったかどうか

  // timeoutId を useRef で保持
  const timeoutIdRef = useRef(null);

  const handleCardClick = (placeId) => {
    navigate(`/shops/${placeId}`, { state: { prevPath: location.pathname, shopData: shopData } });
  };

  const getTodayOpeningHours = (openingHours) => {
    if (!openingHours || !Array.isArray(openingHours) || openingHours.length === 0) {
      return '営業時間不明';
    }

    const daysOfWeek = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
    const date = new Date();
    const todayIndex = date.getDay();
    const todayDayOfWeek = daysOfWeek[todayIndex];

    const todayHours = openingHours.find(hour => hour.startsWith(todayDayOfWeek));
    const hoursText = todayHours ? todayHours.split(': ')[1] : '本日は定休日、または営業時間不明';

    return hoursText;
  };

  const formatOpeningHoursForShopList = (periods) => {
    if (!periods || !Array.isArray(periods) || periods.length === 0) {
      return "営業時間不明";
    }
    const daysOfWeek = ["日", "月", "火", "水", "木", "金", "土"];
    const now = new Date();
    const today = now.getDay();

    const todayPeriods = periods.filter(p => p.open && p.open.day === today);

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

  // 画像の読み込みを監視するuseEffect
  useEffect(() => {
    if (shopData && shopData.length > 0) {
      setLoadingImages(true); // 新しいデータが来たらローディングを開始
      setImagesLoaded(false); // 画像がまだロードされていない状態にリセット
      setHasImageLoadErrors(false); // エラー状態もリセット

      const imagesToProcess = shopData.filter(shop => shop.photo_url || shop.main_photo_url);
      
      if (imagesToProcess.length === 0) { // 画像URLがない場合はすぐに読み込み完了
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
            console.warn(`画像の読み込みに失敗しました: ${img.src}`);
            setHasImageLoadErrors(true); // エラーがあったことを記録
            resolve(); // 失敗してもPromiseは解決し、Promise.allSettledをブロックしない
          };
        });
      });

      // Promise.allSettled が成功/失敗にかかわらず完了したら、状態を更新
      Promise.allSettled(imagePromises).then(() => {
        setImagesLoaded(true);
        setLoadingImages(false);
        // Promise.allSettledが完了した時点でタイムアウトタイマーがあればクリアする
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null; // クリアしたらnullに戻す
        }
      });

      // タイムアウト設定 (5秒後には画像読み込みを完了とみなす)
      timeoutIdRef.current = setTimeout(() => {
        // Promise.allSettledがまだ完了していない場合にのみ強制終了
        // imagesLoadedがfalseの場合にのみ発動するが、Promise.allSettledがすでに完了していれば
        // setImagesLoaded(true)が呼ばれているので、このisMounted.currentチェックが有効に働く
        console.warn("画像読み込みがタイムアウトしました。");
        setImagesLoaded(true); // 強制的にロード完了状態へ
        setLoadingImages(false); // ローディングを停止
        timeoutIdRef.current = null; // タイマーをクリアしたことを示す
      }, 5000);

      // クリーンアップ関数
      return () => {
        // コンポーネントがアンマウントされるか、useEffectが再実行されるときにタイマーをクリア
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
      };
    } else {
      // shopDataがない場合はローディングをすぐに終了
      setImagesLoaded(true);
      setLoadingImages(false);
    }
  }, [shopData]); // 依存配列はshopDataのみ

  const pageTitleContent = fromNearby
    ? (
        <>
          <span>{foodType || '不明'}の</span>
          <br />
          <span>営業中のお店</span>
        </>
      )
    : 'おすすめのお店やで！';

  if (loadingImages || !shopData || shopData.length === 0) {
    return (
      <div className={styles['shop-list-container']}>
        <h1 className={styles['shop-list-title']}>{pageTitleContent}</h1>
        {loadingImages ? (
          <div className={styles['loading-message']}>
            お店の画像を読み込み中やで！
            <span className={styles['loading-dot']}>.</span>
            <span className={styles['loading-dot']}>.</span>
            <span className={styles['loading-dot']}>.</span>
          </div>
        ) : (
          <h1 className={styles['no-results-title']}>お店が見つかりませんでした…🐙</h1>
        )}
        <button className={styles['back-button']} onClick={() => navigate('/')}>
          戻る
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
            <h2 className={styles['shop-name']}>{shop.name}</h2>
            <div className={styles['rating-container']}>
              {shop.displayDistance && <p className={styles['shop-distance']}>ここから{shop.displayDistance}</p>}
              {shop.rating && (
              <div className={styles['shop-rating']}>
                ⭐️ {shop.rating.toFixed(1)}
                {shop.user_ratings_total && ` (${shop.user_ratings_total})`}
              </div>
            )}
              住所: {shop.address}
            </div>
            {shop.phone && <p className={styles['shop-phone']}>電話: {shop.phone}</p>}
            <div className={styles['shop-hours']}>
              <h3>営業時間:</h3>
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
              <div className={styles['no-image-placeholder']}>画像なし</div>
            )}

            {shop.Maps_url && (
              <a
                href={shop.Maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles['google-maps-link']}
                onClick={(e) => e.stopPropagation()}
              >
                <RoomIcon className={styles['map-icon']} /> Google マップで見る
              </a>
            )}
          </div>
        ))}
      </div>
      <button
        className={styles['back-button']}
        onClick={() => navigate('/')}
      >
        戻る
      </button>
    </div>
  );
}

export default ShopListPage;