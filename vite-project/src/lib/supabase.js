import { createClient } from '@supabase/supabase-js'

// Konfigurasi Supabase Client
const supabaseUrl = 'https://jdiqkppzqfzfvgtbihfp.supabase.co'
const supabaseAnonKey = 'sb_publishable_Pi2eda8ZY5418Y6Vp1VPPw_O1yraPTh'

// Buat instance Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
