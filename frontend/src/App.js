import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

import SplashScreen from './components/SplashScreen/SplashScreen';
import Navbar from './components/Navbar/Navbar';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SigninPage from './pages/SigninPage';
import NearbyPage from './pages/NearbyPage';
import RecommendPage from './pages/RecommendPage';
import ShopDetailPage from './pages/ShopDetailPage';
import RecipeListPage from './pages/RecipeListPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import RecipeEditPage from './pages/RecipeEditPage';
import RecipePostPage from './pages/RecipePostPage';
import ConfigPage from './pages/ConfigPage';
import NotFoundPage from './pages/NotFoundPage';
import ShopListPage from './pages/ShopListPage';

function App() {

  const [showSplash, setShowSplash] = useState(
    sessionStorage.getItem('hasSeenSplash') !== 'true' 
  );

  useEffect(() => {
    if (!showSplash) {
      sessionStorage.setItem('hasSeenSplash', 'true');
    }
  }, [showSplash]);


  return (
    <Router>
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}
      <div>
        <Navbar />
        <div className='contentWrapper'>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signin" element={<SigninPage />} />
          <Route path="/nearby" element={<NearbyPage />} />
          <Route path="/recommend" element={<RecommendPage />} />
          <Route path="/recommend/list" element={<ShopListPage />} />
          <Route path="/shops/:placeId" element={<ShopDetailPage />} />
          <Route path="/recipes" element={<RecipeListPage />} />
          <Route path="/recipes/post" element={<RecipePostPage />} />
          <Route path="/recipes/:recipeId/edit" element={<RecipeEditPage />} />
          <Route path="/recipes/:recipeId" element={<RecipeDetailPage />} />
          <Route path="/config" element={<ConfigPage />} />
          {/* どのルートにもマッチしない場合（404ページ） */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
