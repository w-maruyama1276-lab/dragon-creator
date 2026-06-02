export default async function handler(req, res) {
  // データの送信（POST）以外は受け付けない設定
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 客席（ブラウザ）から届いたデータを受け取る
    const { name, nickname, parts, token } = req.body;

    // 🛡️ 門番チェック1：合言葉の検証
    const CORRECT_TOKEN = process.env.SECRET_TOKEN;
    if (token !== CORRECT_TOKEN) {
      return res.status(401).json({ error: '不正なアクセスです（合言葉が違います）' });
    }

    // 🛡️ 門番チェック2：改造チート対策
    if (parts && parts.some(p => p.scale > 5.0)) {
      return res.status(400).json({ error: '不正なデータが検出されました（パーツが大きすぎます）' });
    }

    // 🚀 安全な厨房の壁に貼られた「秘密のGAS URL」を読み込む
    const GAS_URL = process.env.GAS_URL;

    // 💡 どんな名前で届いても確実にGASの「nickname」に合わせてパッキングする
    const validNickname = nickname || name || '名無しの召喚者';

    // VercelからGoogleスプレッドシート（GAS）へデータを安全に転送する
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        nickname: validNickname, 
        parts: parts 
      })
    });

    const result = await response.json();

    // スプレッドシートへの書き込みが成功したら、客席に返事をする
    return res.status(200).json(result);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}