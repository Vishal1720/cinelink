// supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dowajfihjdlcirzurqnl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvd2FqZmloamRsY2lyenVycW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NzQ0MTEsImV4cCI6MjA3ODE1MDQxMX0.XMEggEWbH4_kWk24CwC4Hp1yzdOysWNHo2tnIlwPcFI'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
