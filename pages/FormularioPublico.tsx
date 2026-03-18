
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Form, FormQuestion, Collaborator } from '../types';
import { CheckCircle, Check, AlertCircle, ChevronRight, Send, Star, User, Hash, ChevronDown, Building2, MapPin, Briefcase, Search, Plus } from 'lucide-react';

const LoadingScreen = () => (
    <div className="fixed inset-0 bg-gray-50 z-50 flex items-center justify-center font-sans antialiased">
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap');
            
            @keyframes text-slide {
                0%, 27.777% { transform: translateY(0%); }
                33.333%, 61.111% { transform: translateY(-25%); }
                66.666%, 94.444% { transform: translateY(-50%); }
                100% { transform: translateY(-75%); }
            }

            .slider {
                animation: text-slide 6.5s cubic-bezier(0.83, 0, 0.17, 1) infinite;
            }

            .gpu-text {
                transform: translateZ(0);
                backface-visibility: hidden;
                -webkit-font-smoothing: antialiased;
            }
        `}</style>

        <div className="flex flex-col items-center justify-center text-[#35b6cf] font-bold text-5xl gap-1" style={{ fontFamily: "'Outfit', sans-serif" }}>

            {/* LINE 1: Uma Gama */}
            <div className="flex items-baseline gap-2">
                <span className="gpu-text">Uma</span>

                <span className="flex items-baseline gpu-text">
                    <img src="/corped.png" alt="" className="h-[1.25em] w-auto relative top-[0.25em] -mr-1" />
                    <span>ama</span>
                </span>
            </div>

            {/* LINE 2: de [Animation] */}
            <div className="flex items-baseline gap-2">
                <span className="gpu-text">de</span>

                {/* TEXTO ANIMADO */}
                <div className="overflow-hidden h-[1.3em] -mt-2">
                    <div className="slider gpu-text">
                        <span className="block h-[1.3em] leading-[1.3em]">ideias</span>
                        <span className="block h-[1.3em] leading-[1.3em]">soluções</span>
                        <span className="block h-[1.3em] leading-[1.3em]">inovações</span>
                        {/* Clone of first item for infinite loop illusion */}
                        <span className="block h-[1.3em] leading-[1.3em]">ideias</span>
                    </div>
                </div>
            </div>

        </div>
    </div>
);

const CustomSelect = ({ options, value, onChange, placeholder = 'Selecione...' }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
        const handleResize = () => setIsOpen(false);
        const handleScroll = () => setIsOpen(false);

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, []);

    const handleOpen = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width
            });
            setIsOpen(!isOpen);
        }
    };

    return (
        <div className="relative max-w-xs" ref={triggerRef}>
            {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
            <div
                onClick={handleOpen}
                className={`w-full px-4 py-3 bg-white border rounded-md transition-all cursor-pointer flex justify-between items-center relative z-20 ${isOpen ? 'border-[#35b6cf] ring-2 ring-[#35b6cf]/10' : 'border-slate-200 hover:border-slate-300'}`}
            >
                <span className={value ? 'text-slate-800' : 'text-slate-400'}>
                    {value || placeholder}
                </span>
                <ChevronDown size={16} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div
                    className="fixed z-50 bg-white border border-slate-100 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        top: `${coords.top}px`,
                        left: `${coords.left}px`,
                        width: `${coords.width}px`
                    }}
                >
                    {options.map((opt: string) => (
                        <div
                            key={opt}
                            onClick={() => {
                                onChange(opt);
                                setIsOpen(false);
                            }}
                            className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex justify-between items-center ${value === opt ? 'bg-blue-50 text-[#35b6cf] font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            {opt}
                            {value === opt && <Check size={14} />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Searchable Select Component for Registration
const SearchableSelect = ({ options, value, onChange, placeholder, disabled, icon: Icon, requireSearch, noResultsContent }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: any) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const filteredOptions = options.filter((opt: any) =>
        String(opt.label || '').toLowerCase().includes(search.toLowerCase())
    );

    const selectedLabel = options.find((opt: any) => opt.value === value)?.label || '';

    return (
        <div className="relative" ref={wrapperRef}>
            {Icon && <Icon size={16} className="absolute left-3 top-3 text-slate-400 pointer-events-none z-10" />}
            <div
                className={`w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer flex justify-between items-center ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={selectedLabel ? 'text-slate-800' : 'text-slate-400 truncate'}>
                    {selectedLabel || placeholder}
                </span>
                <ChevronDown size={14} className="text-slate-400" />
            </div>

            {isOpen && !disabled && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
                        <div className="relative">
                            <Search size={14} className="absolute left-2 top-2.5 text-slate-400" />
                            <input
                                autoFocus
                                type="text"
                                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                placeholder="Buscar..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {!search && requireSearch ? (
                            <div className="px-4 py-8 text-sm text-slate-400 text-center flex flex-col items-center gap-2">
                                <Search size={24} className="opacity-20" />
                                Digite para buscar sua empresa
                            </div>
                        ) : filteredOptions.length > 0 ? (
                            filteredOptions.map((opt: any) => (
                                <div
                                    key={opt.value}
                                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors ${opt.value === value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600'}`}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    {opt.label}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-slate-400 text-center">
                                {noResultsContent || 'Nenhum resultado'}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export const FormularioPublico: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [form, setForm] = useState<Form | null>(null);
    const [questions, setQuestions] = useState<FormQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    // Identity State
    const [cpf, setCpf] = useState('');
    const [checkingCpf, setCheckingCpf] = useState(false);
    const [collaborator, setCollaborator] = useState<Collaborator | null>(null);
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    // Form State
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [step, setStep] = useState<'cover' | 'cpf_check' | 'form'>('cover');
    const [currentSection, setCurrentSection] = useState(0);

    const sections = React.useMemo(() => {
        if (!form) return [];
        const list: { title?: string; questions: FormQuestion[] }[] = [{ title: 'Principal', questions: [] }];

        questions.forEach(q => {
            if (q.question_type === 'section_break') {
                list.push({ title: q.label || 'Nova Seção', questions: [] });
            } else {
                list[list.length - 1].questions.push(q);
            }
        });
        return list;
    }, [questions, form]);

    useEffect(() => {
        if (slug) fetchForm();
    }, [slug]);

    useEffect(() => {
        if (form?.title) document.title = form.title;
    }, [form]);

    const fetchForm = async () => {
        setLoading(true);
        const minWaitPromise = new Promise(resolve => setTimeout(resolve, 2000));

        // 1. Get Form
        const { data: formData, error: formError } = await supabase
            .from('forms')
            .select('*')
            .eq('slug', slug)
            .eq('active', true)
            .single();

        if (formError || !formData) {
            setError('Formulário não encontrado ou inativo.');
            setLoading(false);
            return;
        }

        // Busca dados adicionais de forma separada e segura
        if (formData.empresa) {
            const { data: companyData } = await supabase
                .from('clientes')
                .select('cnpj')
                .eq('id', formData.empresa)
                .single();
            // @ts-ignore
            formData.company_cnpj = companyData?.cnpj;
        }

        if (formData.setor) {
            const { data: sectorData } = await supabase
                .from('setor')
                .select('nome')
                .eq('id', formData.setor)
                .single();
            // @ts-ignore
            formData.sector_name = sectorData?.nome;
        }

        setForm(formData);

        // 2. Get Questions
        const { data: questionData } = await supabase
            .from('form_questions')
            .select('*')
            .eq('form_id', formData.id)
            .order('question_order', { ascending: true });

        if (questionData) {
            // Randomize questions while preserving sections
            const shuffle = (array: any[]) => {
                const newArr = [...array];
                for (let i = newArr.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
                }
                return newArr;
            };

            const shuffledQuestions: any[] = [];
            let currentSectionBuffer: any[] = [];

            questionData.forEach(q => {
                if (q.question_type === 'section_break') {
                    // Flush current section shuffled
                    if (currentSectionBuffer.length > 0) {
                        shuffledQuestions.push(...shuffle(currentSectionBuffer));
                        currentSectionBuffer = [];
                    }
                    // Push break as is
                    shuffledQuestions.push(q);
                } else {
                    currentSectionBuffer.push(q);
                }
            });

            // Flush remaining
            if (currentSectionBuffer.length > 0) {
                shuffledQuestions.push(...shuffle(currentSectionBuffer));
            }

            setQuestions(shuffledQuestions);
        }

        await minWaitPromise;
        setLoading(false);
    };

    const validateCPF = (cpf: string) => {
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf === '') return false;
        if (cpf.length !== 11 ||
            /^(\d)\1{10}$/.test(cpf)) return false;

        let add = 0;
        for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
        let rev = 11 - (add % 11);
        if (rev === 10 || rev === 11) rev = 0;
        if (rev !== parseInt(cpf.charAt(9))) return false;

        add = 0;
        for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
        rev = 11 - (add % 11);
        if (rev === 10 || rev === 11) rev = 0;
        if (rev !== parseInt(cpf.charAt(10))) return false;

        return true;
    };

    const handleCheckCPF = async () => {
        // Valida o CPF antes de prosseguir
        if (!validateCPF(cpf)) {
            if (!window.confirm("CPF parece inválido ou incompleto. Deseja continuar mesmo assim?")) {
                return;
            }
        }

        // Ativa o estado de loading do botão de verificação
        setCheckingCpf(true);

        // Remove TODOS os caracteres não numéricos do CPF digitado (pontos, traços, espaços, etc.)
        const cleanCpf = cpf.replace(/\D/g, '');

        // Gera as variantes mais comuns de formatação do CPF para a busca
        const formattedCpf = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        // Ex: CPF "12345678900" pode estar salvo como "123.456.789-00" ou "12345678900" ou "123 456 789-00"
        // A estratégia abaixo cobre os casos mais frequentes de formatação

        // ─── ESTRATÉGIA 1: Busca exata (com e sem formatação) ───────────────────────────
        // Tenta encontrar o colaborador pelo CPF limpo OU pelo CPF formatado no padrão ex: "123.456.789-00"
        // Filtra pela empresa do formulário se disponível, para garantir o contexto correto
        let colabData: any = null;

        // Monta a lista de unidades da empresa do formulário para restringir a busca por contexto
        let unitIdsFromForm: number[] = [];
        if (form?.empresa) {
            // Busca todos os IDs de unidades vinculadas à empresa dona do formulário
            const { data: unidadesDaEmpresa } = await supabase
                .from('unidades')
                .select('id')
                .eq('empresaid', form.empresa);

            // Extrai apenas os IDs das unidades em um array simples
            if (unidadesDaEmpresa && unidadesDaEmpresa.length > 0) {
                unitIdsFromForm = unidadesDaEmpresa.map(u => u.id);
            }
        }

        // Busca o colaborador: tenta as variantes CPF limpo e CPF formatado com pontos/traço
        if (unitIdsFromForm.length > 0) {
            // ─── COM FILTRO DE EMPRESA: busca apenas nas unidades do formulário ─────────
            // Tenta a busca exata primeiro (limpo OU formatado), filtrando pelas unidades corretas
            const { data: resultExato } = await supabase
                .from('colaboradores')
                .select('*')
                .or(`cpf.eq.${cleanCpf},cpf.eq.${formattedCpf}`)
                .in('unidade', unitIdsFromForm)
                .maybeSingle();

            colabData = resultExato;

            // ─── FALLBACK: Se a busca exata falhar, tenta via ILIKE (busca parcial p/ formatos exóticos) ──
            // Isso cobre casos onde o CPF foi salvo com espaços, pontos duplos, ou outros separadores
            if (!colabData && cleanCpf.length === 11) {
                // Monta um padrão de busca que pega o CPF como uma sequência de dígitos
                // Ex: "12345678900" -> busca por "%1%2%3%4%5%6%7%8%9%0%0%" para tolerar qualquer separador
                // Abordagem alternativa: usar os primeiros 6 e últimos 2 dígitos para ser menos restritivo
                const prefixo = cleanCpf.substring(0, 6); // Primeiros 6 dígitos
                const sufixo  = cleanCpf.substring(9, 11); // 2 dígitos do verificador

                const { data: resultIlike } = await supabase
                    .from('colaboradores')
                    .select('*')
                    .ilike('cpf', `%${prefixo}%${sufixo}`) // Tolera qualquer formatação entre prefixo e sufixo
                    .in('unidade', unitIdsFromForm)
                    .limit(5); // Limita para evitar falsos positivos em volume

                // Valida os candidatos retornados, verificando se os dígitos batem exatamente
                if (resultIlike && resultIlike.length > 0) {
                    // Normaliza cada candidato e compara apenas os números brutos
                    colabData = resultIlike.find(c =>
                        (c.cpf || '').replace(/\D/g, '') === cleanCpf
                    ) || null;
                }
            }
        } else {
            // ─── SEM FILTRO DE EMPRESA: busca global (segurança para formulários sem empresa associada) ──
            const { data: resultGlobal } = await supabase
                .from('colaboradores')
                .select('*')
                .or(`cpf.eq.${cleanCpf},cpf.eq.${formattedCpf}`)
                .maybeSingle();

            colabData = resultGlobal;

            // Fallback ILIKE sem filtro de empresa
            if (!colabData && cleanCpf.length === 11) {
                const prefixo = cleanCpf.substring(0, 6);
                const sufixo  = cleanCpf.substring(9, 11);

                const { data: resultIlike } = await supabase
                    .from('colaboradores')
                    .select('*')
                    .ilike('cpf', `%${prefixo}%${sufixo}`)
                    .limit(10);

                // Confirma a correspondência exata de dígitos para evitar falsos positivos
                if (resultIlike && resultIlike.length > 0) {
                    colabData = resultIlike.find(c =>
                        (c.cpf || '').replace(/\D/g, '') === cleanCpf
                    ) || null;
                }
            }
        }

        // ─── RESULTADO DA BUSCA ──────────────────────────────────────────────────────────
        if (colabData) {
            // Verifica se o colaborador encontrado está marcado como inativo
            if (colabData.ativo === 'inativo') {
                alert("Seu cadastro está inativo nesta empresa. Por favor, entre em contato com o suporte ou RH.");
                setCheckingCpf(false);
                return;
            }

            // Colaborador encontrado e ativo! Busca o nome da empresa via unidade para exibição
            let companyName = '';
            if (colabData.unidade) {
                // Consulta a unidade para obter o ID da empresa pai
                const { data: unitData } = await supabase
                    .from('unidades')
                    .select('empresaid')
                    .eq('id', colabData.unidade)
                    .single();

                // Com o ID da empresa, busca o nome fantasia para exibir na tela do formulário
                if (unitData?.empresaid) {
                    const { data: companyData } = await supabase
                        .from('clientes')
                        .select('nome_fantasia, razao_social')
                        .eq('id', unitData.empresaid)
                        .single();
                    companyName = companyData?.nome_fantasia || companyData?.razao_social || '';
                }
            }

            // Atualiza o estado com o colaborador identificado e avança para a etapa do formulário
            setCollaborator({ ...colabData, empresa_nome: companyName });
            setStep('form');
        } else {
            // Colaborador não encontrado em nenhuma das estratégias -> abre o modal de cadastro
            setShowRegisterModal(true);
        }

        // Finaliza o estado de loading independentemente do resultado
        setCheckingCpf(false);
    };

    const handleRegistrationSuccess = (newColab: Collaborator) => {
        setCollaborator(newColab);
        setShowRegisterModal(false);
        setStep('form');
    };

    const handleAnswerChange = (questionId: number, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const validate = (qs: FormQuestion[]) => {
        for (const q of qs) {
            if (q.required) {
                const val = answers[q.id];
                if (val === undefined || val === '' || val === null) {
                    alert(`A pergunta "${q.label}" é obrigatória.`);
                    return false;
                }
            }
        }
        return true;
    };

    const handleNext = () => {
        const currentQs = sections[currentSection].questions;
        if (validate(currentQs)) {
            setCurrentSection(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        if (currentSection > 0) {
            setCurrentSection(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        // If section 0, do nothing or confirm exit?
    };

    const handleSubmit = async () => {
        const currentQs = sections[currentSection].questions;
        if (!validate(currentQs)) return;
        if (!form || !collaborator) return;

        setLoading(true);

        // — DIAGNÓSTICO: loga o que vai ser inserido antes de enviar
        console.log('[Submit] Total de perguntas:', questions.length);
        console.log('[Submit] Total de respostas preenchidas (state answers):', Object.keys(answers).length);
        console.log('[Submit] Colaborador ID:', collaborator.id);
        console.log('[Submit] Form ID:', form.id);

        const answersToInsert = questions
            .filter(q => q.question_type !== 'section_break')  // Ignora separadores de seção
            .filter(q => answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== '') // Só inclui perguntas respondidas
            .map(q => {
                const val = answers[q.id];

                // Mapeia respostas em texto para números se aplicável
                let answerNumber: number | null = null;
                if (q.question_type === 'rating') {
                    // Para rating, o valor já é numérico
                    answerNumber = Number(val);
                } else {
                    // Tabela de conversão de texto para número (escala Likert HSE)
                    const textToNumberMap: Record<string, number> = {
                        'nunca': 0,
                        'raramente': 1,
                        'as vezes': 2,
                        'às vezes': 2,
                        'frequentemente': 3,
                        'sempre': 4
                    };
                    // Normaliza e converte
                    const valStr = String(val).trim().toLowerCase();
                    if (Object.prototype.hasOwnProperty.call(textToNumberMap, valStr)) {
                        answerNumber = textToNumberMap[valStr];
                    }
                }

                return {
                    form_id: form.id,
                    question_id: q.id,
                    respondedor: collaborator.id,
                    unidade: collaborator.unidade || null,
                    setor: collaborator.setor || null,
                    cargo: collaborator.cargo || null,
                    answer_text: (q.question_type !== 'rating') ? String(val) : null,
                    answer_number: answerNumber,
                };
            });

        // Loga o array final para verificar se está preenchido
        console.log('[Submit] answersToInsert (', answersToInsert.length, 'linhas):', answersToInsert);

        if (answersToInsert.length === 0) {
            console.warn('[Submit] Nenhuma resposta para inserir — verifique o preenchimento do formulário.');
            alert('Nenhuma resposta detectada. Por favor, preencha o formulário.');
            setLoading(false);
            return;
        }

        const { data: insertedData, error: submitError } = await supabase
            .from('form_answers')
            .insert(answersToInsert)
            .select(); // Retorna os dados inseridos para confirmar

        // Loga o resultado completo para diagnóstico
        console.log('[Submit] Resultado do Supabase — dados inseridos:', insertedData, '| erro:', submitError);

        if (submitError) {
            // Loga o erro e exibe mensagem ao usuário
            console.error('[Submit] Erro ao inserir respostas:', submitError);
            alert('Erro ao enviar suas respostas. Tente novamente.');
            setLoading(false);
        } else {
            console.log('[Submit] Respostas inseridas com sucesso!');

            // Incrementa o contador e dispara processamento (RPC Original)
            const { error: rpcError } = await supabase.rpc('increment_form_responses', { form_id: form.id });
            if (rpcError) {
                console.warn('[Submit] Erro ao chamar RPC increment_form_responses (usando fallback manual):', rpcError.message);
                
                // Fallback Manual se a RPC não for encontrada
                const { data: currentForm } = await supabase
                    .from('forms')
                    .select('qtd_respostas')
                    .eq('id', form.id)
                    .single();

                const newCount = (currentForm?.qtd_respostas || 0) + 1;
                await supabase
                    .from('forms')
                    .update({ qtd_respostas: newCount })
                    .eq('id', form.id);
            }

            // Marca o formulário como enviado e encerra o estado de loading
            setSubmitted(true);
            setLoading(false);
        }
    };

    if (loading && !submitted) return <LoadingScreen />;

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Ops!</h3>
                    <p className="text-slate-500">{error}</p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-xl shadow-lg border-t-[10px] border-t-[#35b6cf] max-w-[770px] w-full text-center animate-in zoom-in-95 duration-500">
                    <div className="mx-auto w-20 h-20 bg-[#35b6cf]/10 text-[#35b6cf] rounded-full flex items-center justify-center mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Resposta Registrada</h1>
                    <p className="text-slate-500 mb-8">Sua resposta foi enviada com sucesso. Obrigado!</p>
                    <button onClick={() => window.close()} className="text-[#35b6cf] hover:text-[#2ca1b7] font-medium hover:underline">Fechar página</button>
                </div>
            </div>
        );
    }

    const FORM_WIDTH = "w-full max-w-[640px]";
    const ACCENT_BORDER = "border-t-[8px] border-t-[#35b6cf]";

    // Remove o sufixo de setor do título do formulário
    // Ex: "GES 01 – TÉCNICO/OPERACIONAL" -> "GES 01"
    // Suporta tanto o travessão – quanto o hífen simples como separador
    const cleanTitle = (title?: string) => {
        if (!title) return '';
        // Corta tudo a partir do separador " – " ou " - " (com espaços ao redor)
        return title.split(/\s+[–\-]\s+/)[0].trim();
    };

    const currentQs = sections[currentSection] ? sections[currentSection].questions : [];
    const isLastSection = currentSection === sections.length - 1;

    return (
        <div className={`bg-slate-50 flex flex-col items-center font-sans px-3 sm:px-0 ${step !== 'form' ? 'h-screen overflow-hidden justify-center' : 'min-h-screen pt-4 sm:pt-8 pb-10 justify-start'}`}>

            <RegistrationModal
                isOpen={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
                cpf={cpf}
                onSuccess={handleRegistrationSuccess}
            />

            {/* STEP 0: COVER PAGE */}
            {step === 'cover' && (
                <div className={`${FORM_WIDTH} h-full flex flex-col justify-center animate-in slide-in-from-bottom-4 duration-500`}>
                    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 ${ACCENT_BORDER} p-5 sm:p-6 mb-3 flex flex-col max-h-[75vh]`}>
                        <h1 className="text-lg sm:text-2xl font-normal text-slate-900 mb-1 line-clamp-2">{cleanTitle(form?.title)}</h1>
                        
                        {/* Exibição resumida de CNPJ e Setor */}
                        <div className="mb-4 flex flex-col gap-0.5">
                            {/* @ts-ignore */}
                            {form?.company_cnpj && (
                                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider px-1 border-l-2 border-slate-200">
                                    {/* @ts-ignore */}
                                    CNPJ: {form.company_cnpj}
                                </span>
                            )}
                            {/* @ts-ignore */}
                            {form?.sector_name && (
                                <span className="text-[10px] sm:text-xs font-bold text-[#35b6cf] uppercase tracking-wider px-1 border-l-2 border-[#35b6cf]/30">
                                    {/* @ts-ignore */}
                                    Setor: {form.sector_name}
                                </span>
                            )}
                        </div>

                        <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
                            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{form?.description}</p>
                        </div>
                        <div className="pt-4 flex justify-between items-center border-t border-slate-100 mt-4 shrink-0">
                            <button
                                onClick={() => setStep('cpf_check')}
                                className="bg-[#35b6cf] text-white px-5 py-1.5 rounded-md font-medium text-sm hover:bg-[#2ca1b7] transition-colors shadow-sm w-full sm:w-auto"
                            >
                                Iniciar Formulário
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-4 opacity-70">
                        <img src="/favicon.png" alt="Logo" className="h-5 w-auto" />
                        <span className="text-xs text-slate-500 font-medium">Gama Center - 2025</span>
                    </div>
                </div>
            )}

            {/* STEP 0.5: CPF CHECK */}
            {step === 'cpf_check' && (
                <div className={`${FORM_WIDTH} h-full flex flex-col justify-center animate-in slide-in-from-right-8 duration-500`}>
                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm mx-auto w-full">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-50 text-[#35b6cf] rounded-full flex items-center justify-center mx-auto mb-4">
                                <User size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Identificação</h2>
                            <p className="text-sm text-slate-500 mt-2">Informe seu CPF para continuar</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">CPF</label>
                                <div className="relative">
                                    <Hash size={18} className="absolute left-3 top-3 text-slate-400" />
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] outline-none transition-all"
                                        placeholder="000.000.000-00"
                                        maxLength={14}
                                        value={cpf}
                                        onChange={(e) => {
                                            let v = e.target.value.replace(/\D/g, '');
                                            if (v.length > 11) v = v.slice(0, 11);
                                            v = v.replace(/(\d{3})(\d)/, '$1.$2');
                                            v = v.replace(/(\d{3})(\d)/, '$1.$2');
                                            v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                                            setCpf(v);
                                        }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCheckCPF()}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleCheckCPF}
                                disabled={checkingCpf || cpf.length < 14}
                                className="w-full bg-[#35b6cf] text-white py-2.5 rounded-lg font-bold hover:bg-[#2ca1b7] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {checkingCpf ? 'Verificando...' : 'Continuar'}
                                {!checkingCpf && <ChevronRight size={18} />}
                            </button>
                            <button
                                onClick={() => setStep('cover')}
                                className="w-full text-sm text-slate-500 hover:text-slate-800 mt-2"
                            >
                                Voltar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 1: FORM */}
            {step === 'form' && (
                <div className={`${FORM_WIDTH} mx-auto space-y-3 sm:space-y-4 animate-in slide-in-from-right-8 duration-500`}>

                    {/* Header Compacto */}
                    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 ${ACCENT_BORDER} p-5 sm:p-6`}>
                        <h1 className="text-xl sm:text-2xl font-normal text-slate-900 leading-tight mb-2">{cleanTitle(form?.title)}</h1>
                        
                        {/* Metadados da Empresa e Setor no Header */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-1">
                            {/* @ts-ignore */}
                            {form?.company_cnpj && (
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 underline decoration-slate-200 underline-offset-4">
                                    <Building2 size={10} className="text-slate-300" />
                                    {/* @ts-ignore */}
                                    CNPJ {form.company_cnpj}
                                </div>
                            )}
                            {/* @ts-ignore */}
                            {form?.sector_name && (
                                <div className="text-[10px] font-bold text-[#139690] uppercase tracking-widest flex items-center gap-1.5 underline decoration-[#139690]/20 underline-offset-4">
                                    <MapPin size={10} className="text-[#139690]/40" />
                                    {/* @ts-ignore */}
                                    Setor {form.sector_name}
                                </div>
                            )}
                        </div>
                        {collaborator && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-3 text-sm text-blue-800">
                                <div className="bg-blue-100 p-2 rounded-full">
                                    <User size={16} />
                                </div>
                                <div>
                                    <p className="font-bold">{collaborator.nome}</p>
                                    <p className="opacity-80 text-xs">{collaborator.empresa_nome} (CPF: {collaborator.cpf})</p>
                                </div>
                            </div>
                        )}
                        {currentSection > 0 && sections[currentSection].title && (
                            <h2 className="text-lg font-medium text-[#35b6cf] mt-4">{sections[currentSection].title}</h2>
                        )}
                        <div className="text-xs text-slate-500 mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                            <span className="flex items-center gap-1"><span className="text-red-500">*</span> Indica pergunta obrigatória</span>
                            {sections.length > 1 && (
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-400">Página {currentSection + 1} de {sections.length}</span>
                            )}
                        </div>
                    </div>

                    {/* Questions of Current Section */}
                    {/* Identification block removed as it is handled before */}
                    <div className="space-y-4">
                        {currentQs.map((q) => (
                            <div key={q.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 sm:p-6 transition-all hover:shadow-md animate-in slide-in-from-right-4 duration-300">
                                <label className="block text-base font-normal text-slate-900 mb-4">
                                    {q.label}
                                    {q.required && <span className="text-red-500 ml-1">*</span>}
                                </label>

                                {q.question_type === 'short_text' && (
                                    <div className="max-w-md">
                                        <input
                                            type="text"
                                            className="w-full px-0 py-2 border-b border-slate-300 focus:border-b-2 focus:border-[#35b6cf] bg-transparent transition-all outline-none placeholder:text-slate-400"
                                            placeholder="Sua resposta"
                                            value={answers[q.id] || ''}
                                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                        />
                                    </div>
                                )}

                                {q.question_type === 'long_text' && (
                                    <textarea
                                        className="w-full px-0 py-2 border-b border-slate-300 focus:border-b-2 focus:border-[#35b6cf] bg-transparent transition-all outline-none min-h-[40px] placeholder:text-slate-400 resize-none overflow-hidden"
                                        placeholder="Sua resposta"
                                        value={answers[q.id] || ''}
                                        onChange={(e) => {
                                            handleAnswerChange(q.id, e.target.value);
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                    />
                                )}

                                {q.question_type === 'choice' && (
                                    <div className="space-y-3">
                                        {[q.option_1, q.option_2, q.option_3, q.option_4, q.option_5].filter(Boolean).map((opt, i) => (
                                            <label key={i} className="flex items-center cursor-pointer group">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${answers[q.id] === opt ? 'border-[#35b6cf]' : 'border-slate-400 group-hover:border-slate-500'}`}>
                                                    {answers[q.id] === opt && <div className="w-2.5 h-2.5 rounded-full bg-[#35b6cf]" />}
                                                </div>
                                                <input
                                                    type="radio"
                                                    name={`q_${q.id}`}
                                                    value={opt}
                                                    checked={answers[q.id] === opt}
                                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                    className="hidden"
                                                />
                                                <span className="text-sm text-slate-700">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {q.question_type === 'select' && (
                                    <CustomSelect
                                        options={[q.option_1, q.option_2, q.option_3, q.option_4, q.option_5].filter(Boolean)}
                                        value={answers[q.id] || ''}
                                        onChange={(val: string) => handleAnswerChange(q.id, val)}
                                        placeholder="Escolher opção..."
                                    />
                                )}

                                {q.question_type === 'rating' && (
                                    <div className="flex flex-col py-2">
                                        <div className="flex justify-between w-full max-w-lg mb-2 px-2 text-xs text-slate-500">
                                            <span>Pior</span>
                                            <span>Melhor</span>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2">
                                            {Array.from({ length: (q.max_value || 5) - (q.min_value || 1) + 1 }, (_, i) => (q.min_value || 1) + i).map((val) => (
                                                <div key={val} className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => handleAnswerChange(q.id, val)}>
                                                    <span className="text-xs font-medium text-slate-500">{val}</span>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${answers[q.id] === val ? 'border-[#35b6cf]' : 'border-slate-400 hover:border-slate-500'}`}>
                                                        {answers[q.id] === val && <div className="w-2.5 h-2.5 rounded-full bg-[#35b6cf]" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center py-6">
                        <button
                            onClick={handleBack}
                            disabled={currentSection === 0}
                            className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-4 py-2 rounded transition-colors font-medium text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Voltar
                        </button>

                        <button
                            onClick={isLastSection ? handleSubmit : handleNext}
                            className="bg-[#35b6cf] text-white px-6 py-2 rounded-md font-medium text-sm hover:bg-[#2ca1b7] transition-colors shadow-sm ring-offset-2 focus:ring-2 focus:ring-[#35b6cf]"
                        >
                            {isLastSection ? 'Enviar' : 'Avançar'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// MODAL DE REGISTRO
interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    cpf: string;
    onSuccess: (collaborator: Collaborator) => void;
}

const RegistrationModal = ({ isOpen, onClose, cpf, onSuccess }: RegistrationModalProps) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form Data
    const [nome, setNome] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');
    const [empresaId, setEmpresaId] = useState<string>('');
    const [unidadeId, setUnidadeId] = useState<number | undefined>();
    const [setorId, setSetorId] = useState<number | undefined>();
    const [cargoId, setCargoId] = useState<number | undefined>();
    const [sexo, setSexo] = useState('');

    // Lists
    const [companies, setCompanies] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [sectores, setSectores] = useState<any[]>([]);
    const [cargos, setCargos] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
            // Reset state
            setStep(1);
            setNome('');
            setDataNascimento('');
            setEmpresaId('');
            setUnidadeId(undefined);
            setSetorId(undefined);
            setCargoId(undefined);
            setSexo('');
        }
    }, [isOpen]);

    // Load Units when Company changes
    useEffect(() => {
        if (empresaId) {
            fetchUnits(empresaId);
        } else {
            setUnits([]);
            setUnidadeId(undefined); // Reseta a unidade caso a empresa seja desmarcada
        }
    }, [empresaId]);

    // Dispara a busca de setores quando uma unidade é selecionada
    useEffect(() => {
        // Verifica se existe um ID de unidade valido
        if (unidadeId) {
            // Executa a função passando o identificar numérico da unidade
            fetchSectors(unidadeId);
        } else {
            // Limpa o estado com a array de setores para o dropdown se esvaziar
            setSectores([]);
            // Reseta a referência do setor atualmente marcado
            setSetorId(undefined);
        }
    }, [unidadeId]);

    // Função assíncrona para buscar setores pertencentes a unidade
    const fetchSectors = async (unidadeId: number) => {
        // Pega os IDs da tabela pivô `unidade_setor` relacionando unidade atual
        const { data: relData, error: relError } = await supabase
            .from('unidade_setor')
            // Consulta informando que deseja pegar o lado do setor
            .select('setor')
            // Aplica regra de igualidade na unidade pesquisada
            .eq('unidade', unidadeId);
            
        // Se houver erro impeditivo de continuação ou array for vazio aborta carga
        if (relError || !relData || relData.length === 0) {
            // Reseta array vazia garantindo renderizacao inofensiva no react
            setSectores([]);
            // Retorna parando a execução
            return;
        }

        // Pega todos os registros vindos do relData isolando em lista os Ids
        const sectorIds = relData.map(r => r.setor);

        // Efetua um novo SELECT em cima dos dados mestre do `setor` batendo o que foi encontrado
        const { data: secData, error: secError } = await supabase
            .from('setor')
            // Puxa Id preenchido e correspondente String via SQL puro
            .select('id, nome')
            // Cláusula in equivale a listar todos correspondentes contidos e localizados na matriz de cima
            .in('id', sectorIds)
            // Aplica orderBy asc no nome em específico
            .order('nome');
            
        // Verifica persistencia e atribui a variavel de estado React preenchendo o dropdown no HTML
        if (secData) {
            // Finaliza marcando opções abertas 
            setSectores(secData);
        } else {
            // Se bugar durante fetch desliga array inteira por limitacao de garantia
            setSectores([]);
        }
    };

    // Função auxiliar para contornar o limite de 1000 linhas por request do Supabase
    // Modificado para usar order 'id' garantindo estabilidade na paginação e resolver registros faltantes
    const fetchAll = async (tableName: string, selectFields: string, sortField: string) => {
        let allData: any[] = [];
        let from = 0;
        const limit = 1000;
        while (true) {
            const { data, error } = await supabase.from(tableName).select(selectFields).order('id').range(from, from + limit - 1);
            if (error || !data) break;
            allData = [...allData, ...data];
            if (data.length < limit) break;
            from += limit;
        }

        allData.sort((a, b) => {
            const valA = (a[sortField] || a.razao_social || '').toLowerCase();
            const valB = (b[sortField] || b.razao_social || '').toLowerCase();
            return valA.localeCompare(valB);
        });

        return allData;
    };

    // Função para buscar dados iniciais necessários para o cadastro inicial da tela modal
    const fetchInitialData = async () => {
        // Executa as requisições em paralelo com paginação limitando para Clientes e Cargos, excluindo setores, que vêm via useEffect
        const [companiesData, cargosData] = await Promise.all([
            // Exige busca global na collection pai "clientes" (empresas pai)
            fetchAll('clientes', 'id, nome_fantasia, razao_social', 'nome_fantasia'),
            // Exige busca global em collection filho isolado sem vinculo de parent "cargos"
            fetchAll('cargos', 'id, nome', 'nome')
        ]);

        // Carrega hook setState com resultado clientes da promessa 0
        if (companiesData) setCompanies(companiesData);
        // Carrega hook setState com resultado cargos da promessa 1 
        if (cargosData) setCargos(cargosData);
    };

    // Função para buscar as unidades vinculadas a uma empresa específica
    const fetchUnits = async (companyId: string) => {
        let allData: any[] = [];
        let from = 0;
        const limit = 1000;
        while (true) {
            const { data, error } = await supabase
                .from('unidades')
                .select('id, nome_unidade')
                .eq('empresaid', companyId)
                .order('id')
                .range(from, from + limit - 1);

            if (error || !data) break;
            allData = [...allData, ...data];
            if (data.length < limit) break;
            from += limit;
        }

        allData.sort((a, b) => (a.nome_unidade || '').localeCompare(b.nome_unidade || ''));
        setUnits(allData);
    };

    const handleRegister = async () => {
        if (!nome || !cpf || !empresaId || !unidadeId || !setorId || !cargoId || !sexo || !dataNascimento) {
            alert("Preencha todos os campos obrigatórios");
            return;
        }

        setLoading(true);

        const newColab: Collaborator = {
            nome,
            cpf, // Clean CPF is passed prop
            data_nascimento: dataNascimento,
            unidade: unidadeId,
            setorid: setorId,
            cargo: cargoId,
            sexo,
            avulso: true
        };

        const { data, error } = await supabase
            .from('colaboradores')
            .insert(newColab)
            .select()
            .single();

        if (error) {
            console.error(error);
            alert("Erro ao cadastrar. Tente novamente.");
            setLoading(false);
            return;
        }

        // Get company name for display
        const company = companies.find(c => c.id === empresaId);
        const savedColab = { ...newColab, id: data.id, empresa_nome: company?.nome_fantasia || company?.razao_social };

        onSuccess(savedColab);
        onClose();
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">Completar Cadastro</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <span className="sr-only">Fechar</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4">
                        Não encontramos seu CPF na base. Por favor, complete seus dados para continuar.
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                        <input type="text" value={cpf} disabled className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={nome}
                                onChange={e => setNome(e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] outline-none"
                                placeholder="Seu nome"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">D. Nascimento <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={dataNascimento}
                                onChange={e => setDataNascimento(e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Empresa <span className="text-red-500">*</span></label>
                            <SearchableSelect
                                placeholder="Buscar..."
                                options={companies.map(c => ({ value: c.id, label: c.nome_fantasia || c.razao_social }))}
                                value={empresaId}
                                onChange={setEmpresaId}
                                requireSearch={true}
                                noResultsContent={
                                    <div className="flex flex-col items-center justify-center py-4 px-2 text-center space-y-2">
                                        <img src="/favicon.png" alt="Gama" className="w-8 h-8 opacity-80" />
                                        <p className="text-xs text-slate-800 font-medium">Sua empresa não é cliente da Gama Center</p>
                                    </div>
                                }
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Unidade <span className="text-red-500">*</span></label>
                            <SearchableSelect
                                placeholder={empresaId ? "Selecione..." : "Escolha a empresa"}
                                options={units.map(u => ({ value: u.id, label: u.nome_unidade }))}
                                value={unidadeId}
                                onChange={setUnidadeId}
                                disabled={!empresaId}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Setor <span className="text-red-500">*</span></label>
                            <SearchableSelect
                                placeholder="Selecione..."
                                options={sectores.map(s => ({ value: s.id, label: s.nome }))}
                                value={setorId}
                                onChange={setSetorId}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Cargo <span className="text-red-500">*</span></label>
                            <SearchableSelect
                                placeholder="Selecione..."
                                options={cargos.map(c => ({ value: c.id, label: c.nome }))}
                                value={cargoId}
                                onChange={setCargoId}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sexo <span className="text-red-500">*</span></label>
                        <select
                            value={sexo}
                            onChange={e => setSexo(e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] outline-none"
                        >
                            <option value="">Selecione...</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Feminino">Feminino</option>
                            <option value="Outro">Outro</option>
                        </select>
                    </div>

                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium">Cancelar</button>
                    <button
                        onClick={handleRegister}
                        disabled={loading}
                        className="bg-[#35b6cf] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#2ca1b7] disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'Salvando...' : 'Salvar e Continuar'}
                        {!loading && <ChevronRight size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
};