import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // ★ useTranslationをインポート
import styles from './RecipeListPage.module.css';

function RecipeListPage() {
  const { t, i18n } = useTranslation(); // ★ t関数とi18nオブジェクトを取得
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showDropdownForRecipeId, setShowDropdownForRecipeId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.message) {
      setSuccessMessage(location.state.message);
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        navigate(location.pathname, { replace: true, state: {} });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (userId) {
      setCurrentUserId(userId);
    }

    const fetchRecipes = async () => {
      try {
        setLoading(true);
        setError(null);

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
  }, []);

  const handleRecipeClick = (recipeId) => {
    navigate(`/recipes/${recipeId}`);
  };

  const handleEllipsisClick = (e, recipeId) => {
    e.stopPropagation();
    setShowDropdownForRecipeId(showDropdownForRecipeId === recipeId ? null : recipeId);
  };

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

  const handleDeleteRecipe = async (e, recipeId) => {
    e.stopPropagation();
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
        setRecipes(prevRecipes => prevRecipes.filter(recipe => recipe.id !== recipeId));
        setShowDropdownForRecipeId(null);
      } else {
        const errorData = await response.json();
        alert(`レシピの削除に失敗しました: ${errorData.message || response.statusText}`);
      }
    } catch (err) {
      console.error('レシピ削除中にエラーが発生しました:', err);
      alert('サーバーとの通信中にエラーが発生しました。');
    }
  };

  const handleEditRecipe = (e, recipeId) => {
    e.stopPropagation();
    navigate(`/recipes/${recipeId}/edit`);
    setShowDropdownForRecipeId(null);
  };

  if (loading) {
    return (
      <div className={styles['recipe-list-container']}>
        <p className={styles['loading-message']}>
          {t('loading_recipes')} {/* ★ 翻訳キーを使用 */}
        </p>
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
      <h1 className={styles['page-title']}>
        {t('all_recipes_title')} {/* ★ 翻訳キーを使用 */}
      </h1>
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
                        {t('delete_button')} {/* ★ 翻訳キーを使用 */}
                      </button>
                      <button
                        className={styles['dropdown-item']}
                        onClick={(e) => handleEditRecipe(e, recipe.id)}
                      >
                        {t('edit_button')} {/* ★ 翻訳キーを使用 */}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {recipe.photo_url && (
                <img src={recipe.photo_url} alt={recipe.title} className={styles['recipe-image']} />
              )}
              {!recipe.photo_url && (
                <div className={styles['no-image-placeholder']}>
                  {t('no_image_placeholder')} {/* ★ 翻訳キーを使用 */}
                </div>
              )}
              <h2 className={styles['recipe-title']}>
                {/* ★ 言語設定に応じてタイトルを動的に表示 */}
                {i18n.language === 'en' && recipe.title_en ? recipe.title_en : recipe.title}
              </h2>
              <div className={styles['recipe-meta']}>
                <p>
                  {t('difficulty_label')}: {recipe.difficulty || t('unknown')}
                </p>
                <p>
                  {t('prep_time_label')}: {recipe.prep_time_minutes}{t('minutes_unit')}
                </p>
                <p>
                  {t('cook_time_label')}: {recipe.cook_time_minutes}{t('minutes_unit')}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className={styles['no-recipes-message']}>
            {t('no_recipes_found')} {/* ★ 翻訳キーを使用 */}
          </p>
        )}
      </div>
      <Link to="/recipes/post" className={styles['add-recipe-button']}>
        {t('add_recipe_button')} {/* ★ 翻訳キーを使用 */}
      </Link>
    </div>
  );
}

export default RecipeListPage;
