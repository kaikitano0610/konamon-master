import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // ★ useTranslationをインポート
import styles from './RecipeEditPage.module.css';

function RecipeEditPage() {
  const { t, i18n } = useTranslation(); // ★ t関数とi18nオブジェクトを取得
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
  const [selectedNewImageFile, setSelectedNewImageFile] = useState(null);
  const [newImagePreviewUrl, setNewImagePreviewUrl] = useState(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        setError(null);
        setMessage('');

        const token = localStorage.getItem('access_token');
        if (!token) {
          setMessage(t('login_required_message')); // ★ 翻訳キーを使用
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
            throw new Error(t('recipe_not_found_message')); // ★ 翻訳キーを使用
          }
          throw new Error(t('fetch_recipe_failed_message', { status: response.statusText })); // ★ 翻訳キーを使用
        }

        const data = await response.json();
        // ★ 取得したデータから、現在の言語に応じて適切な値を初期値としてセット
        const currentTitle = i18n.language === 'en' ? data.title_en || data.title : data.title;
        const currentIngredients = i18n.language === 'en' ? data.ingredients_en || data.ingredients : data.ingredients;
        const currentInstructions = i18n.language === 'en' ? data.instructions_en || data.instructions : data.instructions;

        setRecipeData({
          title: currentTitle || '',
          ingredients: currentIngredients || '',
          instructions: currentInstructions || '',
          difficulty: data.difficulty || '',
          prep_time_minutes: data.prep_time_minutes || '',
          cook_time_minutes: data.cook_time_minutes || '',
          video_url: data.video_url || '',
          photo_url: data.photo_url || '',
        });
      } catch (err) {
        console.error('レシピデータの取得中にエラーが発生しました:', err);
        setError(err.message || t('failed_to_load_recipe_message')); // ★ 翻訳キーを使用
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId, navigate, i18n.language, t]); // ★ i18n.language と t も依存配列に追加

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
      setMessage(t('required_fields_message')); // ★ 翻訳キーを使用
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setMessage(t('login_required_message')); // ★ 翻訳キーを使用
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
        formData.append('photo_url', recipeData.photo_url || '');
      }

      const response = await fetch(`http://localhost:5001/api/recipes/${recipeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        navigate(`/recipes/${recipeId}`, { state: { message: t('recipe_updated_message') } }); // ★ 翻訳キーを使用
      } else {
        setMessage(result.message || t('update_recipe_failed_message', { status: response.status })); // ★ 翻訳キーを使用
        console.error('APIエラー:', result);
      }
    } catch (error) {
      console.error('API呼び出し中にエラーが発生しました:', error);
      setMessage(t('network_error_message', { error: error.message })); // ★ 翻訳キーを使用
    }
  };

  if (loading) {
    return (
      <div className={styles['recipe-post-page-container']}>
        <p className={styles['loading-message']}>{t('loading_recipe_message')}</p> {/* ★ 翻訳キーを使用 */}
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['recipe-post-page-container']}>
        <p className={styles['error-message']}>{error}</p>
        <button onClick={() => navigate('/recipes')} className={styles['submit-button']}>
          {t('back_to_recipe_list_button')} {/* ★ 翻訳キーを使用 */}
        </button>
      </div>
    );
  }

  return (
    <div className={styles['recipe-post-page-container']}>
      <h1 className={styles['page-title']}>{t('edit_recipe_title')}</h1> {/* ★ 翻訳キーを使用 */}
      {message && <p className={styles['message']}>{message}</p>}

      <form onSubmit={handleSubmit} className={styles['recipe-form']}>
        <div className={styles['form-group']}>
          <label htmlFor="title" className={styles['form-label']}>{t('recipe_title_label')} <span className={styles['required']}>*</span></label>
          <input type="text" id="title" name="title" value={recipeData.title} onChange={handleChange} className={styles['form-input']} required />
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="ingredients" className={styles['form-label']}>{t('ingredients_label')} <span className={styles['required']}>*</span></label>
          <textarea id="ingredients" name="ingredients" value={recipeData.ingredients} onChange={handleChange} className={styles['form-textarea']} rows="5" required></textarea>
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="instructions" className={styles['form-label']}>{t('instructions_label')} <span className={styles['required']}>*</span></label>
          <textarea id="instructions" name="instructions" value={recipeData.instructions} onChange={handleChange} className={styles['form-textarea']} rows="8" required></textarea>
        </div>
        
        {(newImagePreviewUrl || recipeData.photo_url) && (
          <div className={styles['form-group']}>
            <label className={styles['form-label']}>{t('photo_preview_label')}</label>
            <div className={styles['current-image-preview']}>
              {newImagePreviewUrl ? (
                <>
                  <p>{t('new_image_selected_text')}</p>
                  <img src={newImagePreviewUrl} alt="New Preview" className={styles['preview-image']} />
                </>
              ) : (
                <>
                  <p>{t('current_image_text')}</p>
                  <img src={recipeData.photo_url} alt="Current Recipe" className={styles['preview-image']} />
                </>
              )}
            </div>
          </div>
        )}

        <div className={styles['form-group']}>
          <label htmlFor="new_photo" className={styles['form-label']}>{t('select_new_photo_label')}</label>
          <input
            type="file"
            id="new_photo"
            name="image"
            accept="image/*"
            onChange={handleNewImageFileChange}
            className={styles['form-file-input']}
          />
          <p className={styles['file-name']}>{t('photo_replace_message')}</p>
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="video_url" className={styles['form-label']}>{t('video_url_label')}</label>
          <input type="text" id="video_url" name="video_url" value={recipeData.video_url} onChange={handleChange} className={styles['form-input']} placeholder={t('video_url_placeholder')} />
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="difficulty" className={styles['form-label']}>{t('difficulty_label')}</label>
          <select id="difficulty" name="difficulty" value={recipeData.difficulty} onChange={handleChange} className={styles['form-select']}>
            <option value="">{t('select_difficulty_placeholder')}</option>
            <option value="easy">{t('difficulty_easy')}</option>
            <option value="medium">{t('difficulty_medium')}</option>
            <option value="hard">{t('difficulty_hard')}</option>
          </select>
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="prep_time_minutes" className={styles['form-label']}>{t('prep_time_label')} ({t('minutes_unit')})</label>
          <input type="number" id="prep_time_minutes" name="prep_time_minutes" value={recipeData.prep_time_minutes} onChange={handleChange} className={styles['form-input']} min="0" />
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="cook_time_minutes" className={styles['form-label']}>{t('cook_time_label')} ({t('minutes_unit')})</label>
          <input type="number" id="cook_time_minutes" name="cook_time_minutes" value={recipeData.cook_time_minutes} onChange={handleChange} className={styles['form-input']} min="0" />
        </div>

        <button type="submit" className={styles['submit-button']}>
          {t('update_recipe_button')}
        </button>
      </form>
    </div>
  );
}

export default RecipeEditPage;