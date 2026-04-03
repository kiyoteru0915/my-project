import { useState } from 'react'
import { X, Copy, Check, RefreshCw, AlertCircle, CloudOff, Loader2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { isSupabaseEnabled } from '../lib/supabase'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Props {
  onClose: () => void
}

export default function SyncModal({ onClose }: Props) {
  const { workspaceId, syncStatus, lastSyncedAt, syncNow, switchWorkspace } = useStore()
  const [copied, setCopied] = useState(false)
  const [inputCode, setInputCode] = useState('')
  const [switching, setSwitching] = useState(false)
  const [switchError, setSwitchError] = useState(false)

  const copyCode = async () => {
    await navigator.clipboard.writeText(workspaceId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSwitch = async () => {
    const code = inputCode.trim()
    if (!code || code === workspaceId) return
    setSwitching(true)
    setSwitchError(false)
    const ok = await switchWorkspace(code)
    setSwitching(false)
    if (ok) {
      onClose()
    } else {
      setSwitchError(true)
    }
  }

  const syncStatusLabel = {
    idle: '',
    syncing: '同期中...',
    synced: '同期済み',
    error: 'エラー',
  }

  const syncStatusColor = {
    idle: 'text-slate-400',
    syncing: 'text-blue-500',
    synced: 'text-green-500',
    error: 'text-red-500',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-800">デバイス間同期</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>

        {!isSupabaseEnabled ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CloudOff size={40} className="text-slate-300" />
            <p className="text-sm text-slate-500">同期機能は設定が必要です。</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Sync status */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2">
                {syncStatus === 'syncing' && <Loader2 size={14} className="text-blue-500 animate-spin" />}
                {syncStatus === 'synced' && <Check size={14} className="text-green-500" />}
                {syncStatus === 'error' && <AlertCircle size={14} className="text-red-500" />}
                <span className={`text-sm font-medium ${syncStatusColor[syncStatus]}`}>
                  {syncStatusLabel[syncStatus] || (lastSyncedAt ? '同期済み' : '未同期')}
                </span>
              </div>
              {lastSyncedAt && (
                <span className="text-xs text-slate-400">
                  {format(parseISO(lastSyncedAt), 'M/d HH:mm', { locale: ja })}
                </span>
              )}
            </div>

            {/* Sync code */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">あなたの同期コード</p>
              <p className="text-xs text-slate-400 mb-2">このコードを別のデバイスで入力するとデータが共有されます</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2.5 bg-slate-100 rounded-xl font-mono text-xs text-slate-600 break-all">
                  {workspaceId}
                </div>
                <button
                  onClick={copyCode}
                  className={`flex-shrink-0 p-2.5 rounded-xl transition-all ${
                    copied ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Manual sync */}
            <button
              onClick={syncNow}
              disabled={syncStatus === 'syncing'}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={15} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
              今すぐ同期する
            </button>

            <hr className="border-slate-200" />

            {/* Enter code from another device */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">別のデバイスのコードを入力</p>
              <p className="text-xs text-slate-400 mb-2">入力するとそのデバイスのデータに切り替わります</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => { setInputCode(e.target.value); setSwitchError(false) }}
                  placeholder="同期コードを貼り付け"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
                />
                <button
                  onClick={handleSwitch}
                  disabled={switching || !inputCode.trim()}
                  className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-700 disabled:opacity-40 transition-colors"
                >
                  {switching ? <Loader2 size={15} className="animate-spin" /> : '切替'}
                </button>
              </div>
              {switchError && (
                <p className="text-xs text-red-500 mt-1.5">コードが見つかりませんでした。正しいコードを確認してください。</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
