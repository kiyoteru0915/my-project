import { supabase } from './supabase'
import { Project, SubFolder, Task } from '../types'

export interface SyncData {
  projects: Project[]
  subFolders: SubFolder[]
  tasks: Task[]
}

export async function pushAllToCloud(workspaceId: string, data: SyncData): Promise<void> {
  if (!supabase) return

  const [projRes, sfRes, taskRes] = await Promise.all([
    supabase.from('projects').upsert(
      data.projects.map((p) => ({
        id: p.id, workspace_id: workspaceId,
        name: p.name, color: p.color, order: p.order, created_at: p.createdAt,
      }))
    ),
    supabase.from('sub_folders').upsert(
      data.subFolders.map((sf) => ({
        id: sf.id, workspace_id: workspaceId,
        project_id: sf.projectId, name: sf.name, created_at: sf.createdAt,
      }))
    ),
    supabase.from('tasks').upsert(
      data.tasks.map((t) => ({
        id: t.id, workspace_id: workspaceId,
        project_id: t.projectId, sub_folder_id: t.subFolderId ?? null,
        title: t.title, description: t.description,
        deadline: t.deadline, completion_date: t.completionDate ?? null,
        estimated_minutes: t.estimatedMinutes,
        sub_task_segments: t.subTaskSegments, milestones: t.milestones,
        status: t.status, is_today: t.isToday,
        recurrence: t.recurrence, recurrence_day: t.recurrenceDay ?? null,
        order: t.order, created_at: t.createdAt,
        timer_started_at: t.timerStartedAt ?? null,
        timer_elapsed_seconds: t.timerElapsedSeconds,
      }))
    ),
  ])

  if (projRes.error) throw projRes.error
  if (sfRes.error) throw sfRes.error
  if (taskRes.error) throw taskRes.error
}

export async function pullAllFromCloud(workspaceId: string): Promise<SyncData | null> {
  if (!supabase) return null

  const [projRes, sfRes, taskRes] = await Promise.all([
    supabase.from('projects').select('*').eq('workspace_id', workspaceId).order('order'),
    supabase.from('sub_folders').select('*').eq('workspace_id', workspaceId),
    supabase.from('tasks').select('*').eq('workspace_id', workspaceId).order('order'),
  ])

  if (projRes.error || sfRes.error || taskRes.error) return null

  return {
    projects: (projRes.data ?? []).map((p) => ({
      id: p.id, name: p.name, color: p.color, order: p.order, createdAt: p.created_at,
    })),
    subFolders: (sfRes.data ?? []).map((sf) => ({
      id: sf.id, projectId: sf.project_id, name: sf.name, createdAt: sf.created_at,
    })),
    tasks: (taskRes.data ?? []).map((t) => ({
      id: t.id, projectId: t.project_id, subFolderId: t.sub_folder_id ?? undefined,
      title: t.title, description: t.description,
      deadline: t.deadline, completionDate: t.completion_date ?? undefined,
      estimatedMinutes: t.estimated_minutes,
      subTaskSegments: t.sub_task_segments, milestones: t.milestones,
      status: t.status, isToday: t.is_today,
      recurrence: t.recurrence, recurrenceDay: t.recurrence_day ?? undefined,
      order: t.order, createdAt: t.created_at,
      timerStartedAt: t.timer_started_at ?? undefined,
      timerElapsedSeconds: t.timer_elapsed_seconds,
    })),
  }
}

export async function deleteFromCloud(
  workspaceId: string,
  table: 'projects' | 'sub_folders' | 'tasks',
  id: string
): Promise<void> {
  if (!supabase) return
  await supabase.from(table).delete().eq('id', id).eq('workspace_id', workspaceId)
}
