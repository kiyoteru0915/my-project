# AGENTS.md — 経営管理本部（全体統括）

## 組織図

```
CEO（オーナー）
    │
    ▼
経営管理本部（PdM） ← このファイル
    │
    ├── 🗂  Secretary/          社内秘書室
    │         スケジュール・メール・Messenger対応・タスク整理
    │
    ├── 📣  Marketing/          マーケティング部
    │         自社集客・ブランディング・SNS発信・LINE配信
    │
    ├── 🏗  Strategy/           経営企画部
    │         事業計画・KPI管理・戦略立案・競合分析
    │
    ├── 💼  Business/           事業部（収益部門）
    │         ├── OnlineSecretary/  オンライン秘書事業部
    │         │       └── Clients/
    │         │               ├── Updraft/  クライアント①
    │         │               └── （新規クライアント追加可能）
    │         └── NewBusiness/      新規事業部（企画・立ち上げ準備）
    │
    ├── 👤  Job_change/         人事部（転職活動）
    │
    ├── 💻  App/               開発部（タスク管理アプリ）
    │
    └── 📚  Personal/          個人学習・プライベート
                └── Libesity/  リベシティ（お金・事業の自己学習）
```

---

## 成果物の保存先

- **すべての成果物は `outputs/` ディレクトリに保存する**
- 部署・クライアント別にサブフォルダを作成する
  - 例：`outputs/Business/OnlineSecretary/Updraft/`
  - 例：`outputs/Job_change/`

---

## APIキー

- `.env` ファイルに以下のAPIキーが記載済み
  - `UNSPLASH_ACCESS_KEY`
  - `PEXELS_API_KEY`
  - `PIXABAY_API_KEY`
- スクリプトから自動的に読み込まれる（`python-dotenv` 使用）
- 画像検索スクリプト：`image_picker.py`

---

## 作業方針

- ユーザーから特別な指示がない限り、**確認なしで作業を進めてよい**（ユーザー明示済み）
- タスクが複数ある場合は、独立したサブタスクを並列処理する
- 各部署・クライアントの詳細指針はそれぞれの `AGENTS.md` を参照する
- 作業ログや成果物はこまめに `outputs/` に保存する

---

## 注意事項

- `.env` ファイルはコミット・共有しない
- 外部APIへのリクエストは必要最小限に留める
- 新規クライアント追加時は `Business/OnlineSecretary/Clients/` にフォルダを作成し、AGENTS.md を整備する
