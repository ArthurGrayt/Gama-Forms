import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runDiagnostic() {
    console.log('--- DIAGNÓSTICO GLOBAL HSE ---\n');

    // 1. Buscar todos os formulários HSE
    const { data: forms, error: formsError } = await supabase
        .from('forms')
        .select('id, title, hse_id, setor')
        // Consideramos HSE se houver hse_id OU se o título contiver "HSE"
        .or('hse_id.not.is.null,title.ilike.%HSE%');

    if (formsError) {
        console.error('Erro ao buscar formulários:', formsError);
        return;
    }

    console.log(`Encontrados ${forms.length} potenciais formulários HSE.\n`);

    for (const form of forms) {
        // Verificar se tem questões
        const { count: qTotal } = await supabase
            .from('form_questions')
            .select('id', { count: 'exact', head: true })
            .eq('form_id', form.id);

        if (!qTotal) continue;

        console.log(`Formulário ID ${form.id}: "${form.title}" (HSE ID: ${form.hse_id || 'N/A'})`);

        // 2. Verificar questões sem dimensão
        const { data: issuesQ } = await supabase
            .from('form_questions')
            .select('id')
            .eq('form_id', form.id)
            .is('hse_dimension_id', null);

        console.log(`  - Questões: ${issuesQ?.length || 0} de ${qTotal} sem hse_dimension_id.`);

        // 3. Verificar respostas sem setor
        const { data: issuesA } = await supabase
            .from('form_answers')
            .select('id')
            .eq('form_id', form.id)
            .or('setor.is.null,setor.eq.""');

        const { count: aTotal } = await supabase
            .from('form_answers')
            .select('id', { count: 'exact', head: true })
            .eq('form_id', form.id);

        console.log(`  - Respostas: ${issuesA?.length || 0} de ${aTotal || 0} sem setor preenchido.\n`);
    }
}

runDiagnostic();
