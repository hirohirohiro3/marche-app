# Marche App (モバイルオーダープラットフォーム)

## コンセプト
**「行列をなくそう。もっと会話を楽しもう。」**
イベントや店舗での注文・決済をスマホひとつで完結させる、次世代モバイルオーダープラットフォーム。

## アプリの概要
Marche Appは、お客様自身のスマートフォンを使って「注文」から「決済」までを完了できるモバイルオーダーシステムです。
専用アプリのダウンロードは不要。QRコードを読み取るだけで、誰でもすぐに利用できます。

## 主な特徴

### 1. アプリ不要！0秒で注文開始（ゲスト購入）
- **特徴**: 会員登録やアプリのインストールが一切不要です。
- **メリット**: QRコードを読み取るだけでメニューが開き、その場ですぐに注文できます。お客様の手間を極限まで減らし、機会損失を防ぎます。

### 2. 多彩な決済手段に対応（Stripe連携）
- **特徴**: クレジットカードはもちろん、Apple Pay、Google Payに対応。
- **メリット**: スマホに登録済みのカードで、ワンタップで支払いが完了します。
- **ハイブリッド対応**: 「現金」や「PayPay」などの対面支払いも選択可能。お店の運用に合わせて柔軟に使えます。

### 3. インボイス対応のデジタルレシート
- **特徴**: 紙のレシートは不要。メールでデジタルレシートを発行できます。
- **メリット**: インボイス制度（適格請求書）に対応した形式で発行可能。店舗名や登録番号も自由に設定でき、経費精算が必要なお客様にも喜ばれます。

### 4. リアルタイム注文管理
- **特徴**: 注文が入ると店舗側の管理画面に即座に反映されます。
- **メリット**: 「調理待ち」「提供済み」などのステータス管理も簡単。混雑時のオーダーミスや提供漏れを防ぎます。
- **推奨環境**: 店舗管理画面は情報量が多いため、タブレット端末（iPadなど）での利用を推奨します。スマホでも利用可能ですが、タブレットならより快適に一覧性を確保できます。

### 5. シンプルで美しいUI
- **特徴**: 誰でも迷わず使える、直感的でモダンなデザイン。
- **メリット**: 商品画像が映えるレイアウトで、メニューの魅力を最大限に伝えます。

## 利用シーン
- **マルシェ・イベント出店**: 電源やレジスターがなくても、スマホ1つで本格的なレジシステムが導入できます。
- **キッチンカー**: 限られたスペースでも、お客様自身のスマホがレジ代わりになります。
- **カフェ・飲食店**: テーブルオーダーとして導入し、ホールスタッフの負担を軽減します。

## 技術スタック
- **Frontend**: React, TypeScript, Vite, Material UI
- **Backend / Infrastructure**: Firebase (Hosting, Functions, Firestore, Storage)
- **Payment**: Stripe Connect (Express Accounts)

## Getting Started (開発者向け)

### 1. リポジトリのクローン
```bash
git clone <repository-url>
cd marche-app
```

### 2. 依存関係のインストール
```bash
npm install
```

### 3. 環境変数の設定
ルートディレクトリに `.env` ファイルを作成し、以下の変数を設定してください。
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (または pk_live_...)
```

### 4. 開発サーバーの起動
```bash
npm run dev
```
ブラウザで `http://localhost:3000` にアクセスするとアプリが起動します。

### 5. デプロイ (Firebase)
```bash
# ビルド
npm run build

# Firebaseへのデプロイ
firebase deploy
```
