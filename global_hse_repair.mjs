import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';
const supabase = createClient(supabaseUrl, supabaseKey);

// Mapeamento de Dimensões por Texto da Pergunta (Padrão HSE 35 Itens)
const dimensionMapping = {
    "Exigências do Trabalho": [
        "Tenho de trabalhar muito intensamente",
        "Tenho de trabalhar muito depressa",
        "Tenho de descurar algumas tarefas porque tenho demasiado que fazer",
        "Não tenho tempo suficiente para fazer o meu trabalho",
        "Trabalho sob pressão para cumprir prazos",
        "Não me é possível fazer pausas",
        "Tenho de trabalhar horas excessivas",
        "Tenho de trabalhar sem a formação adequada"
    ],
    "Controle": [
        "Posso decidir o modo como faço o meu trabalho",
        "Tenho margem de manobra sobre a rapidez com que trabalho",
        "Tenho voz na forma como o meu trabalho é organizado",
        "Posso fazer pausas quando necessito",
        "Tenho influência sobre o meu horário de trabalho",
        "O meu trabalho é variado"
    ],
    "Apoio Social (Chefia e Colegas)": [
        "Tenho apoio dos meus colegas",
        "Recebo a ajuda e o apoio de que necessito dos meus colegas",
        "Os meus colegas dão-me feedback sobre o meu desempenho",
        "Posso contar com o apoio da minha chefia direta quando o trabalho se torna difícil",
        "A minha chefia direta incentiva-me no trabalho",
        "Consigo falar com a minha chefia sobre coisas que me perturbam no trabalho"
    ],
    "Relacionamentos": [
        "Sinto-me pressionado pelos meus colegas no trabalho",
        "Sou alvo de comportamentos ofensivos no trabalho",
        "Existem conflitos interpessoais no meu local de trabalho",
        "Sou intimidado no meu local de trabalho"
    ],
    "Papel na Organização": [
        "Tenho clareza sobre o que se espera de mim no trabalho",
        "Conheço bem os meus objetivos e responsabilidades",
        "Sei como o meu trabalho contribui para o sucesso da organização",
        "Recebo orientações contraditórias de pessoas diferentes",
        "O meu papel no trabalho é claro"
    ],
    "Mudança Organizacional": [
        "Sou consultado sobre mudanças que ocorrem no meu trabalho",
        "Recebo informações suficientes sobre mudanças na organização",
        "Tenho oportunidade de questionar sobre mudanças que me afetam"
    ],
    "Estresse e Bem-estar": [
        "Sinto-me stressado com o meu trabalho",
        "O meu trabalho afeta negativamente a minha vida pessoal",
        "Sinto-me exausto ao fim do dia de trabalho",
        "Tenho dificuldade em relaxar após o trabalho",
        "Sinto-me satisfeito com o meu trabalho atual"
    ]
};

async function repairAllHseForms() {
    console.log('🚀 Iniciando Reparo Global HSE...');

    // 1. Buscar Dimensões Oficiais
    const { data: dims } = await supabase.from('form_hse_dimensions').select('id, name');
    const dimMap = {};
    if (dims) {
        dims.forEach(d => {
            dimMap[d.name.trim()] = d.id;
        });
    }

    // 2. Buscar Formulários HSE
    const { data: forms, error: formsError } = await supabase
        .from('forms')
        .select('id, title, hse_id, setor')
        .or('hse_id.not.is.null,title.ilike.%HSE%');

    if (formsError) {
        console.error('Erro ao buscar formulários:', formsError);
        return;
    }

    console.log(`Encontrados ${forms.length} formulários HSE para analisar.\n`);

    for (const form of forms) {
        // a. Buscar Questões
        const { data: questions } = await supabase
            .from('form_questions')
            .select('id, label, hse_dimension_id')
            .eq('form_id', form.id);

        if (!questions || questions.length === 0) continue;

        console.log(`\n📦 Processando Form ID ${form.id}: "${form.title}"`);

        let qUpdated = 0;
        for (const q of questions) {
            // Se já tem dimensão válida, pula
            // if (q.hse_dimension_id) continue;

            const label = q.label.toLowerCase().trim();
            let matchedDimId = null;

            for (const [dimName, phrases] of Object.entries(dimensionMapping)) {
                if (phrases.some(p => label.includes(p.toLowerCase().trim()))) {
                    matchedDimId = dimMap[dimName];
                    break;
                }
            }

            if (matchedDimId) {
                const { error: updateError } = await supabase
                    .from('form_questions')
                    .update({ hse_dimension_id: matchedDimId })
                    .eq('id', q.id);
                
                if (!updateError) qUpdated++;
            }
        }
        console.log(`   ✅ Questões atualizadas: ${qUpdated}/${questions.length}`);

        // b. Buscar e Corrigir Respostas (Setor)
        if (form.setor) {
            const { data: answersToUpdate } = await supabase
                .from('form_answers')
                .select('id')
                .eq('form_id', form.id)
                .or('setor.is.null,setor.eq.""');

            if (answersToUpdate && answersToUpdate.length > 0) {
                const ids = answersToUpdate.map(a => a.id);
                
                // Resolver nome do setor se for ID
                let setorNome = form.setor;
                if (!isNaN(parseInt(form.setor))) {
                    const { data: sData } = await supabase
                        .from('setor')
                        .select('nome')
                        .eq('id', form.setor)
                        .maybeSingle();
                    if (sData) setorNome = sData.nome;
                }

                const { error: aError } = await supabase
                    .from('form_answers')
                    .update({ setor: setorNome })
                    .in('id', ids);

                if (!aError) {
                    console.log(`   ✅ Respostas (Setor) atualizadas: ${ids.length}`);
                }
            }
        }
    }

    console.log('\n✨ Reparo Global HSE Concluído!');
}

repairAllHseForms();
