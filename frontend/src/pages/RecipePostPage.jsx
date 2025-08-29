import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './RecipePostPage.module.css';

function RecipePostPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [recipeData, setRecipeData] = useState({
    title: '',
    ingredients: '',
    instructions: '',
    difficulty: '',
    prep_time_minutes: '',
    cook_time_minutes: '',
    video_url: '',
  });

  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setMessage(t('login_required_post_message'));
      navigate('/login');
    }
  }, [navigate, t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRecipeData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleImageFileChange = (e) => {
    setSelectedImageFile(e.target.files[0]);
  };

  const handleVideoFileChange = (e) => {
    setSelectedVideoFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!recipeData.title || !recipeData.ingredients || !recipeData.instructions) {
      setMessage(t('required_fields_message'));
      return;
    }

    const apiFormData = new FormData();
    apiFormData.append('title', recipeData.title);
    apiFormData.append('ingredients', recipeData.ingredients);
    apiFormData.append('instructions', recipeData.instructions);
    apiFormData.append('difficulty', recipeData.difficulty);
    apiFormData.append('prep_time_minutes', recipeData.prep_time_minutes);
    apiFormData.append('cook_time_minutes', recipeData.cook_time_minutes);
    apiFormData.append('video_url', recipeData.video_url);

    if (selectedImageFile) {
      apiFormData.append('image', selectedImageFile);
    }
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setMessage(t('login_required_post_message'));
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5001/api/recipes/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: apiFormData,
      });

      if (response.status === 401) {
        setMessage(t('session_expired_message'));
        navigate('/login');
        return;
      }

      const result = await response.json();

      if (response.ok) {
        navigate('/recipes', { state: { message: t('recipe_posted_message') } });
      } else {
        setMessage(result.message || t('post_recipe_failed_message', { status: response.status }));
        console.error('APIエラー:', result);
      }
    } catch (error) {
      console.error('API呼び出し中にエラーが発生しました:', error);
      setMessage(t('network_error_message', { error: error.message }));
    }
  };

  return (
    <div className={styles['recipe-post-page-container']}>
      <h1 className={styles['page-title']}>{t('post_recipe_title')}</h1>
      {message && <p className={styles['message']}>{message}</p>}
      
      <form onSubmit={handleSubmit} className={styles['recipe-form']}>
        <div className={styles['form-group']}>
          <label htmlFor="title" className={styles['form-label']}>{t('recipe_title_label')} <span className={styles['required']}>*</span></label>
          <input
            type="text"
            id="title"
            name="title"
            value={recipeData.title}
            onChange={handleChange}
            className={styles['form-input']}
            required
          />
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="ingredients" className={styles['form-label']}>{t('ingredients_label')} <span className={styles['required']}>*</span></label>
          <textarea
            id="ingredients"
            name="ingredients"
            value={recipeData.ingredients}
            onChange={handleChange}
            className={styles['form-textarea']}
            rows="5"
            required
          ></textarea>
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="instructions" className={styles['form-label']}>{t('instructions_label')} <span className={styles['required']}>*</span></label>
          <textarea
            id="instructions"
            name="instructions"
            value={recipeData.instructions}
            onChange={handleChange}
            className={styles['form-textarea']}
            rows="8"
            required
          ></textarea>
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="photo" className={styles['form-label']}>{t('photo_label')}</label>
          <input
            type="file"
            id="photo"
            name="image"
            accept="image/*"
            onChange={handleImageFileChange}
            className={styles['form-file-input']}
          />
          {selectedImageFile && <p className={styles['file-name']}>{t('selected_file_text')}: {selectedImageFile.name}</p>}
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="video_url" className={styles['form-label']}>{t('video_url_label')}</label>
          <input
            type="text"
            id="video_url"
            name="video_url"
            value={recipeData.video_url}
            onChange={handleChange}
            className={styles['form-input']}
            placeholder={t('video_url_placeholder')}
          />
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="difficulty" className={styles['form-label']}>{t('difficulty_label')}</label>
          <select
            id="difficulty"
            name="difficulty"
            value={recipeData.difficulty}
            onChange={handleChange}
            className={styles['form-select']}
          >
            <option value="">{t('select_difficulty_placeholder')}</option>
            <option value="easy">{t('difficulty_easy')}</option> {/* ★ ここを修正 */}
            <option value="medium">{t('difficulty_medium')}</option> {/* ★ ここを修正 */}
            <option value="hard">{t('difficulty_hard')}</option> {/* ★ ここを修正 */}
          </select>
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="prep_time_minutes" className={styles['form-label']}>{t('prep_time_label')} ({t('minutes_unit')})</label>
          <input
            type="number"
            id="prep_time_minutes"
            name="prep_time_minutes"
            value={recipeData.prep_time_minutes}
            onChange={handleChange}
            className={styles['form-input']}
            min="0"
          />
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="cook_time_minutes" className={styles['form-label']}>{t('cook_time_label')} ({t('minutes_unit')})</label>
          <input
            type="number"
            id="cook_time_minutes"
            name="cook_time_minutes"
            value={recipeData.cook_time_minutes}
            onChange={handleChange}
            className={styles['form-input']}
            min="0"
          />
        </div>

        <button type="submit" className={styles['submit-button']}>
          {t('post_recipe_button')}
        </button>
      </form>
    </div>
  );
}

export default RecipePostPage;