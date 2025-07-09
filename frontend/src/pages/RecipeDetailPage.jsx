import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // useParams をインポート
import styles from './RecipeDetailPage.module.css'; // CSS Modules をインポート

function RecipeDetailPage() {
  const { recipeId } = useParams(); // URLから recipeId を取得
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 仮のレシピデータ（実際のAPI呼び出しの代替）
  const hardcodedRecipes = [
    {
      id: 'recipe1',
      user_id: 1,
      title: 'だし醤油風味たこ焼き〜大阪〜',
      ingredients: 'たこ、小麦粉、卵、だし醤油、ねぎ、紅しょうが',
      instructions: '1. 材料を混ぜる。2. たこ焼き器で焼く。3. だし醤油をかける。',
      photo_url: 'https://via.placeholder.com/400x300/FFD700/000000?text=Takoyaki1',
      video_url: null, // 動画がない場合
      difficulty: 'medium',
      prep_time_minutes: 15,
      cook_time_minutes: 20,
    },
    {
      id: 'recipe2',
      user_id: 2,
      title: 'おうちたこ焼き',
      ingredients: 'たこ焼き粉、たこ、キャベツ、卵、水',
      instructions: '1. 粉を溶く。2. 具材を切る。3. たこ焼き器で焼く。',
      photo_url: 'https://via.placeholder.com/400x300/FF6347/FFFFFF?text=Takoyaki2',
      video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', // 仮の動画URL
      difficulty: 'easy',
      prep_time_minutes: 10,
      cook_time_minutes: 15,
    },
    {
      id: 'recipe3',
      user_id: 1,
      title: '米粉たこ焼き',
      ingredients: '米粉、たこ、だし汁、卵',
      instructions: '1. 米粉と卵、だし汁を混ぜる。2. たこ焼き器で焼く。',
      photo_url: 'https://via.placeholder.com/400x300/8A2BE2/FFFFFF?text=Takoyaki3',
      video_url: null,
      difficulty: 'hard',
      prep_time_minutes: 20,
      cook_time_minutes: 25,
    },
    // ... 他のレシピデータも追加
  ];

  useEffect(() => {
    setLoading(true);
    setError(null);

    // URLから取得したrecipeIdに一致するレシピを探す
    const foundRecipe = hardcodedRecipes.find(r => r.id === recipeId);

    // 実際のAPI呼び出しのシミュレーション
    const timer = setTimeout(() => {
      if (foundRecipe) {
        setRecipe(foundRecipe);
      } else {
        setError('お探しのレシピは見つかりませんでした。');
      }
      setLoading(false);
    }, 500); // 0.5秒のロード時間シミュレーション

    return () => clearTimeout(timer); // クリーンアップ
  }, [recipeId]); // recipeId が変わったら再実行

  if (loading) {
    return <div className={styles['detail-page-container']}><p>レシピを読み込み中やで！</p></div>;
  }

  if (error) {
    return <div className={styles['detail-page-container']}><p className={styles['error-message']}>エラー発生: {error}</p></div>;
  }

  if (!recipe) {
    return <div className={styles['detail-page-container']}><p className={styles['not-found-message']}>レシピが見つからへんかったわ...</p></div>;
  }

  return (
    <div className={styles['detail-page-container']}>
      <h1 className={styles['recipe-title']}>{recipe.title}</h1>

      {/* 写真または動画の表示 */}
      {recipe.video_url ? (
        <div className={styles['media-container']}>
          <video controls className={styles['recipe-video']}>
            <source src={recipe.video_url} type="video/mp4" />
            お使いのブラウザは動画をサポートしていません。
          </video>
        </div>
      ) : recipe.photo_url ? (
        <div className={styles['media-container']}>
          <img src={recipe.photo_url} alt={recipe.title} className={styles['recipe-photo']} />
        </div>
      ) : null}
      <div className={styles['recipe-attributes']}>
        <p>難易度: <span className={styles['attribute-value']}>{recipe.difficulty === 'easy' ? '初心者向け' : recipe.difficulty === 'medium' ? '普通' : '達人向け'}</span></p>
        <p>準備時間: <span className={styles['attribute-value']}>{recipe.prep_time_minutes} 分</span></p>
        <p>調理時間: <span className={styles['attribute-value']}>{recipe.cook_time_minutes} 分</span></p>
      </div>

      <div className={styles['recipe-info-section']}>
        <h2 className={styles['section-title']}>材料</h2>
        <p className={styles['recipe-text']}>{recipe.ingredients}</p>
      </div>

      <div className={styles['recipe-info-section']}>
        <h2 className={styles['section-title']}>作り方</h2>
        <p className={styles['recipe-text']}>{recipe.instructions}</p>
      </div>


      {/* 編集ボタンなど */}
      <Link to={`/recipes/${recipe.id}/edit`} className={styles['edit-button']}>レシピを編集</Link>
    </div>
  );
}

export default RecipeDetailPage;