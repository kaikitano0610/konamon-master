import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './RecipeEditPage.module.css'; // 既存の投稿ページのCSSを流用

function RecipeEditPage() {
  const { recipeId } = useParams();
  const navigate = useNavigate();

  const [recipeData, setRecipeData] = useState({
    title: '',
    ingredients: '',
    instructions: '',
    difficulty: '',
    prep_time_minutes: '',
    cook_time_minutes: '',
    video_url: '',
    photo_url: '',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [selectedNewImageFile, setSelectedNewImageFile] = useState(null); // 新しく選択された画像ファイル
  const [newImagePreviewUrl, setNewImagePreviewUrl] = useState(null); // 新しい画像プレビューURL

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        setError(null);
        setMessage('');

        const token = localStorage.getItem('access_token');
        if (!token) {
          setMessage('ログインが必要です。');
          navigate('/login');
          return;
        }

        const response = await fetch(`http://localhost:5001/api/recipes/${recipeId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('編集対象のレシピが見つかりませんでした。');
          }
          throw new Error(`レシピデータの取得に失敗しました: ${response.statusText}`);
        }

        const data = await response.json();
        setRecipeData({
          title: data.title || '',
          ingredients: data.ingredients || '',
          instructions: data.instructions || '',
          difficulty: data.difficulty || '',
          prep_time_minutes: data.prep_time_minutes || '',
          cook_time_minutes: data.cook_time_minutes || '',
          video_url: data.video_url || '',
          photo_url: data.photo_url || '',
        });
      } catch (err) {
        console.error('レシピデータの取得中にエラーが発生しました:', err);
        setError(err.message || 'レシピの読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRecipeData((prevData) => ({
      ...prevData,
      ...(name === 'prep_time_minutes' || name === 'cook_time_minutes'
        ? { [name]: value === '' ? '' : parseInt(value, 10) }
        : { [name]: value }
      ),
    }));
  };

  const handleNewImageFileChange = (e) => {
    const file = e.target.files && e.target.files.length > 0 ? e.target.files[0] : null;
    setSelectedNewImageFile(file);
    setNewImagePreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!recipeData.title || !recipeData.ingredients || !recipeData.instructions) {
      setMessage('タイトル、材料、作り方は必須です');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setMessage('ログインが必要です。');
        navigate('/login');
        return;
      }

      const formData = new FormData();
      formData.append('title', recipeData.title);
      formData.append('ingredients', recipeData.ingredients);
      formData.append('instructions', recipeData.instructions);
      formData.append('difficulty', recipeData.difficulty);
      formData.append('prep_time_minutes', recipeData.prep_time_minutes);
      formData.append('cook_time_minutes', recipeData.cook_time_minutes);
      formData.append('video_url', recipeData.video_url);

      if (selectedNewImageFile) {
        formData.append('image', selectedNewImageFile);
      } else {
        // 新しい画像が選択されていない場合、既存のphoto_urlを送信
        // これにより、バックエンドはphoto_urlが更新されたのか、維持されているのかを判断できる
        formData.append('photo_url', recipeData.photo_url || ''); // 空の場合も明示的に送信
      }

      const response = await fetch(`http://localhost:5001/api/recipes/${recipeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          // FormDataを送信する場合、'Content-Type'はブラウザが自動的に設定するので不要
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        navigate(`/recipes/${recipeId}`, { state: { message: 'レシピを更新しました！' } });
      } else {
        setMessage(result.message || `レシピの更新に失敗しました: ${response.status}`);
        console.error('APIエラー:', result);
      }
    } catch (error) {
      console.error('API呼び出し中にエラーが発生しました:', error);
      setMessage(`ネットワークエラーが発生しました: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className={styles['recipe-post-page-container']}>
        <p className={styles['loading-message']}>レシピを読み込み中... 😋</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['recipe-post-page-container']}>
        <p className={styles['error-message']}>{error}</p>
        <button onClick={() => navigate('/recipes')} className={styles['submit-button']}>
          レシピ一覧に戻る
        </button>
      </div>
    );
  }

  return (
    <div className={styles['recipe-post-page-container']}>
      <h1 className={styles['page-title']}>レシピを編集する</h1>
      {message && <p className={styles['message']}>{message}</p>}

      <form onSubmit={handleSubmit} className={styles['recipe-form']}>
        <div className={styles['form-group']}>
          <label htmlFor="title" className={styles['form-label']}>タイトル <span className={styles['required']}>*</span></label>
          <input type="text" id="title" name="title" value={recipeData.title} onChange={handleChange} className={styles['form-input']} required />
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="ingredients" className={styles['form-label']}>材料 <span className={styles['required']}>*</span></label>
          <textarea id="ingredients" name="ingredients" value={recipeData.ingredients} onChange={handleChange} className={styles['form-textarea']} rows="5" required></textarea>
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="instructions" className={styles['form-label']}>作り方 <span className={styles['required']}>*</span></label>
          <textarea id="instructions" name="instructions" value={recipeData.instructions} onChange={handleChange} className={styles['form-textarea']} rows="8" required></textarea>
        </div>
        
        {/* 現在の画像または選択中の新しい画像のプレビュー */}
        {(newImagePreviewUrl || recipeData.photo_url) && (
          <div className={styles['form-group']}>
            <label className={styles['form-label']}>写真プレビュー</label>
            <div className={styles['current-image-preview']}>
              {newImagePreviewUrl ? (
                <>
                  <p>選択中の新しい画像:</p>
                  <img src={newImagePreviewUrl} alt="New Preview" className={styles['preview-image']} />
                </>
              ) : (
                <>
                  <p>現在の登録画像:</p>
                  <img src={recipeData.photo_url} alt="Current Recipe" className={styles['preview-image']} />
                </>
              )}
            </div>
          </div>
        )}

        {/* 新しい画像ファイル選択 */}
        <div className={styles['form-group']}>
          <label htmlFor="new_photo" className={styles['form-label']}>新しい写真を選ぶ (任意)</label>
          <input
            type="file"
            id="new_photo"
            name="image"
            accept="image/*"
            onChange={handleNewImageFileChange}
            className={styles['form-file-input']}
          />
          <p className={styles['file-name']}>※新しいファイルを選ぶと、現在の画像は置き換わります。</p>
        </div>

        {/* 動画URL入力 */}
        <div className={styles['form-group']}>
          <label htmlFor="video_url" className={styles['form-label']}>動画URL</label>
          <input type="text" id="video_url" name="video_url" value={recipeData.video_url} onChange={handleChange} className={styles['form-input']} placeholder="YouTubeなどの動画URLを入力" />
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="difficulty" className={styles['form-label']}>難易度</label>
          <select id="difficulty" name="difficulty" value={recipeData.difficulty} onChange={handleChange} className={styles['form-select']}>
            <option value="">選択してや</option>
            <option value="easy">初心者向け</option>
            <option value="medium">普通</option>
            <option value="hard">達人向け</option>
          </select>
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="prep_time_minutes" className={styles['form-label']}>準備時間 (分)</label>
          <input type="number" id="prep_time_minutes" name="prep_time_minutes" value={recipeData.prep_time_minutes} onChange={handleChange} className={styles['form-input']} min="0" />
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="cook_time_minutes" className={styles['form-label']}>調理時間 (分)</label>
          <input type="number" id="cook_time_minutes" name="cook_time_minutes" value={recipeData.cook_time_minutes} onChange={handleChange} className={styles['form-input']} min="0" />
        </div>

        <button type="submit" className={styles['submit-button']}>
          レシピを更新する！
        </button>
      </form>
    </div>
  );
}

export default RecipeEditPage;