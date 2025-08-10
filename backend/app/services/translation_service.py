import os
from google.cloud import translate_v2 as translate

credentials_path = "/code/google-credentials.json"
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path

translate_client = translate.Client()

def translate_text(text, target_language):
    """
    指定されたテキストを目的の言語に翻訳する

    Args:
        text (str): 翻訳したいテキスト
        target_language (str): 翻訳先の言語コード (例: 'en', 'ja')

    Returns:
        str: 翻訳されたテキスト
    """
    if not text:
        return ""
    
    # 翻訳を実行
    result = translate_client.translate(text, target_language=target_language)
    
    # 翻訳結果を返す
    return result['translatedText']

if __name__ == '__main__':
    # このファイル単体で動作確認するためのコード
    japanese_text = "これはテストメッセージです。"
    english_text = translate_text(japanese_text, 'en')
    print(f"日本語: {japanese_text}")
    print(f"英語: {english_text}")