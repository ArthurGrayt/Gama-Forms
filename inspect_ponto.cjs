const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspect() {
    console.log('Inspecting Tables...');

    // Check Setor
    const { data: setor, error: sErr } = await supabase.from('setor').select('*').limit(1);
    console.log('Setor Sample:', sErr ? sErr : setor);

    // Check Cargos
    const { data: cargos, error: cErr } = await supabase.from('cargos').select('*').limit(1);
    console.log('Cargos Sample:', cErr ? cErr : cargos);

    // Check Cargo_Setor
    const { data: cargoSetor, error: csErr } = await supabase.from('cargo_setor').select('*').limit(1);
    console.log('Cargo_Setor Sample:', csErr ? csErr : cargoSetor);
}

inspect();
