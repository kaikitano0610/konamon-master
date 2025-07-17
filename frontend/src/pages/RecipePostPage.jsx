import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './RecipePostPage.module.css'; // CSS Modules をインポート

function RecipePostPage() {
  const navigate = useNavigate();

  // フォームの入力状態を管理
  const [recipeData, setRecipeData] = useState({ // formDataからrecipeDataに名称変更
    title: '',
    ingredients: '',
    instructions: '',
    difficulty: '',
    prep_time_minutes: '',
    cook_time_minutes: '',
    video_url: '', // video_urlはテキスト入力（URLを直接入力する想定か、動画ファイルをアップロードする想定か不明なため、今回はURLテキストとして扱います）
  });
  // 画像ファイルと動画ファイルの状態をそれぞれ独立して管理
  const [selectedImageFile, setSelectedImageFile] = useState(null); // 写真ファイルの状態
  const [selectedVideoFile, setSelectedVideoFile] = useState(null); // 動画ファイルの状態

  const [message, setMessage] = useState(''); // 成功/エラーメッセージ

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
    setSelectedImageFile(e.target.files[0]); // 選択された画像ファイルを設定
  };

  // 動画ファイル入力の変更をハンドル
  const handleVideoFileChange = (e) => {
    setSelectedVideoFile(e.target.files[0]); // 選択された動画ファイルを設定
  };

  // フォーム送信ハンドラ
  const handleSubmit = async (e) => {
    e.preventDefault(); // ページの再読み込みを防ぐ
    setMessage(''); // メッセージをクリア

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
    apiFormData.append('video_url', recipeData.video_url); // video_url も FormData に追加

    // 画像ファイルがある場合のみ追加。バックエンドが 'image' を期待するため、キー名を 'image' に変更
    if (selectedImageFile) {
      apiFormData.append('image', selectedImageFile);
    }
    // TODO: もし動画もS3にアップロードするなら、バックエンドにも動画アップロードロジックが必要
    // if (selectedVideoFile) {
    //   apiFormData.append('video', selectedVideoFile); // 現状バックエンドは動画ファイルアップロードに対応していないため、コメントアウト
    // }

    console.log('API呼び出し実行予定:', recipeData);
    // FormDataの内容を直接コンソール表示するのは難しいので、確認のためにコメントアウトを推奨
    // console.log('送信データ (FormData):', apiFormData);

    try {
      const token = localStorage.getItem('access_token'); // JWTトークンをlocalStorageから取得
      if (!token) {
        setMessage('ログインが必要です。');
        navigate('/login'); // ログインページへリダイレクト
        return;
      }

      const response = await fetch('http://localhost:5001/api/recipes/', { // ★APIエンドポイントを修正
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`, // JWTトークンをヘッダーに追加
          // FormDataを使用する場合、'Content-Type': 'multipart/form-data' はブラウザが自動的に設定するため、不要です。
        },
        body: apiFormData, // FormData を直接 body に指定
      });

      const result = await response.json(); // レスポンスをJSONとしてパース

      if (response.ok) { // HTTPステータスコードが2xxの場合
        setMessage(result.message || 'レシピが正常に投稿されました！');
        // フォームをリセット
        setRecipeData({
          title: '', ingredients: '', instructions: '', difficulty: '',
          prep_time_minutes: '', cook_time_minutes: '', video_url: ''
        });
        setSelectedImageFile(null); // 選択された画像ファイルをリセット
        setSelectedVideoFile(null); // 選択された動画ファイルをリセット
        
        // 投稿後、レシピ一覧画面へ遷移したい場合はコメントを外す
        // navigate('/recipes'); 
      } else {
        // HTTPステータスコードがエラーの場合
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
      {message && <p className={styles['message']}>{message}</p>} {/* メッセージ表示 */}
      
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
            name="image" // ★重要: バックエンドが 'image' を期待するため、name属性を 'image' に変更
            accept="image/*" // 画像ファイルのみ
            onChange={handleImageFileChange} // 画像ファイル専用のハンドラ
            className={styles['form-file-input']}
          />
          {selectedImageFile && <p className={styles['file-name']}>選択中: {selectedImageFile.name}</p>}
        </div>

        {/* 動画URL入力（ファイルアップロードからテキスト入力に変更） */}
        {/* バックエンドが現時点で動画ファイルのアップロードを直接S3にする処理がないため */}
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