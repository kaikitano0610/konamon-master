import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend) // 翻訳ファイルを読み込むためのプラグイン
  .use(initReactI18next) // Reactとi18nを連携させる
  .init({
    lng: 'ja', // デフォルトの言語を日本語に設定
    fallbackLng: 'ja', // 読み込みに失敗した場合の代替言語
    debug: true, // 開発中にログを出力
    interpolation: {
      escapeValue: false, // ReactではXSS対策が組み込まれているため不要
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json', // 翻訳ファイルのパス
    },
  });

export default i18n;