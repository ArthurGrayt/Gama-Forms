// Script para copiar plano_acao_item do formulário template (id=2) para todos os formulários que estão com NULL
const { createClient } = require('@supabase/supabase-js');

// Credenciais do Supabase
const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

// Cria o client do Supabase
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    console.log('=== Correção do plano_acao_item ===\n');

    // 1. Busca o mapeamento pergunta → plano do form template (id=2)
    const { data: templateQuestions, error: tplErr } = await sb
        .from('form_questions')
        .select('label, plano_acao_item, titulo_relatorio')
        .eq('form_id', 2)
        .not('plano_acao_item', 'is', null);

    // Verifica se houve erro ao buscar o template
    if (tplErr) {
        console.error('Erro ao buscar template:', tplErr);
        return;
    }

    // Monta um mapa: label da pergunta → { plano, titulo }
    const templateMap = {};
    templateQuestions.forEach(q => {
        // Normaliza o label removendo espaços extras e convertendo para lowercase
        const key = q.label?.trim().toLowerCase();
        if (key) {
            templateMap[key] = {
                plano_acao_item: q.plano_acao_item,
                titulo_relatorio: q.titulo_relatorio
            };
        }
    });

    console.log(`Template carregado: ${Object.keys(templateMap).length} perguntas com plano.\n`);

    // 2. Busca todas as perguntas HSE que estão sem plano_acao_item
    const { data: emptyQuestions, error: emptyErr } = await sb
        .from('form_questions')
        .select('id, form_id, label, plano_acao_item, titulo_relatorio')
        .not('hse_dimension_id', 'is', null)
        .is('plano_acao_item', null);

    // Verifica se houve erro
    if (emptyErr) {
        console.error('Erro ao buscar perguntas sem plano:', emptyErr);
        return;
    }

    console.log(`Encontradas ${emptyQuestions.length} perguntas HSE sem plano_acao_item.\n`);

    // 3. Para cada pergunta sem plano, tenta encontrar o plano correspondente no template
    let updated = 0;
    let notFound = 0;
    // Agrupa por form_id para log mais limpo
    const byForm = {};

    for (const q of emptyQuestions) {
        // Normaliza o label da pergunta
        const key = q.label?.trim().toLowerCase();
        // Busca no template
        const match = templateMap[key];

        if (match) {
            // Monta o objeto de update — só atualiza campos que estão vazios
            const updatePayload = {};
            if (!q.plano_acao_item && match.plano_acao_item) {
                updatePayload.plano_acao_item = match.plano_acao_item;
            }
            if (!q.titulo_relatorio && match.titulo_relatorio) {
                updatePayload.titulo_relatorio = match.titulo_relatorio;
            }

            // Só faz update se há algo para atualizar
            if (Object.keys(updatePayload).length > 0) {
                const { error: upErr } = await sb
                    .from('form_questions')
                    .update(updatePayload)
                    .eq('id', q.id);

                if (upErr) {
                    console.error(`  ❌ Erro ao atualizar question ${q.id} (form ${q.form_id}):`, upErr.message);
                } else {
                    updated++;
                    // Registra no agrupamento por form
                    if (!byForm[q.form_id]) byForm[q.form_id] = 0;
                    byForm[q.form_id]++;
                }
            }
        } else {
            notFound++;
            console.log(`  ⚠️  Sem correspondência no template: "${q.label?.substring(0, 50)}..." (form ${q.form_id})`);
        }
    }

    // 4. Resumo final
    console.log('\n=== Resumo ===');
    console.log(`✅ Perguntas atualizadas: ${updated}`);
    console.log(`⚠️  Sem correspondência: ${notFound}`);
    console.log('\nPor formulário:');
    // Ordena e exibe o resumo por form
    Object.entries(byForm)
        .sort(([a], [b]) => Number(a) - Number(b))
        .forEach(([formId, count]) => {
            console.log(`  Form ${formId}: ${count} perguntas corrigidas`);
        });

    console.log('\n✅ Concluído!');
}

// Executa o script
run().catch(err => console.error('Erro fatal:', err));
