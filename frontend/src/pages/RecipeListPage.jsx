import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import styles from './RecipeListPage.module.css';

function RecipeListPage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null); // ログインユーザーIDを保持するstate
  const [showDropdownForRecipeId, setShowDropdownForRecipeId] = useState(null); // ドロップダウン表示中のレシピID
  const [successMessage, setSuccessMessage] = useState(null); // 成功メッセージ用のstate

  const navigate = useNavigate();
  const location = useLocation(); // useLocationフックを使用

  // 投稿ページや編集ページから渡されたメッセージがあるかチェックし、表示・非表示を管理
  useEffect(() => {
    if (location.state && location.state.message) {
      setSuccessMessage(location.state.message);
      // メッセージを2秒後に非表示にする
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        // メッセージ表示後にURLのstateをクリアする（リロード時にメッセージが再表示されないように）
        navigate(location.pathname, { replace: true, state: {} }); 
      }, 2000);
      return () => clearTimeout(timer); // コンポーネントがアンマウントされたらタイマーをクリア
    }
  }, [location.state, navigate, location.pathname]);

  // レシピ一覧の取得とログインユーザーIDの初期設定
  useEffect(() => {
    // ログインユーザーIDをlocalStorageから取得
    const userId = localStorage.getItem('user_id');
    if (userId) {
      setCurrentUserId(userId);
    }

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
  }, []); // 空の依存配列でコンポーネントマウント時に一度だけ実行

  // レシピカードクリック時の詳細ページへの遷移ハンドラ
  const handleRecipeClick = (recipeId) => {
    navigate(`/recipes/${recipeId}`); // レシピ詳細ページへ遷移
  };

  // 「...」ボタンクリック時のドロップダウン表示/非表示ハンドラ
  const handleEllipsisClick = (e, recipeId) => {
    e.stopPropagation(); // 親要素のクリックイベント（レシピ詳細への遷移）を防ぐ
    setShowDropdownForRecipeId(showDropdownForRecipeId === recipeId ? null : recipeId);
  };

  // ドロップダウンメニュー外をクリックしたときに閉じるためのuseEffect
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdownForRecipeId && !event.target.closest(`.${styles['dropdown-menu-container']}`)) {
        setShowDropdownForRecipeId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDropdownForRecipeId]);

  // レシピ削除ハンドラ
  const handleDeleteRecipe = async (e, recipeId) => {
    e.stopPropagation(); // 親要素のクリックイベントを防ぐ
    if (!window.confirm('本当にこのレシピを削除しますか？')) {
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('ログインが必要です。');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('レシピが正常に削除されました。');
        // 削除されたレシピをリストから除外してUIを更新
        setRecipes(prevRecipes => prevRecipes.filter(recipe => recipe.id !== recipeId));
        setShowDropdownForRecipeId(null); // ドロップダウンを閉じる
      } else {
        const errorData = await response.json();
        alert(`レシピの削除に失敗しました: ${errorData.message || response.statusText}`);
      }
    } catch (err) {
      console.error('レシピ削除中にエラーが発生しました:', err);
      alert('サーバーとの通信中にエラーが発生しました。');
    }
  };

  // レシピ編集ハンドラ（編集ページへの遷移）
  const handleEditRecipe = (e, recipeId) => {
    e.stopPropagation(); // 親要素のクリックイベントを防ぐ
    navigate(`/recipes/${recipeId}/edit`); // 編集ページへ遷移
    setShowDropdownForRecipeId(null); // ドロップダウンを閉じる
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
      {/* 成功メッセージの表示 */}
      {successMessage && (
        <div className={styles['success-message-banner']}>
          {successMessage}
        </div>
      )}
      <div className={styles['recipe-cards-grid']}>
        {recipes.length > 0 ? (
          recipes.map((recipe) => (
            <div
              key={recipe.id}
              className={styles['recipe-card']}
              onClick={() => handleRecipeClick(recipe.id)}
            >
              {/* 「...」ボタンのコンテナ（ログインユーザーの投稿のみ表示） */}
              {currentUserId && String(recipe.user_id) === currentUserId && (
                <div className={styles['dropdown-menu-container']}>
                  <button 
                    className={styles['ellipsis-button']} 
                    onClick={(e) => handleEllipsisClick(e, recipe.id)}
                  >
                    ...
                  </button>
                  {showDropdownForRecipeId === recipe.id && (
                    <div className={styles['dropdown-menu']}>
                      <button 
                        className={styles['dropdown-item']} 
                        onClick={(e) => handleDeleteRecipe(e, recipe.id)}
                      >
                        削除
                      </button>
                      <button 
                        className={styles['dropdown-item']} 
                        onClick={(e) => handleEditRecipe(e, recipe.id)}
                      >
                        編集
                      </button>
                    </div>
                  )}
                </div>
              )}

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
      <Link to="/recipes/post" className={styles['add-recipe-button']}>
        レシピを投稿する
      </Link>
    </div>
  );
}

export default RecipeListPage;