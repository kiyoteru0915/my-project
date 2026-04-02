import { SubTaskSegment, MilestoneTask } from '../types'
import { addDays, differenceInDays, format } from 'date-fns'

function genId() { return Math.random().toString(36).substring(2, 11) }

export interface SuggestionPlan {
  id: string
  label: string        // プラン名（例：「バランス型」）
  description: string  // 一言説明
  segments: Omit<SubTaskSegment, 'id' | 'completed'>[]
  milestoneNames: string[]  // マイルストーン名（割合は後で計算）
}

// ───── キーワード別セグメント・マイルストーン定義 ─────

type TaskCategory =
  | 'press'      // プレスリリース・広報
  | 'design'     // デザイン・UI/UX
  | 'report'     // レポート・調査・分析
  | 'meeting'    // 会議・ミーティング・プレゼン
  | 'dev'        // 開発・実装・プログラム
  | 'planning'   // 企画・戦略・計画
  | 'general'    // その他

function detectCategory(title: string): TaskCategory {
  const t = title
  if (/プレス|リリース|広報|PR|発表/.test(t)) return 'press'
  if (/デザイン|UI|UX|ワイヤー|モック|Figma/.test(t)) return 'design'
  if (/レポート|報告|調査|分析|リサーチ|まとめ/.test(t)) return 'report'
  if (/会議|ミーティング|MTG|打合|プレゼン|発表|資料/.test(t)) return 'meeting'
  if (/開発|実装|コード|プログラム|API|バグ|修正|テスト/.test(t)) return 'dev'
  if (/企画|戦略|計画|提案|プラン|ロードマップ/.test(t)) return 'planning'
  return 'general'
}

