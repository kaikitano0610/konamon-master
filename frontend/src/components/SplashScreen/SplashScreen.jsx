import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

function SplashScreen({ onComplete }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        onComplete(); 
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]); 

  if (!isVisible) {
    return null;
  }

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <h1>AI診断！<br/>大阪粉もんベストマッチ</h1>
      </div>
    </div>
  );
}

export default SplashScreen;