import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkHSEOptions() {
  const formIds = [50, 52, 54, 55, 56, 62, 63, 64];
  console.log(`Auditing options for forms: ${formIds.join(', ')}`);

  const { data, error } = await supabase
    .from('form_questions')
    .select('form_id, label, option_1, option_2, option_3, option_4, option_5')
    .in('form_id', formIds)
    .order('form_id', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  const duplicates = [];

  data.forEach(q => {
    const options = [q.option_1, q.option_2, q.option_3, q.option_4, q.option_5];
    const uniqueOptions = new Set(options.filter(Boolean));
    
    if (uniqueOptions.size < options.filter(Boolean).length) {
      duplicates.push(q);
      console.log(`\n[DUP] Form: ${q.form_id} | Question: ${q.label.substring(0, 40)}...`);
      console.log(`1: ${q.option_1}`);
      console.log(`2: ${q.option_2}`);
      console.log(`3: ${q.option_3}`);
      console.log(`4: ${q.option_4}`);
      console.log(`5: ${q.option_5}`);
    }
  });

  if (duplicates.length === 0) {
    console.log('\nNo duplicated options found in DB for these forms.');
  } else {
    console.log(`\nFound ${duplicates.length} questions with duplicated options.`);
  }
}

checkHSEOptions();
