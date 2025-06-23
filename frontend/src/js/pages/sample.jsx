import React, { useState, useEffect } from 'react';
import '../../css/pages/sample.css'; 

function Sample() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/shops/');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setShops(data);
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  if (loading) {
    return <div className="container">データを読み込み中...</div>;
  }

  if (error) {
    return <div className="container error">データの読み込みに失敗しました: {error.message}</div>;
  }

  return (
    <div className="container">
      <h1>おすすめ店舗リスト</h1>
      {shops.length === 0 ? (
        <p>表示する店舗がありません。</p>
      ) : (
        <div className="shop-list">
          {shops.map(shop => (
            <div key={shop.id} className="shop-card">
              <h2>{shop.name}</h2>
              <p>id:{shop.id}</p>
              <p><strong>混雑状況:</strong> <span className={`status-${shop.congestion_status.replace(' ', '')}`}>{shop.congestion_status}</span></p>
              <p><strong>おすすめ理由:</strong> {shop.recommended_reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Sample;