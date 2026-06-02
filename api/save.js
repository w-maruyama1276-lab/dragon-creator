export default async function handler(req, res) {
  // データの送信（POST）以外は受け付けない設定
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 客席（ブラウザ）から届いたドラゴンのデータを受け取る
    const { name, comment, parts, token } = req.body;

    // 🛡️ 門番チェック1：合言葉の検証
    // Vercelに隠しておく「本物の合言葉」と、届いた合言葉が一致するかチェック
    const CORRECT_TOKEN = process.env.SECRET_TOKEN;
    if (token !== CORRECT_TOKEN) {
      return res.status(401).json({ error: '不正なアクセスです（合言葉が違います）' });
    }

    // 🛡️ 門番チェック2：改造チート対策（F12キー対策）
    // パーツのサイズ(scale)が5倍を超えるような異常な数値があれば、改造データとして弾く
    if (parts && parts.some(p => p.scale > 5.0)) {
      return res.status(400).json({ error: '不正なデータが検出されました（パーツが大きすぎます）' });
    }

    // 🚀 安全な厨房の壁に貼られた「秘密のGAS URL」を読み込む
    const GAS_URL = process.env.GAS_URL;

    // VercelからGoogleスプレッドシート（GAS）へデータを安全に転送する
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, comment, parts, token })
    });

    const result = await response.json();

    // スプレッドシートへの書き込みが成功したら、客席に「できたよ！」と返事をする
    return res.status(200).json(result);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}