import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!supabaseUrl || !supabaseKey) { console.error('Missing env vars'); process.exit(1) }

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.rpc('get_foreign_keys_info', {})
  if (error) {
    // try direct query 
    console.log('No RPC, querying directly maybe not possible from client. But we can just use the db if we connect to postgres')
  }
}
run()
