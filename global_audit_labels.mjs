import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function globalAuditLabels() {
  console.log('Global audit of question labels...');
  
  const { data, error } = await supabase
    .from('form_questions')
    .select('id, form_id, label, option_1, option_2, option_3, option_4, option_5');

  if (error) {
    console.error(error);
    return;
  }

  let found = 0;
  data.forEach(q => {
    const rawOptions = [q.option_1, q.option_2, q.option_3, q.option_4, q.option_5];
    const cleanOptions = rawOptions.filter(Boolean).map(o => o.trim().toLowerCase());
    
    const unique = new Set(cleanOptions);
    if (unique.size < cleanOptions.length) {
      found++;
      console.log(`\n[DUP] ID: ${q.id} | Form: ${q.form_id} | Question: ${q.label}`);
      console.log(`- Options: ${JSON.stringify(rawOptions)}`);
    }
  });

  console.log(`\nFound ${found} questions with duplicated labels.`);
}

globalAuditLabels();
