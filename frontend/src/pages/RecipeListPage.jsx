import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './RecipeListPage.module.css'; // CSS Modules をインポート

function RecipeListPage() {
  const navigate = useNavigate();

  // 仮のレシピデータ（APIから取得するまでの代替）
  const [recipes, setRecipes] = useState([
    {
      id: 'recipe1',
      title: 'だし醤油風味たこ焼き〜大阪〜',
      photoUrl: 'https://via.placeholder.com/60?text=Img1', // 仮の画像URL
    },
    {
      id: 'recipe2',
      title: 'おうちたこ焼き',
      photoUrl: 'https://via.placeholder.com/60?text=Img2',
    },
    {
      id: 'recipe3',
      title: '米粉たこ焼き',
      photoUrl: 'https://via.placeholder.com/60?text=Img3',
    },
    {
      id: 'recipe4',
      title: 'エビアボカドチーズのたこ焼き',
      photoUrl: 'https://via.placeholder.com/60?text=Img4',
    },
    {
      id: 'recipe5',
      title: 'たこなしタコ焼き',
      photoUrl: 'https://via.placeholder.com/60?text=Img5',
    },
    {
      id: 'recipe6',
      title: 'ふわとろお好み焼き',
      photoUrl: 'https://via.placeholder.com/60?text=Img6',
    },
  ]);

  // 「レシピを追加する」ボタンのハンドラ
  const handleAddRecipeClick = () => {
    navigate('/recipes/post'); // レシピ投稿画面へ遷移
  };

  // 「もっと見る」ボタンのハンドラ (現状は仮の動作)
  const handleLoadMoreClick = () => {
    console.log("もっと見るボタンがクリックされました。");
    // ここでAPIから追加データを取得するロジックを実装
    // 例: setRecipes([...recipes, ...newData]);
  };

  return (
    <div className={styles['recipe-list-page-container']}>
      <h1 className={styles['page-title']}>レシピ投稿一覧</h1>

      <button className={styles['add-recipe-button']} onClick={handleAddRecipeClick}>
        レシピを追加する
      </button>

      {recipes.length === 0 ? (
        <p className={styles['no-recipes-message']}>まだレシピが投稿されていません。</p>
      ) : (
        <ul className={styles['recipe-list']}>
          {recipes.map((recipe) => (
            <li key={recipe.id} className={styles['recipe-item']}>
              {/* レシピ項目全体が詳細画面へのリンクになる */}
              <Link to={`/recipes/${recipe.id}`} className={styles['recipe-link']}>
                <span className={styles['recipe-title']}>{recipe.title}</span>
                <img src={recipe.photoUrl} alt={recipe.title} className={styles['recipe-photo']} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <button className={styles['load-more-button']} onClick={handleLoadMoreClick}>
        もっと見る
      </button>
    </div>
  );
}

export default RecipeListPage;