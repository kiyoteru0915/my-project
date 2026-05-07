# CLAUDE.md — App タスク管理アプリ担当

## 技術スタック

- **フレームワーク**：React + TypeScript
- **スタイリング**：シンプル・使いやすさ重視（過剰な装飾なし）
- **データ保存**：
  - **主**：ブラウザの `localStorage`
  - **同期**：Supabase（クラウドバックアップ・複数端末対応）

---

## ソースコードの場所

- **ソースコード**：`Claude/task_app/src/`
- コンポーネント・ロジックはすべてこのディレクトリ以下に格納する

---

## 主な機能

- **タスク作成**：タイトル・詳細を入力して新規タスクを追加
- **締切日（dueDate）**：タスクに締切日を設定できる
- **実施予定日（plannedDate）**：タスクを実際にいつやるか計画する日付
- **完了管理**：タスクを完了済みにマークする・完了一覧を表示する

---

## データ構造（タスク）

```typescript
type Task = {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;        // 締切日（ISO 8601形式）
  plannedDate?: string;    // 実施予定日（ISO 8601形式）
  completed: boolean;
  createdAt: string;
};
```

---

## Supabase 対応状況

### ⚠️ 未対応：planned_date カラムの追加が必要

- Supabase の `tasks` テーブルに **`planned_date` カラムがまだ存在しない**
- DB 側のマイグレーションが必要（対応待ち）
- それまでは `localStorage` のみで `plannedDate` を保持する
- Supabase 同期時は `planned_date` を含むよう修正が必要

### マイグレーション対応時にやること
1. Supabase ダッシュボード または SQL でカラムを追加
   ```sql
   ALTER TABLE tasks ADD COLUMN planned_date DATE;
   ```
2. フロントエンドの Supabase クライアントコードを修正して `planned_date` を送受信するよう更新

---

## スタイル方針

- **シンプル・使いやすさ重視**
- 不要な装飾・アニメーションは避ける
- モバイルでも使いやすいレイアウトにする
- カラーは落ち着いたトーン（白ベース・アクセントカラー1〜2色）

---

## 開発上の注意事項

- `localStorage` のキー名は統一する（例：`tasks`）
- Supabase との同期はオフライン時もアプリが動作するよう設計する
- TypeScript の型定義を厳密に保つ（`any` 使用禁止）
- コンポーネントは責務を分離してシンプルに保つ
- 成果物・ビルド物は `Claude/outputs/App/` に保存する
