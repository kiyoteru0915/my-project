import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || 'https://wahpslrkphdozwzuzcqj.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhaHBzbHJrcGhkb3p3enV6Y3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTMwNTUsImV4cCI6MjA5MDc4OTA1NX0.KJYgAjhjjCzsMJ2jNM-11NNh8JSKw2majX7YnYf8ee4'

export const supabase = createClient(url, key)
export const isSupabaseEnabled = true
