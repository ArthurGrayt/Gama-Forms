// Tipo de pergunta suportado nos formulários
export type QuestionType = 'short_text' | 'long_text' | 'choice' | 'rating' | 'select' | 'section_break';

// Interface do formulário
export interface Form {
  id: number;
  title: string;
  description: string;
  slug: string;
  active: boolean;
  created_at: string;
  // Associações (campos usados no frontend, nem todos vêm do banco)
  empresa?: string; // UI-only, não é coluna no banco
  unidade_id?: number; // ID da unidade
  setor?: number;   // ID do setor
  hse_id?: number; // ID do HSE vinculado
  qtd_respostas?: number; // Quantidade de respostas recebidas
}

// Interface de dimensão HSE (Saúde, Segurança, Ergonomia)
export interface HSEDimension {
  id: number;
  name: string;
  is_positive: boolean; // Se a dimensão é positiva (maior = melhor)
  risk_label: string; // Rótulo de risco
}

// Interface de regra HSE (faixas de classificação de risco)
export interface HSERule {
  id: number;
  dimension_id: number; // ID da dimensão vinculada
  min_val: number; // Valor mínimo da faixa
  max_val: number; // Valor máximo da faixa
  texto_personalizado: string; // Texto da classificação
  feedback_interpretativo?: string; // Feedback opcional
  plano_acao_sugerido?: string; // Plano de ação sugerido
}

// Interface de pergunta do formulário
export interface FormQuestion {
  id: number;
  form_id: number; // ID do formulário pai
  label: string; // Texto da pergunta
  question_type: QuestionType; // Tipo da pergunta
  required: boolean; // Se é obrigatória
  question_order: number; // Ordem de exibição
  option_1?: string; // Opções para perguntas de escolha
  option_2?: string;
  option_3?: string;
  option_4?: string;
  option_5?: string;
  min_value?: number; // Valor mínimo para rating
  max_value?: number; // Valor máximo para rating
  temp_id?: string; // ID temporário para keys estáveis no frontend
  hse_dimension_id?: number; // ID da dimensão HSE associada
  hse_question_number?: number; // Número da pergunta na dimensão HSE
  plano_acao_item?: string; // Item do plano de ação vinculado
  titulo_relatorio?: string; // Título no relatório HSE
}

// Interface do colaborador (respondedor do formulário)
export interface Collaborator {
  id?: string;
  nome: string;
  cpf: string;
  cargo: number; // ID do cargo
  setorid: number; // ID do setor
  unidade: number; // ID da unidade
  sexo: string;
  data_nascimento?: string;
  avulso?: boolean; // Se é colaborador avulso (cadastro via formulário)
  empresa_nome?: string; // Nome da empresa (preenchido no frontend)
}

// Interface de resposta do formulário
export interface FormAnswer {
  id: number;
  form_id: number; // ID do formulário respondido
  question_id: number; // ID da pergunta respondida
  respondedor?: string; // UUID/ID do colaborador
  unidade_colaborador?: number; // ID da unidade do colaborador
  cargo?: number; // ID do cargo do colaborador
  answer_text?: string; // Resposta em texto
  answer_number?: number; // Resposta numérica (rating ou mapeamento)
  created_at: string; // Data de criação
}

// Interface de item diagnóstico HSE (usado nos relatórios)
export interface HSEDiagnosticItem {
  form_id: number;
  question_id: number;
  numero_pergunta: number; // Número sequencial da pergunta
  texto_pergunta: string; // Texto da pergunta
  dimensao: string; // Nome da dimensão
  dimensao_id: number; // ID da dimensão
  media_valor: number; // Média dos valores das respostas
  texto_risco_completo: string; // Texto completo de classificação de risco
}