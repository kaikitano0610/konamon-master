import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './RecipePostPage.module.css'; // CSS Modules をインポート

function RecipePostPage() {
  const navigate = useNavigate();

  // フォームの入力状態を管理
  const [formData, setFormData] = useState({
    title: '',
    ingredients: '',
    instructions: '',
    photo: null, // Fileオブジェクトを保存
    video: null, // Fileオブジェクトを保存
    difficulty: '',
    prep_time_minutes: '',
    cook_time_minutes: '',
  });

  // 入力フィールドの変更をハンドル
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // ファイル入力の変更をハンドル
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: files[0], // 最初のファイルのみを取得
    }));
  };

  // フォーム送信ハンドラ
  const handleSubmit = async (e) => {
    e.preventDefault(); // ページの再読み込みを防ぐ

    // 必須フィールドのバリデーション (例)
    if (!formData.title || !formData.ingredients || !formData.instructions) {
      alert('タイトル、材料、作り方は必須やで！');
      return;
    }

    // ここでバックエンドAPI（/api/recipes/post）を呼び出すロジックを実装
    // 画像/動画アップロードを含むため、FormData API を使用
    const apiFormData = new FormData();
    apiFormData.append('title', formData.title);
    apiFormData.append('ingredients', formData.ingredients);
    apiFormData.append('instructions', formData.instructions);
    apiFormData.append('difficulty', formData.difficulty);
    apiFormData.append('prep_time_minutes', formData.prep_time_minutes);
    apiFormData.append('cook_time_minutes', formData.cook_time_minutes);

    // ファイルがある場合のみ追加
    if (formData.photo) {
      apiFormData.append('photo', formData.photo);
    }
    if (formData.video) {
      apiFormData.append('video', formData.video);
    }

    // API呼び出しのシミュレーション（実際はfetch APIなどを使う）
    console.log('API呼び出し実行予定:', formData);
    console.log('送信データ (FormData):', apiFormData);

    try {
      // 例: const response = await fetch('http://localhost:5001/api/recipes/post', {
      //   method: 'POST',
      //   body: apiFormData, // FormData を直接 body に指定すると Content-Type は自動で multipart/form-data になる
      // });
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.error || `APIエラー: ${response.status}`);
      // }
      // const result = await response.json();
      // console.log('レシピ投稿成功:', result);

      alert('レシピを投稿したで！');
      navigate('/recipes'); // 投稿後、レシピ一覧画面へ遷移
    } catch (error) {
      alert(`レシピ投稿に失敗しました: ${error.message}`);
      console.error('レシピ投稿エラー:', error);
    }
  };

  return (
    <div className={styles['recipe-post-page-container']}>
      <h1 className={styles['page-title']}>Myオリジナル粉もんレシピ投稿</h1>
      
      <form onSubmit={handleSubmit} className={styles['recipe-form']}>
        {/* タイトル */}
        <div className={styles['form-group']}>
          <label htmlFor="title" className={styles['form-label']}>タイトル <span className={styles['required']}>*</span></label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={styles['form-input']}
            required
          />
        </div>

        {/* 材料 */}
        <div className={styles['form-group']}>
          <label htmlFor="ingredients" className={styles['form-label']}>材料 <span className={styles['required']}>*</span></label>
          <textarea
            id="ingredients"
            name="ingredients"
            value={formData.ingredients}
            onChange={handleChange}
            className={styles['form-textarea']}
            rows="5"
            required
          ></textarea>
        </div>

        {/* 作り方 */}
        <div className={styles['form-group']}>
          <label htmlFor="instructions" className={styles['form-label']}>作り方 <span className={styles['required']}>*</span></label>
          <textarea
            id="instructions"
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            className={styles['form-textarea']}
            rows="8"
            required
          ></textarea>
        </div>

        {/* 写真アップロード */}
        <div className={styles['form-group']}>
          <label htmlFor="photo" className={styles['form-label']}>写真</label>
          <input
            type="file"
            id="photo"
            name="photo"
            accept="image/*" // 画像ファイルのみ
            onChange={handleFileChange}
            className={styles['form-file-input']}
          />
          {formData.photo && <p className={styles['file-name']}>選択中: {formData.photo.name}</p>}
        </div>

        {/* 動画アップロード */}
        <div className={styles['form-group']}>
          <label htmlFor="video" className={styles['form-label']}>動画</label>
          <input
            type="file"
            id="video"
            name="video"
            accept="video/*" // 動画ファイルのみ
            onChange={handleFileChange}
            className={styles['form-file-input']}
          />
          {formData.video && <p className={styles['file-name']}>選択中: {formData.video.name}</p>}
        </div>

        {/* 難易度 */}
        <div className={styles['form-group']}>
          <label htmlFor="difficulty" className={styles['form-label']}>難易度</label>
          <select
            id="difficulty"
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            className={styles['form-select']}
          >
            <option value="">選択してや</option>
            <option value="easy">初心者向け</option>
            <option value="medium">普通</option>
            <option value="hard">達人向け</option>
          </select>
        </div>

        {/* 準備時間 */}
        <div className={styles['form-group']}>
          <label htmlFor="prep_time_minutes" className={styles['form-label']}>準備時間 (分)</label>
          <input
            type="number"
            id="prep_time_minutes"
            name="prep_time_minutes"
            value={formData.prep_time_minutes}
            onChange={handleChange}
            className={styles['form-input']}
            min="0"
          />
        </div>

        {/* 調理時間 */}
        <div className={styles['form-group']}>
          <label htmlFor="cook_time_minutes" className={styles['form-label']}>調理時間 (分)</label>
          <input
            type="number"
            id="cook_time_minutes"
            name="cook_time_minutes"
            value={formData.cook_time_minutes}
            onChange={handleChange}
            className={styles['form-input']}
            min="0"
          />
        </div>

        <button type="submit" className={styles['submit-button']}>
          レシピを投稿する！
        </button>
      </form>
    </div>
  );
}

export default RecipePostPage;