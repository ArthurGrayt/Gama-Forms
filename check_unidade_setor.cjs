const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    console.log("Empty array:");
    const res1 = await supabase.from('setor').select('id, nome').in('id', []);
    console.log("Empty array count:", res1.data?.length, "error:", res1.error?.message);

    console.log("Array with undefined:");
    const res2 = await supabase.from('setor').select('id, nome').in('id', [undefined]);
    console.log("Undefined count:", res2.data?.length, "error:", res2.error?.message);

    console.log("Array with null:");
    const res3 = await supabase.from('setor').select('id, nome').in('id', [null]);
    console.log("Null count:", res3.data?.length, "error:", res3.error?.message);
}
run();
