import os
import openai

# APIキーを環境変数から取得
openai.api_key = os.getenv("OPENAI_API_KEY")

def generate_search_queries(mood_query: str, food_type: str) -> list[str]:
    """
    ユーザーの気分と食べ物の種類に基づいて、Google Places API向けの検索クエリを生成する。
    """
    if not openai.api_key:
        raise RuntimeError("OPENAI_API_KEYが設定されていません")
    
    # LLMへのプロンプトを設計
    prompt = f"""
    ユーザーは大阪で飲食店を探しています。
    気分は「{mood_query}」で、料理のジャンルは「{food_type}」です。
    この気分とジャンルに合うお店を探すための、Google Places API向けの検索クエリを3つ、JSON形式で生成してください。
    各クエリは日本語で、具体的なお店の雰囲気や特徴を含めてください。
    JSONのキーは「queries」とし、値は文字列の配列にしてください。
    
    例:
    "queries": [
        "大阪 落ち着いたカフェ デート",
        "梅田 活気のある居酒屋 飲み会",
        "なんば 隠れ家 カレー"
    ]
    """
    
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo-1106",  # 使用するモデル
            messages=[
                {"role": "system", "content": "あなたは優秀なレストラン検索アシスタントです。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=200,
            response_format={"type": "json_object"} # JSON形式での出力を指定
        )

        print("--- OpenAI APIレスポンス ---")
        print(response)
        print("--- レスポンスのメッセージ内容 ---")
        print(response.choices[0].message.content)
        print("--------------------------")
        
        # レスポンスからJSONを抽出してパース
        generated_json_string = response.choices[0].message.content
        queries_dict = eval(generated_json_string)
        return queries_dict.get("queries", [])
    
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        # API呼び出し失敗時のフォールバック
        return [f"大阪 {food_type} {mood_query}"]