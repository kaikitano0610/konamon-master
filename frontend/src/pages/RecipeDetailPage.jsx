import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // ★ 1. useTranslationをインポート
import styles from './RecipeDetailPage.module.css';

function RecipeDetailPage() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation(); // ★ 2. i18nオブジェクトを取得
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

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

    const fetchRecipeDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`http://localhost:5001/api/recipes/${recipeId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('レシピが見つかりませんでした。');
          }
          throw new Error(`レシピの取得に失敗しました: ${response.statusText}`);
        }

        const data = await response.json();
        setRecipe(data);
      } catch (err) {
        console.error('レシピ詳細の取得中にエラーが発生しました:', err);
        setError(err.message || 'レシピの詳細を読み込めませんでした。');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipeDetail();
  }, [recipeId]);

  const handleDeleteRecipe = async () => {
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
        navigate('/recipes', { state: { message: 'レシピを削除しました！' } });
      } else {
        const errorData = await response.json();
        alert(`レシピの削除に失敗しました: ${errorData.message || response.statusText}`);
      }
    } catch (err) {
      console.error('レシピ削除中にエラーが発生しました:', err);
      alert('サーバーとの通信中にエラーが発生しました。');
    }
  };

  const handleEditRecipe = () => {
    navigate(`/recipes/${recipeId}/edit`);
  };

  if (loading) {
    return (
      <div className={styles['detail-container']}>
        <p className={styles['loading-message']}>レシピを読み込み中... 😋</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['detail-container']}>
        <p className={styles['error-message']}>{error}</p>
        <button onClick={() => navigate('/recipes')} className={styles['back-button']}>
          レシピ一覧に戻る
        </button>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className={styles['detail-container']}>
        <p className={styles['error-message']}>レシピデータがありません。</p>
        <button onClick={() => navigate('/recipes')} className={styles['back-button']}>
          レシピ一覧に戻る
        </button>
      </div>
    );
  }

  const formatDateTime = (isoString) => {
    if (!isoString) return '不明';
    const date = new Date(isoString);
    return date.toLocaleString(i18n.language === 'en' ? 'en-US' : 'ja-JP', { // ★ 3. 日付表示も多言語化
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOwner = currentUserId && String(recipe.user_id) === currentUserId;

  // ★ 4. 表示するテキストを言語に応じて動的に選択する
  const title = i18n.language === 'en' && recipe.title_en ? recipe.title_en : recipe.title;
  const ingredients = i18n.language === 'en' && recipe.ingredients_en ? recipe.ingredients_en : recipe.ingredients;
  const instructions = i18n.language === 'en' && recipe.instructions_en ? recipe.instructions_en : recipe.instructions;

  return (
    <div className={styles['detail-container']}>
      {successMessage && (
        <div className={styles['success-message-banner']}>
          {successMessage}
        </div>
      )}
      <div className={styles['recipe-detail-card']}>
        <h1 className={styles['recipe-title']}>{title}</h1> {/* ★ 5. タイトルを動的に表示 */}

        {isOwner && (
          <div className={styles['action-buttons-container']}>
            <button onClick={handleEditRecipe} className={styles['edit-button']}>
              編集
            </button>
            <button onClick={handleDeleteRecipe} className={styles['delete-button']}>
              削除
            </button>
          </div>
        )}

        {recipe.photo_url && (
          <img src={`http://localhost:5001${recipe.photo_url}`} alt={recipe.title} className={styles['recipe-image']} />
        )}
        {!recipe.photo_url && (
          <div className={styles['no-image-placeholder']}>画像なし</div>
        )}

        <div className={styles['section']}>
          <h2 className={styles['section-title']}>材料</h2>
          <p className={styles['section-content']}>{ingredients}</p> {/* ★ 6. 材料を動的に表示 */}
        </div>

        <div className={styles['section']}>
          <h2 className={styles['section-title']}>作り方</h2>
          <p className={styles['section-content']}>{instructions}</p> {/* ★ 7. 作り方を動的に表示 */}
        </div>

        {recipe.video_url && (
          <div className={styles['section']}>
            <h2 className={styles['section-title']}>動画</h2>
            <div className={styles['video-container']}>
              <iframe
                src={recipe.video_url.includes('youtube.com/watch?v=') ? recipe.video_url.replace("watch?v=", "embed/") : recipe.video_url}
                title="Recipe Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className={styles['recipe-video']}
              ></iframe>
            </div>
          </div>
        )}

        <div className={styles['meta-info']}>
          <p><strong>難易度:</strong> {recipe.difficulty || '不明'}</p>
          <p><strong>準備時間:</strong> {recipe.prep_time_minutes}分</p>
          <p><strong>調理時間:</strong> {recipe.cook_time_minutes}分</p>
          <p><strong>投稿日時:</strong> {formatDateTime(recipe.created_at)}</p>
          {recipe.updated_at && recipe.created_at !== recipe.updated_at && (
            <p><strong>更新日時:</strong> {formatDateTime(recipe.updated_at)}</p>
          )}
          <p className={styles['user-id-text']}>投稿ユーザーID: {recipe.user_id}</p>
        </div>

        <button onClick={() => navigate('/recipes')} className={styles['back-button']}>
          レシピ一覧に戻る
        </button>
      </div>
    </div>
  );
}

export default RecipeDetailPage;