// カテゴリ別の3プランを定義
const plansByCategory: Record<TaskCategory, SuggestionPlan[]> = {
  press: [
    {
      id: 'press-1', label: 'スタンダード', description: '原稿作成からレビューまでバランスよく',
      segments: [
        { name: '情報収集・資料確認', durationMinutes: 0 },
        { name: '構成・アウトライン作成', durationMinutes: 0 },
        { name: '本文執筆', durationMinutes: 0 },
        { name: 'レビュー・修正', durationMinutes: 0 },
      ],
      milestoneNames: ['情報収集完了', '構成確定', '初稿完成', '内部レビュー完了', '配信準備完了'],
    },
    {
      id: 'press-2', label: '執筆集中', description: '執筆時間を最大化したい場合',
      segments: [
        { name: '資料確認・準備', durationMinutes: 0 },
        { name: '本文執筆（前半）', durationMinutes: 0 },
        { name: '本文執筆（後半）', durationMinutes: 0 },
        { name: '校正・仕上げ', durationMinutes: 0 },
      ],
      milestoneNames: ['構成確定', '初稿完成', '校正完了', '最終確認・配信準備'],
    },
    {
      id: 'press-3', label: 'レビュー重視', description: '品質確認に時間をかける場合',
      segments: [
        { name: '情報整理', durationMinutes: 0 },
        { name: '執筆', durationMinutes: 0 },
        { name: '第1レビュー', durationMinutes: 0 },
        { name: '修正', durationMinutes: 0 },
        { name: '最終確認', durationMinutes: 0 },
      ],
      milestoneNames: ['初稿完成', '第1レビュー', '修正完了', '最終承認', '配信'],
    },
  ],
  design: [
    {
      id: 'design-1', label: 'スタンダード', description: '調査→設計→制作→レビューの王道フロー',
      segments: [
        { name: '参考調査・インプット', durationMinutes: 0 },
        { name: 'ラフ・アイデアスケッチ', durationMinutes: 0 },
        { name: 'デザイン制作', durationMinutes: 0 },
        { name: 'フィードバック確認', durationMinutes: 0 },
      ],
      milestoneNames: ['調査・方向性確定', 'ワイヤーフレーム完成', 'デザイン初稿', 'フィードバック反映', '最終納品'],
    },
    {
      id: 'design-2', label: '制作集中', description: 'とにかくアウトプットを出す',
      segments: [
        { name: '準備・素材確認', durationMinutes: 0 },
        { name: 'デザイン制作（メイン）', durationMinutes: 0 },
        { name: '細部調整', durationMinutes: 0 },
      ],
      milestoneNames: ['構成確定', '初稿完成', '修正完了', '納品'],
    },
    {
      id: 'design-3', label: '反復改善', description: '試作→フィードバック→改善を繰り返す',
      segments: [
        { name: '要件確認', durationMinutes: 0 },
        { name: '第1案制作', durationMinutes: 0 },
        { name: 'フィードバック反映', durationMinutes: 0 },
        { name: '第2案制作', durationMinutes: 0 },
        { name: '最終調整', durationMinutes: 0 },
      ],
      milestoneNames: ['要件確定', '第1案完成', 'FB収集', '改善完了', '最終納品'],
    },
  ],
  report: [
    {
      id: 'report-1', label: 'スタンダード', description: '情報収集から執筆・確認まで',
      segments: [
        { name: '情報収集・データ収集', durationMinutes: 0 },
        { name: '分析・整理', durationMinutes: 0 },
        { name: 'レポート執筆', durationMinutes: 0 },
        { name: '確認・修正', durationMinutes: 0 },
      ],
      milestoneNames: ['情報収集完了', 'データ分析完了', '初稿完成', 'レビュー完了', '提出'],
    },
    {
      id: 'report-2', label: '分析重視', description: '深い分析に時間をかける',
      segments: [
        { name: '情報収集', durationMinutes: 0 },
        { name: '詳細分析（前半）', durationMinutes: 0 },
        { name: '詳細分析（後半）', durationMinutes: 0 },
        { name: '執筆・まとめ', durationMinutes: 0 },
      ],
      milestoneNames: ['データ収集完了', '一次分析完了', '考察まとめ', '最終レポート完成'],
    },
    {
      id: 'report-3', label: 'スピード重視', description: '素早くまとめて提出',
      segments: [
        { name: '情報収集・整理', durationMinutes: 0 },
        { name: '執筆', durationMinutes: 0 },
        { name: '確認', durationMinutes: 0 },
      ],
      milestoneNames: ['情報収集完了', '初稿完成', '提出'],
    },
  ],
  meeting: [
    {
      id: 'meeting-1', label: 'スタンダード', description: 'アジェンダ設計から後処理まで',
      segments: [
        { name: '目的・アジェンダ確認', durationMinutes: 0 },
        { name: '資料作成・準備', durationMinutes: 0 },
        { name: '内容確認・リハーサル', durationMinutes: 0 },
        { name: '最終チェック', durationMinutes: 0 },
      ],
      milestoneNames: ['目的・論点確定', 'アジェンダ完成', '資料初稿', '内容確認完了', '本番準備完了'],
    },
    {
      id: 'meeting-2', label: '資料重視', description: '説得力のある資料作りに集中',
      segments: [
        { name: '構成設計', durationMinutes: 0 },
        { name: '資料作成', durationMinutes: 0 },
        { name: 'グラフ・図表作成', durationMinutes: 0 },
        { name: '校正・仕上げ', durationMinutes: 0 },
      ],
      milestoneNames: ['構成確定', '本文完成', '図表完成', '最終仕上げ'],
    },
    {
      id: 'meeting-3', label: 'シンプル', description: '最低限の準備で臨む',
      segments: [
        { name: '要点整理', durationMinutes: 0 },
        { name: '資料作成', durationMinutes: 0 },
        { name: '確認', durationMinutes: 0 },
      ],
      milestoneNames: ['論点整理完了', '資料完成', '本番'],
    },
  ],
  dev: [
    {
      id: 'dev-1', label: 'スタンダード', description: '設計→実装→テストの基本フロー',
      segments: [
        { name: '要件確認・設計', durationMinutes: 0 },
        { name: '実装', durationMinutes: 0 },
        { name: 'テスト・デバッグ', durationMinutes: 0 },
        { name: 'コードレビュー対応', durationMinutes: 0 },
      ],
      milestoneNames: ['設計完了', '実装完了', 'テスト完了', 'レビュー完了', 'リリース'],
    },
    {
      id: 'dev-2', label: '実装集中', description: 'コーディングを最優先',
      segments: [
        { name: '仕様確認', durationMinutes: 0 },
        { name: '実装（前半）', durationMinutes: 0 },
        { name: '実装（後半）', durationMinutes: 0 },
        { name: 'テスト・修正', durationMinutes: 0 },
      ],
      milestoneNames: ['設計確定', '基本実装完了', '全機能実装', 'テスト完了'],
    },
    {
      id: 'dev-3', label: 'テスト重視', description: '品質を確実に担保する',
      segments: [
        { name: '設計・準備', durationMinutes: 0 },
        { name: '実装', durationMinutes: 0 },
        { name: 'ユニットテスト', durationMinutes: 0 },
        { name: '統合テスト・修正', durationMinutes: 0 },
        { name: '最終確認', durationMinutes: 0 },
      ],
      milestoneNames: ['設計完了', '実装完了', 'テスト設計完了', 'テスト完了', 'リリース承認'],
    },
  ],
  planning: [
    {
      id: 'plan-1', label: 'スタンダード', description: '調査→設計→資料化の基本フロー',
      segments: [
        { name: '現状調査・情報収集', durationMinutes: 0 },
        { name: '企画・アイデア出し', durationMinutes: 0 },
        { name: '計画書・資料作成', durationMinutes: 0 },
        { name: '確認・修正', durationMinutes: 0 },
      ],
      milestoneNames: ['現状把握', 'コンセプト確定', '計画書初稿', 'レビュー完了', '最終承認'],
    },
    {
      id: 'plan-2', label: 'アイデア重視', description: '発散→収束で最良の案を導く',
      segments: [
        { name: 'インプット・調査', durationMinutes: 0 },
        { name: 'アイデア発散', durationMinutes: 0 },
        { name: 'アイデア絞り込み', durationMinutes: 0 },
        { name: '資料化・整理', durationMinutes: 0 },
      ],
      milestoneNames: ['調査完了', 'アイデア出し完了', '方向性確定', '資料完成'],
    },
    {
      id: 'plan-3', label: '承認重視', description: '関係者への説明・合意を優先',
      segments: [
        { name: '情報整理', durationMinutes: 0 },
        { name: '計画立案', durationMinutes: 0 },
        { name: 'プレゼン資料作成', durationMinutes: 0 },
        { name: '最終チェック', durationMinutes: 0 },
      ],
      milestoneNames: ['現状分析完了', '案作成', 'ステークホルダー確認', '承認取得', '実行開始'],
    },
  ],
  general: [
    {
      id: 'gen-1', label: 'バランス型', description: '準備・実施・確認をバランスよく',
      segments: [
        { name: '準備・確認', durationMinutes: 0 },
        { name: 'メイン作業', durationMinutes: 0 },
        { name: 'レビュー・修正', durationMinutes: 0 },
        { name: '最終確認', durationMinutes: 0 },
      ],
      milestoneNames: ['準備完了', '作業開始', '中間確認', '完成', '提出'],
    },
    {
      id: 'gen-2', label: '集中型', description: 'とにかく本作業に集中',
      segments: [
        { name: '準備', durationMinutes: 0 },
        { name: 'メイン作業（前半）', durationMinutes: 0 },
        { name: 'メイン作業（後半）', durationMinutes: 0 },
        { name: '仕上げ', durationMinutes: 0 },
      ],
      milestoneNames: ['着手', '中間チェック', '完成', '提出'],
    },
    {
      id: 'gen-3', label: 'シンプル', description: 'シンプルに進める',
      segments: [
        { name: '準備・整理', durationMinutes: 0 },
        { name: 'メイン作業', durationMinutes: 0 },
        { name: '確認・完了', durationMinutes: 0 },
      ],
      milestoneNames: ['着手', '中間確認', '完了'],
    },
  ],
}

