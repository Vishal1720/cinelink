// supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wiggitkoxqislzddubuk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZ2dpdGtveHFpc2x6ZGR1YnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjQxNDEsImV4cCI6MjA3ODYwMDE0MX0.qWSSpTEFaocZVKr5bHgjxaeBx25lp8V45jLWOdl4ANo'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
