import React, { useState, useEffect } from 'react'; // useEffect をインポート
import { useNavigate } from 'react-router-dom';
import styles from './RecipePostPage.module.css';

function RecipePostPage() {
  const navigate = useNavigate();

  // フォームの入力状態を管理
  const [recipeData, setRecipeData] = useState({
    title: '',
    ingredients: '',
    instructions: '',
    difficulty: '',
    prep_time_minutes: '',
    cook_time_minutes: '',
    video_url: '',
  });
  // 画像ファイルと動画ファイルの状態をそれぞれ独立して管理
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);

  const [message, setMessage] = useState(''); // 成功/エラーメッセージ

  // ★追加: コンポーネントがマウントされた時にログイン状態をチェック
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      // メッセージを設定してからリダイレクト
      setMessage('レシピ投稿にはログインが必要です。');
      navigate('/login');
    }
  }, [navigate]); // navigate は依存配列に含める

  // 入力フィールドの変更をハンドル (テキスト入力用)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setRecipeData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // 画像ファイル入力の変更をハンドル
  const handleImageFileChange = (e) => {
    setSelectedImageFile(e.target.files[0]);
  };

  // 動画ファイル入力の変更をハンドル
  const handleVideoFileChange = (e) => {
    setSelectedVideoFile(e.target.files[0]);
  };

  // フォーム送信ハンドラ
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // 必須フィールドのバリデーション
    if (!recipeData.title || !recipeData.ingredients || !recipeData.instructions) {
      setMessage('タイトル、材料、作り方は必須です');
      return;
    }

    // FormDataを作成
    const apiFormData = new FormData();
    apiFormData.append('title', recipeData.title);
    apiFormData.append('ingredients', recipeData.ingredients);
    apiFormData.append('instructions', recipeData.instructions);
    apiFormData.append('difficulty', recipeData.difficulty);
    apiFormData.append('prep_time_minutes', recipeData.prep_time_minutes);
    apiFormData.append('cook_time_minutes', recipeData.cook_time_minutes);
    apiFormData.append('video_url', recipeData.video_url);

    // 画像ファイルがある場合のみ追加
    if (selectedImageFile) {
      apiFormData.append('image', selectedImageFile);
    }
    
    try {
      const token = localStorage.getItem('access_token');
      // ここでの !token チェックは、useEffect との二重チェックになりますが、
      // ユーザーが非常に素早く操作した場合などに備えて残しておいても問題ありません。
      // ただし、基本的には useEffect でリダイレクトされるため、この行に到達することは稀です。
      if (!token) { 
        setMessage('投稿にはログインが必要です。');
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

      // レスポンスステータスが401の場合にログインページへリダイレクト
      if (response.status === 401) {
        setMessage('セッションの有効期限が切れました。再度ログインしてください。');
        navigate('/login');
        return;
      }

      const result = await response.json();

      if (response.ok) {
        navigate('/recipes', { state: { message: 'レシピを投稿しました！' } });
      } else {
        setMessage(result.message || `レシピ投稿に失敗しました: ${response.status}`);
        console.error('APIエラー:', result);
      }
    } catch (error) {
      console.error('API呼び出し中にエラーが発生しました:', error);
      setMessage(`ネットワークエラーが発生しました: ${error.message}`);
    }
  };

  return (
    <div className={styles['recipe-post-page-container']}>
      <h1 className={styles['page-title']}>Myオリジナル粉もんレシピ投稿</h1>
      {message && <p className={styles['message']}>{message}</p>}
      
      <form onSubmit={handleSubmit} className={styles['recipe-form']}>
        {/* タイトル */}
        <div className={styles['form-group']}>
          <label htmlFor="title" className={styles['form-label']}>タイトル <span className={styles['required']}>*</span></label>
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

        {/* 材料 */}
        <div className={styles['form-group']}>
          <label htmlFor="ingredients" className={styles['form-label']}>材料 <span className={styles['required']}>*</span></label>
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

        {/* 作り方 */}
        <div className={styles['form-group']}>
          <label htmlFor="instructions" className={styles['form-label']}>作り方 <span className={styles['required']}>*</span></label>
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

        {/* 写真アップロード */}
        <div className={styles['form-group']}>
          <label htmlFor="photo" className={styles['form-label']}>写真</label>
          <input
            type="file"
            id="photo"
            name="image"
            accept="image/*"
            onChange={handleImageFileChange}
            className={styles['form-file-input']}
          />
          {selectedImageFile && <p className={styles['file-name']}>選択中: {selectedImageFile.name}</p>}
        </div>

        {/* 動画URL入力 */}
        <div className={styles['form-group']}>
          <label htmlFor="video_url" className={styles['form-label']}>動画URL</label>
          <input
            type="text"
            id="video_url"
            name="video_url"
            value={recipeData.video_url}
            onChange={handleChange}
            className={styles['form-input']}
            placeholder="YouTubeなどの動画URLを入力"
          />
        </div>

        {/* 難易度 */}
        <div className={styles['form-group']}>
          <label htmlFor="difficulty" className={styles['form-label']}>難易度</label>
          <select
            id="difficulty"
            name="difficulty"
            value={recipeData.difficulty}
            onChange={handleChange}
            className={styles['form-select']}
          >
            <option value="">選択してや</option>
            <option value="初心者向け">初心者向け</option>
            <option value="普通">普通</option>
            <option value="達人向け">達人向け</option>
          </select>
        </div>

        {/* 準備時間 */}
        <div className={styles['form-group']}>
          <label htmlFor="prep_time_minutes" className={styles['form-label']}>準備時間 (分)</label>
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

        {/* 調理時間 */}
        <div className={styles['form-group']}>
          <label htmlFor="cook_time_minutes" className={styles['form-label']}>調理時間 (分)</label>
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
          レシピを投稿する！
        </button>
      </form>
    </div>
  );
}

export default RecipePostPage;