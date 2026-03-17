import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Building2, Search, MapPin, Hash, Factory, Users, UserCheck, UserMinus, ArrowUpDown, Check } from 'lucide-react';

// Interfaces de tipos
interface Empresa {
  id: string; // ID (UUID) da tabela clientes (chave primária real no banco)
  razao_social: string;
  nome_fantasia: string;
  cnpj?: string;
  created_at?: string; // Data de criação da empresa no banco
  qtd_unidades?: number; // Contador de unidades físicas
  qtd_ativos?: number; // Contador de colaboradores com status 'ativo'
  qtd_restante?: number; // Contador de colaboradores com outros status
}

export const ColabManager: React.FC = () => {
  // Tipagem para opções de ordenação
  type SortOption = 'az' | 'za' | 'colab_desc' | 'data_desc';

  // Estados para dados e UI
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Hook para navegação entre rotas
  const navigate = useNavigate();
  const [sortOption, setSortOption] = useState<SortOption>('az'); // Inicia com ordenação de A-Z
  const [isSortOpen, setIsSortOpen] = useState(false); // Estado para controlar o menu suspenso de ordenação

  // Busca os dados iniciais ao montar o componente
  useEffect(() => {
    fetchEmpresas();
  }, []);

  // Função para buscar as empresas (clientes) e contar as unidades e colaboradores vinculados
  const fetchEmpresas = async () => {
    // Ativa o estado de carregamento da interface
    setLoading(true);
    try {
      // 1. Busca todos os clientes (empresas parceiras)
      // Nota: Conforme o schema, a chave primária UUID desta tabela se chama 'id'
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('id, razao_social, nome_fantasia, cnpj, created_at')
        .order('nome_fantasia', { ascending: true });

      if (clientesError) throw clientesError;

      // 2. Busca o quantitativo de colaboradores ATIVOS por unidade
      // Técnica de Sub-consulta de Contagem: Pedimos ao servidor para contar em vez de baixar os 34k registros
      const { data: ativosPerUnit, error: ativosError } = await supabase
        .from('unidades')
        .select('id, empresaid, count:colaboradores(count)')
        .eq('colaboradores.ativo', 'ativo')
        .limit(2000);

      if (ativosError) throw ativosError;

      // 3. Busca o quantitativo TOTAL de colaboradores por unidade
      const { data: todosPerUnit, error: todosError } = await supabase
        .from('unidades')
        .select('id, empresaid, count:colaboradores(count)')
        .limit(2000);

      if (todosError) throw todosError;

      // 4. Consolidar os dados das unidades por Empresa (UUID)
      // Como uma empresa pode ter várias unidades, somamos os contadores de cada uma
      const contagemAtivos: Record<string, number> = {};
      const contagemTotal: Record<string, number> = {};
      const contagemUnidades: Record<string, number> = {};

      // Processa totais de Ativos
      (ativosPerUnit || []).forEach((u: any) => {
        if (u.empresaid) {
          // A estrutura de retorno do count é um array: u.count[0].count
          const count = u.count?.[0]?.count || 0;
          contagemAtivos[u.empresaid] = (contagemAtivos[u.empresaid] || 0) + count;
        }
      });

      // Processa totais Gerais e contagem de Unidades físicas
      (todosPerUnit || []).forEach((u: any) => {
        if (u.empresaid) {
          const count = u.count?.[0]?.count || 0;
          contagemTotal[u.empresaid] = (contagemTotal[u.empresaid] || 0) + count;
          // Incrementa 1 unidade para esta empresa
          contagemUnidades[u.empresaid] = (contagemUnidades[u.empresaid] || 0) + 1;
        }
      });

      // 5. Mapeia os dados finais para o estado 'empresas' do React
      const mappedEmpresas: Empresa[] = (clientesData || []).map((cliente: any) => {
        const ativos = contagemAtivos[cliente.id] || 0;
        const total = contagemTotal[cliente.id] || 0;
        
        return {
          id: cliente.id,
          razao_social: cliente.razao_social || 'Razão Omitida',
          nome_fantasia: cliente.nome_fantasia || 'Nome Omitido',
          cnpj: cliente.cnpj || '-',
          created_at: cliente.created_at,
          qtd_unidades: contagemUnidades[cliente.id] || 0,
          qtd_ativos: ativos,
          // O "restante" são os colaboradores que não têm o status exato de 'ativo'
          qtd_restante: total - ativos
        };
      });

      // Atualiza o estado das empresas com a consolidação concluída
      setEmpresas(mappedEmpresas);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    } finally {
      // Encerra o carregamento
      setLoading(false);
    }
  };


  // Filtra de acordo com a busca de texto
  const filteredEmpresas = empresas.filter(emp => {
    const term = search.toLowerCase();
    return (emp.nome_fantasia?.toLowerCase() || '').includes(term) ||
           (emp.razao_social?.toLowerCase() || '').includes(term) ||
           (emp.cnpj || '').includes(term);
  });

  // Ordena os resultados previamente filtrados pela busca
  const sortedEmpresas = [...filteredEmpresas].sort((a, b) => {
    const nomeA = a.nome_fantasia.toLowerCase();
    const nomeB = b.nome_fantasia.toLowerCase();
    
    switch (sortOption) {
      case 'az':
        // Compara os nomes em ordem alfabética crescente
        return nomeA.localeCompare(nomeB);
      case 'za':
        // Compara os nomes em ordem alfabética descrescente
        return nomeB.localeCompare(nomeA);
      case 'colab_desc': {
        // Quantidade total de colaboradores (ativos + o restante) em ordem descendente
        const totalA = (a.qtd_ativos || 0) + (a.qtd_restante || 0);
        const totalB = (b.qtd_ativos || 0) + (b.qtd_restante || 0);
        return totalB - totalA;
      }
      case 'data_desc': {
        // Data de criação, das mais recentes (maior ms) para as mais antigas (menor ms)
        const dataA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dataB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dataB - dataA;
      }
      default:
        // Fallback caso a sort option seja inválida (nunca atingido, em tese)
        return 0;
    }
  });

  // Função para navegar para a lista detalhada de colaboradores da empresa
  const handleCardClick = (empresaId: string) => {
    navigate(`/colaboradores/${empresaId}`);
  };

  return (
    <div className="p-10 h-full w-full flex flex-col animate-in fade-in duration-500">
      
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="text-blue-600" />
            Empresas Parceiras
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie os colaboradores por empresa e unidade.</p>
        </div>
      </div>

      {/* Filtros e Ordenação em Barra Fixa */}
      <div className="flex gap-4 mb-6 sticky top-0 bg-slate-50 py-2 z-10 w-full max-w-2xl">
        {/* Campo de Busca (Expansível) */}
        <div className="relative flex-1 group">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar empresa por nome, razão ou CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>

        {/* Componente de Ordenação (Largura Fixada pelo conteúdo) */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm h-full"
          >
            <ArrowUpDown size={16} className={sortOption !== 'az' ? 'text-blue-500' : 'text-slate-400'} />
            <span className="hidden sm:inline font-medium text-slate-800">Ordenar</span>
          </button>

          {/* Menu Dropdown de Ordenação (Aparece ao clicar) */}
          {isSortOpen && (
            <>
              {/* Overlay invisível na tela toda para fechar ao clicar fora do menu */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsSortOpen(false)}
              ></div>
              
              {/* O modal do menu propriamente dito */}
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <div className="px-3 py-2 text-[11px] font-bold text-slate-400 tracking-wider mb-1">
                  ORDENAR POR
                </div>
                
                {/* Opção A-Z */}
                <button
                  onClick={() => { setSortOption('az'); setIsSortOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors ${sortOption === 'az' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  <span>Ordem Alfabética (A-Z)</span>
                  {sortOption === 'az' && <Check size={16} className="text-blue-600" />}
                </button>
                
                {/* Opção Z-A */}
                <button
                  onClick={() => { setSortOption('za'); setIsSortOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors ${sortOption === 'za' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  <span>Ordem Alfabética (Z-A)</span>
                  {sortOption === 'za' && <Check size={16} className="text-blue-600" />}
                </button>

                {/* Divisor Visual */}
                <div className="h-px bg-slate-100 my-1.5 mx-2"></div>
                
                {/* Opção Qtd. Colaboradores */}
                <button
                  onClick={() => { setSortOption('colab_desc'); setIsSortOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors ${sortOption === 'colab_desc' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  <span>Mts. Colaboradores</span>
                  {sortOption === 'colab_desc' && <Check size={16} className="text-blue-600" />}
                </button>
                
                {/* Opção Data (Mais recentes) */}
                <button
                  onClick={() => { setSortOption('data_desc'); setIsSortOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors ${sortOption === 'data_desc' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  <span>Data de Criação</span>
                  {sortOption === 'data_desc' && <Check size={16} className="text-blue-600" />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Área de Listagem */}
      <div className="flex-1 overflow-y-auto pb-10">
        {loading ? (
          // Estado de Loading
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
             <div className="w-8 h-8 rounded-full border-4 border-blue-500/30 border-t-blue-600 animate-spin mb-4"></div>
             Carregando empresas...
          </div>
        ) : sortedEmpresas.length === 0 ? (
          // Estado Vazio (Nenhuma empresa encontrada)
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 border-dashed text-slate-500">
             <Factory size={48} className="text-slate-300 mb-4" />
             <p className="font-medium text-slate-600">Nenhuma empresa encontrada</p>
             <p className="text-sm text-slate-400 mt-1">Sua busca não retornou resultados.</p>
          </div>
        ) : (
          // Grid de Cards
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedEmpresas.map(empresa => (
              <div 
                key={empresa.id} 
                onClick={() => handleCardClick(empresa.id)}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col"
              >
                
                {/* Header do Card (Icone + Nome Fantasia) */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-105 transition-transform">
                    <Building2 size={24} />
                  </div>
                  <div className="flex-1 pt-1 overflow-hidden">
                    <h3 className="text-base font-bold text-slate-800 leading-tight truncate" title={empresa.nome_fantasia}>
                      {empresa.nome_fantasia}
                    </h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5" title={empresa.razao_social}>
                      {empresa.razao_social}
                    </p>
                  </div>
                </div>

                {/* Área de informações (CNPJ) */}
                <div className="flex-1 space-y-3 mt-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center text-slate-400">
                      <Hash size={14} />
                    </div>
                    <span>{empresa.cnpj || 'Sem CNPJ'}</span>
                  </div>
                </div>

                {/* Footer do Card com contagens divididas */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-start gap-5">
                  {/* Ícone e Quantia de Unidades */}
                  <div className="flex items-center gap-1.5 text-slate-600" title={`${empresa.qtd_unidades} Unidades`}>
                    <MapPin size={16} className="text-blue-500" />
                    <span className="text-sm font-bold text-slate-800">{empresa.qtd_unidades}</span>
                  </div>
                  
                  {/* Ícone e Quantia de Colaboradores Ativos */}
                  <div className="flex items-center gap-1.5 text-slate-600" title={`${empresa.qtd_ativos || 0} Colaboradores Ativos`}>
                    <UserCheck size={16} className="text-emerald-500" />
                    <span className="text-sm font-bold text-slate-800">{String(empresa.qtd_ativos || 0)}</span>
                  </div>

                  {/* Ícone e Quantia de Colaboradores Restante (Inativos/Outros) */}
                  <div className="flex items-center gap-1.5 text-slate-600" title={`${empresa.qtd_restante || 0} Colaboradores Inativos/Outros`}>
                    <UserMinus size={16} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-800">{String(empresa.qtd_restante || 0)}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
