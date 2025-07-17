
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './RecipeListPage.module.css'; 

function RecipeListPage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        setError(null);

        // レシピ一覧の取得には認証が不要なので、トークンはここでは送りません
        const response = await fetch('http://localhost:5001/api/recipes/');

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setRecipes(data);
      } catch (err) {
        console.error('レシピの取得中にエラーが発生しました:', err);
        setError('レシピの読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []); // 空の依存配列でコンポーネトマウント時に一度だけ実行

  const handleRecipeClick = (recipeId) => {
    navigate(`/recipes/${recipeId}`); // レシピ詳細ページへ遷移
  };

  if (loading) {
    return (
      <div className={styles['recipe-list-container']}>
        <p className={styles['loading-message']}>レシピを読み込み中...🍳</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['recipe-list-container']}>
        <p className={styles['error-message']}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles['recipe-list-container']}>
      <h1 className={styles['page-title']}>みんなのレシピ</h1>
      <div className={styles['recipe-cards-grid']}>
        {recipes.length > 0 ? (
          recipes.map((recipe) => (
            <div
              key={recipe.id}
              className={styles['recipe-card']}
              onClick={() => handleRecipeClick(recipe.id)}
            >
              {recipe.photo_url && (
                <img src={recipe.photo_url} alt={recipe.title} className={styles['recipe-image']} />
              )}
              {!recipe.photo_url && (
                <div className={styles['no-image-placeholder']}>画像なし</div>
              )}
              <h2 className={styles['recipe-title']}>{recipe.title}</h2>
              <div className={styles['recipe-meta']}>
                <p>難易度: {recipe.difficulty || '不明'}</p>
                <p>準備時間: {recipe.prep_time_minutes}分</p>
                <p>調理時間: {recipe.cook_time_minutes}分</p>
              </div>
            </div>
          ))
        ) : (
          <p className={styles['no-recipes-message']}>まだレシピがありません。</p>
        )}
      </div>
      {/* ログインしていればレシピ投稿ボタンを表示するなどのロジックを追加可能 */}
      <Link to="/recipes/post" className={styles['add-recipe-button']}>
        レシピを投稿する
      </Link>
    </div>
  );
}

export default RecipeListPage;