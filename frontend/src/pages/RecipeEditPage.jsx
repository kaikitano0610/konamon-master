import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // useParams をインポート
import styles from './RecipeEditPage.module.css'; // CSS Modules をインポート

function RecipeEditPage() {
  const { recipeId } = useParams(); // URLから recipeId を取得
  const navigate = useNavigate();

  // フォームの入力状態を管理 (初期値は null/空)
  const [formData, setFormData] = useState({
    title: '',
    ingredients: '',
    instructions: '',
    photo: null, // Fileオブジェクトまたは既存のphoto_url
    video: null, // Fileオブジェクトまたは既存のvideo_url
    difficulty: '',
    prep_time_minutes: '',
    cook_time_minutes: '',
    // photo_url と video_url は表示用/API送信時に使用
    photo_url: '', 
    video_url: '',
  });

  const [loading, setLoading] = useState(true); // データ読み込み中
  const [error, setError] = useState(null);     // エラーメッセージ

  // 仮のレシピデータ（実際のAPI呼び出しの代替）
  // RecipeDetailPage と同じデータを使用します
  const hardcodedRecipes = [
    {
      id: 'recipe1',
      user_id: 1,
      title: 'だし醤油風味たこ焼き〜大阪〜',
      ingredients: 'たこ、小麦粉、卵、だし醤油、ねぎ、紅しょうが',
      instructions: '1. 材料を混ぜる。2. たこ焼き器で焼く。3. だし醤油をかける。',
      photo_url: 'https://via.placeholder.com/400x300/FFD700/000000?text=Takoyaki1',
      video_url: null,
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
      video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
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
  ];

  useEffect(() => {
    setLoading(true);
    setError(null);

    // URLから取得したrecipeIdに一致するレシピを探す (API呼び出しのシミュレーション)
    const foundRecipe = hardcodedRecipes.find(r => r.id === recipeId);

    const timer = setTimeout(() => {
      if (foundRecipe) {
        // 見つかったレシピデータでフォームを初期化
        setFormData({
          title: foundRecipe.title,
          ingredients: foundRecipe.ingredients,
          instructions: foundRecipe.instructions,
          photo: null, // ファイル入力は初期化（既存のファイルはURLで表示）
          video: null, // ファイル入力は初期化
          difficulty: foundRecipe.difficulty,
          prep_time_minutes: foundRecipe.prep_time_minutes || '', // null対策
          cook_time_minutes: foundRecipe.cook_time_minutes || '', // null対策
          photo_url: foundRecipe.photo_url || '', // 既存の画像URL
          video_url: foundRecipe.video_url || '', // 既存の動画URL
        });
      } else {
        setError('編集するレシピが見つかりませんでした。');
      }
      setLoading(false);
    }, 500); // 0.5秒のロード時間シミュレーション

    return () => clearTimeout(timer);
  }, [recipeId]); // recipeId が変わったら再実行

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
      // 既存のURLをクリア (新しいファイルをアップロードするため)
      [`${name}_url`]: null, 
    }));
  };

  // フォーム送信ハンドラ
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 必須フィールドのバリデーション
    if (!formData.title || !formData.ingredients || !formData.instructions) {
      alert('タイトル、材料、作り方は必須やで！');
      return;
    }

    // バックエンドへの送信データ準備
    const apiFormData = new FormData();
    apiFormData.append('title', formData.title);
    apiFormData.append('ingredients', formData.ingredients);
    apiFormData.append('instructions', formData.instructions);
    apiFormData.append('difficulty', formData.difficulty);
    apiFormData.append('prep_time_minutes', formData.prep_time_minutes);
    apiFormData.append('cook_time_minutes', formData.cook_time_minutes);

    // 新しいファイルが選択された場合のみ追加
    if (formData.photo) {
      apiFormData.append('photo', formData.photo);
    }
    if (formData.video) {
      apiFormData.append('video', formData.video);
    }
    // 既存のURLをサーバーに送る必要がある場合（ファイルが変更されない場合）
    // 例: apiFormData.append('existing_photo_url', formData.photo_url);

    // ここでバックエンドAPI（/api/recipes/:recipeId への PUT/PATCH）を呼び出す
    console.log(`API呼び出し実行予定: PUT /api/recipes/${recipeId}`);
    console.log('送信データ (FormData):', apiFormData);

    try {
      // 例: const response = await fetch(`http://localhost:5001/api/recipes/${recipeId}`, {
      //   method: 'PUT', // または 'PATCH'
      //   body: apiFormData,
      // });
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.error || `APIエラー: ${response.status}`);
      // }
      // const result = await response.json();
      // console.log('レシピ更新成功:', result);

      alert('レシピを更新したで！');
      navigate(`/recipes/${recipeId}`); // 更新後、レシピ詳細画面へ遷移
    } catch (error) {
      alert(`レシピ更新に失敗しました: ${error.message}`);
      console.error('レシピ更新エラー:', error);
    }
  };

  if (loading) {
    return <div className={styles['edit-page-container']}><p>レシピを読み込み中やで！</p></div>;
  }

  if (error) {
    return <div className={styles['edit-page-container']}><p className={styles['error-message']}>エラー発生: {error}</p></div>;
  }

  if (!recipeId || !formData.title) { // レシピIDがない、またはデータが初期化されていない
    return <div className={styles['edit-page-container']}><p className={styles['not-found-message']}>編集するレシピが見つかりません。</p></div>;
  }

  return (
    <div className={styles['edit-page-container']}>
      <h1 className={styles['page-title']}>レシピを編集</h1>
      
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

        {/* 既存のメディア表示と新規アップロード */}
        {(formData.photo_url || formData.video_url) && (
            <div className={styles['current-media-display']}>
                <p className={styles['form-label']}>現在のメディア:</p>
                {formData.video_url ? (
                    <video controls src={formData.video_url} className={styles['current-video']}/>
                ) : (
                    <img src={formData.photo_url} alt="Current Recipe" className={styles['current-photo']}/>
                )}
            </div>
        )}

        {/* 写真アップロード (新しいファイルで上書き) */}
        <div className={styles['form-group']}>
          <label htmlFor="photo" className={styles['form-label']}>写真 (変更する場合)</label>
          <input
            type="file"
            id="photo"
            name="photo"
            accept="image/*"
            onChange={handleFileChange}
            className={styles['form-file-input']}
          />
          {formData.photo && <p className={styles['file-name']}>新しい写真: {formData.photo.name}</p>}
        </div>

        {/* 動画アップロード (新しいファイルで上書き) */}
        <div className={styles['form-group']}>
          <label htmlFor="video" className={styles['form-label']}>動画 (変更する場合)</label>
          <input
            type="file"
            id="video"
            name="video"
            accept="video/*"
            onChange={handleFileChange}
            className={styles['form-file-input']}
          />
          {formData.video && <p className={styles['file-name']}>新しい動画: {formData.video.name}</p>}
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
          更新する！
        </button>
      </form>
    </div>
  );
}

export default RecipeEditPage;