// 時間を各セグメントに比率で割り当て
function allocateTime(segments: Omit<SubTaskSegment, 'id' | 'completed'>[], totalMinutes: number): SubTaskSegment[] {
  const count = segments.length
  if (count === 0) return []

  // デフォルト比率（準備10%、メイン60-70%、レビュー20-30%）
  const ratios: number[] = []
  if (count === 2) ratios.push(0.2, 0.8)
  else if (count === 3) ratios.push(0.15, 0.65, 0.2)
  else if (count === 4) ratios.push(0.1, 0.5, 0.25, 0.15)
  else ratios.push(...Array(count).fill(1 / count))

  const minutes = ratios.map((r, i) => {
    const m = Math.round(totalMinutes * r)
    return Math.max(1, m)
  })

  // 合計を totalMinutes に揃える
  const diff = totalMinutes - minutes.reduce((a, b) => a + b, 0)
  minutes[Math.floor(count / 2)] += diff

  return segments.map((s, i) => ({
    id: genId(),
    name: s.name,
    durationMinutes: minutes[i],
    completed: false,
  }))
}

// マイルストーンに日付を割り当て
function allocateMilestoneDates(names: string[], startDate: Date, deadline: Date): MilestoneTask[] {
  const totalDays = differenceInDays(deadline, startDate)
  if (totalDays <= 0) return []
  const count = names.length
  return names.map((name, i) => {
    const pct = (i + 1) / (count + 1)
    const daysOffset = Math.round(totalDays * pct)
    return {
      id: genId(),
      name,
      dueDate: format(addDays(startDate, daysOffset), 'yyyy-MM-dd'),
      completed: false,
    }
  })
}

// 外部から使うメイン関数
export function getSuggestionPlans(
  title: string,
  estimatedMinutes: number,
  startDate: Date,
  deadline: Date
): Array<SuggestionPlan & { resolvedSegments: SubTaskSegment[]; resolvedMilestones: MilestoneTask[] }> {
  const category = detectCategory(title)
  const plans = plansByCategory[category]
  return plans.map((plan) => ({
    ...plan,
    resolvedSegments: allocateTime(plan.segments, estimatedMinutes),
    resolvedMilestones: allocateMilestoneDates(plan.milestoneNames, startDate, deadline),
  }))
}
