import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectFormQuestions(formId) {
    const { data: questions } = await supabase
        .from('form_questions')
        .select('id, label, hse_dimension_id')
        .eq('form_id', formId)
        .order('question_order');

    console.log(`Questões do Formulário ${formId}:\n`);
    questions.forEach((q, i) => {
        console.log(`${i+1}. [ID: ${q.id}] ${q.label} (Dim: ${q.hse_dimension_id || 'NULL'})`);
    });
}

inspectFormQuestions(50);
