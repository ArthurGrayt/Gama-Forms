import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { 
  Users, 
  Search, 
  Filter, 
  CheckSquare, 
  ArrowLeft, 
  Building2,
  Briefcase,
  MapPin,
  Layers,
  ChevronRight,
  UserCheck,
  UserMinus,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';

// Interfaces de tipos
interface Colaborador {
  id: string;
  nome: string;
  cpf: string;
  ativo: string;
  unidade_id: number;
  unidade_nome?: string;
  setor_id: number;
  setor_nome?: string;
  cargo_id: number;
  cargo_nome?: string;
  created_at: string;
}

interface PageData {
  nome_fantasia: string;
  razao_social: string;
}

const EnterpriseColabList: React.FC = () => {
  // Pega o ID da empresa da URL
  const { empresaId } = useParams<{ empresaId: string }>();
  const navigate = useNavigate();

  // Estados
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [empresaInfo, setEmpresaInfo] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Estados de Interatividade
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Estados de Edição Inline (Dropdowns)
  const [activeDropdown, setActiveDropdown] = useState<{ colabId: string, type: 'setor' | 'cargo' } | null>(null);
  const [dropdownOptions, setDropdownOptions] = useState<{ id: number, nome: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Setores da empresa (para o filtro)
  const [empresaSetores, setEmpresaSetores] = useState<{id: number, nome: string}[]>([]);

  // Estados de Filtro e Ordenação
  const [sortConfig, setSortConfig] = useState<{ key: keyof Colaborador, direction: 'asc' | 'desc' } | null>(null);
  const [filterConfig, setFilterConfig] = useState<{
    status: string;
    cargo: string;
    setor: string;
    unidade: string;
  }>({ status: 'todos', cargo: 'todos', setor: 'todos', unidade: 'todos' });
  
  const [activeMenu, setActiveMenu] = useState<'filter' | 'sort' | null>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (activeDropdown && !target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
      if (activeMenu && !target.closest('.menu-container')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown, activeMenu]);

  // Busca inicial
  useEffect(() => {
    if (empresaId) {
      fetchData();
    }
  }, [empresaId]);

  // Função principal de busca de dados
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Busca info da empresa
      const { data: cliente, error: clientErr } = await supabase
        .from('clientes')
        .select('nome_fantasia, razao_social')
        .eq('id', empresaId)
        .single();
      
      if (clientErr) throw clientErr;
      setEmpresaInfo(cliente);

      // 2. Busca IDs das unidades desta empresa
      const { data: unidades, error: unitErr } = await supabase
        .from('unidades')
        .select('id, nome_unidade')
        .eq('empresaid', empresaId);
      
      if (unitErr) throw unitErr;
      const unitIds = unidades.map(u => u.id);
      const unitMap: Record<number, string> = {};
      unidades.forEach(u => unitMap[u.id] = u.nome_unidade || 'N/A');

      if (unitIds.length === 0) {
        setColaboradores([]);
        setEmpresaSetores([]);
        return;
      }

      // 3. Busca todos os setores vinculados a estas unidades (para o filtro global)
      const { data: relSetores, error: relSetErr } = await supabase
        .from('unidade_setor')
        .select('setor')
        .in('unidade', unitIds);
      
      let allSectorIds: number[] = [];
      if (!relSetErr && relSetores) {
        allSectorIds = Array.from(new Set(relSetores.map(r => r.setor)));
      }

      // 4. Busca todos os colaboradores vinculados a estas unidades
      const { data: colabs, error: colabErr } = await supabase
        .from('colaboradores')
        .select('*')
        .in('unidade', unitIds)
        .limit(2000); // Aumentado limite para suportar empresas maiores
      
      if (colabErr) throw colabErr;
      
      if (!colabs || colabs.length === 0) {
        setColaboradores([]);
        // Mesmo sem colabs, buscamos os nomes dos setores se houver IDs
        if (allSectorIds.length > 0) {
          const { data: sets } = await supabase.from('setor').select('id, nome').in('id', allSectorIds);
          setEmpresaSetores(sets || []);
        }
        setLoading(false);
        return;
      }

      // 5. Busca Setores e Cargos únicos necessários
      const colabSectorIds = Array.from(new Set(colabs.map(c => c.setorid).filter(id => id)));
      const cargoIds = Array.from(new Set(colabs.map(c => c.cargo).filter(id => id)));

      // Combinamos os setores dos colaboradores com os setores da unidade_setor para garantir o mapa completo
      const finalSectorIds = Array.from(new Set([...allSectorIds, ...colabSectorIds]));

      const [sectorsRes, cargosRes] = await Promise.all([
        supabase.from('setor').select('id, nome').in('id', finalSectorIds),
        supabase.from('cargos').select('id, nome').in('id', cargoIds)
      ]);

      const sectorMap: Record<number, string> = {};
      const sectorOptions: {id: number, nome: string}[] = [];
      (sectorsRes.data || []).forEach(s => {
        sectorMap[s.id] = s.nome;
        // Só adicionamos na lista de opções do filtro se estiver no allSectorIds (setores que a empresa tem)
        if (allSectorIds.includes(s.id)) {
          sectorOptions.push({ id: s.id, nome: s.nome });
        }
      });
      setEmpresaSetores(sectorOptions);

      const cargoMap: Record<number, string> = {};
      (cargosRes.data || []).forEach(c => cargoMap[c.id] = c.nome);

      // 5. Mapeia dados finais
      const mapped: Colaborador[] = colabs.map(c => ({
        id: c.id,
        nome: c.nome || 'Sem Nome',
        cpf: c.cpf || '-',
        ativo: c.ativo || 'ativo',
        unidade_id: c.unidade,
        unidade_nome: unitMap[c.unidade],
        setor_id: c.setorid,
        setor_nome: sectorMap[c.setorid] || 'N/A',
        cargo_id: c.cargo,
        cargo_nome: cargoMap[c.cargo] || 'N/A',
        created_at: c.created_at
      }));

      setColaboradores(mapped);
    } catch (err) {
      console.error('Erro ao buscar lista de colaboradores:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtro e Ordenação Local
  const filtered = colaboradores
    .filter(c => {
      const term = search.toLowerCase();
      // Busca broad
      const matchesSearch = c.nome.toLowerCase().includes(term) || 
                           c.cpf.includes(term) || 
                           c.cargo_nome?.toLowerCase().includes(term) ||
                           c.setor_nome?.toLowerCase().includes(term);
      
      // Filtros específicos
      const matchesStatus = filterConfig.status === 'todos' || c.ativo === filterConfig.status;
      const matchesCargo = filterConfig.cargo === 'todos' || c.cargo_nome === filterConfig.cargo;
      const matchesSetor = filterConfig.setor === 'todos' || c.setor_nome === filterConfig.setor;
      const matchesUnidade = filterConfig.unidade === 'todos' || c.unidade_nome === filterConfig.unidade;

      return matchesSearch && matchesStatus && matchesCargo && matchesSetor && matchesUnidade;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;
      
      const valA = String(a[key] || '').toLowerCase();
      const valB = String(b[key] || '').toLowerCase();
      
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

  // Opções únicas para filtros
  const uniqueCargos = Array.from(new Set(colaboradores.map(c => c.cargo_nome).filter(Boolean)));
  const uniqueUnidades = Array.from(new Set(colaboradores.map(c => c.unidade_nome).filter(Boolean)));

  // Alternar Status no Banco e Local
  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
    
    // Update local otimista
    setColaboradores(prev => 
      prev.map(c => c.id === id ? { ...c, ativo: newStatus } : c)
    );

    try {
      const { error } = await supabase
        .from('colaboradores')
        .update({ ativo: newStatus })
        .eq('id', id);
      
      if (error) throw error;
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      // Reverte se falhar
      setColaboradores(prev => 
        prev.map(c => c.id === id ? { ...c, ativo: currentStatus } : c)
      );
    }
  };

  // Lidar com Seleção Individual
  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Selecionar/Deselecionar Todos visíveis
  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)));
    }
  };

  // Atualização em lote (Inativar/Reativar)
  const handleBatchStatusUpdate = async (newStatus: 'ativo' | 'inativo') => {
    if (selectedIds.size === 0) return;
    
    const idsToUpdate = Array.from(selectedIds);
    
    // Update local otimista
    setColaboradores(prev => 
      prev.map(c => idsToUpdate.includes(c.id) ? { ...c, ativo: newStatus } : c)
    );

    try {
      const { error } = await supabase
        .from('colaboradores')
        .update({ ativo: newStatus })
        .in('id', idsToUpdate);
      
      if (error) throw error;
      
      // Limpa seleção após sucesso
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } catch (err) {
      console.error('Erro na atualização em lote:', err);
      alert('Erro ao atualizar colaboradores em lote.');
      fetchData(); // Recarrega para garantir consistência
    }
  };

  // Abrir Dropdown e carregar opções
  const openDropdown = async (colab: Colaborador, type: 'setor' | 'cargo') => {
    // Se clicar no mesmo que já está aberto, fecha.
    if (activeDropdown?.colabId === colab.id && activeDropdown.type === type) {
      setActiveDropdown(null);
      return;
    }

    setActiveDropdown({ colabId: colab.id, type });
    setLoadingOptions(true);
    setDropdownOptions([]);

    try {
      if (type === 'setor') {
        // Opções de Setor baseadas na Unidade (tabela unidade_setor)
        const { data: relacoes, error: relErr } = await supabase
          .from('unidade_setor')
          .select('setor')
          .eq('unidade', colab.unidade_id);
          
        if (relErr) throw relErr;
        
        const setorIds = relacoes.map(r => r.setor);
        if (setorIds.length > 0) {
          const { data: setores, error: setErr } = await supabase
            .from('setor')
            .select('id, nome')
            .in('id', setorIds);
            
          if (setErr) throw setErr;
          setDropdownOptions(setores || []);
        }
      } else if (type === 'cargo') {
        // Opções de Cargo baseadas no Setor atual (tabela cargo_setor)
        if (!colab.setor_id) return; // Precisa de setor para ter cargo nessa regra
        
        const { data: relacoes, error: relErr } = await supabase
          .from('cargo_setor')
          .select('idcargo')
          .eq('idsetor', colab.setor_id);
          
        if (relErr) throw relErr;
        
        const cargoIds = relacoes.map(r => r.idcargo);
        if (cargoIds.length > 0) {
          const { data: cargos, error: cargoErr } = await supabase
            .from('cargos')
            .select('id, nome')
            .in('id', cargoIds);
            
          if (cargoErr) throw cargoErr;
          setDropdownOptions(cargos || []);
        }
      }
    } catch (err) {
      console.error(`Erro ao carregar opções para ${type}:`, err);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Atualizar campo específico de colab
  const updateColabField = async (colabId: string, type: 'setor' | 'cargo', newValueId: number, newValueNome: string) => {
    // 1. Oculta dropdown
    setActiveDropdown(null);
    
    // 2. Prepara dados
    const fieldUpdate = type === 'setor' ? { setorid: newValueId } : { cargo: newValueId };
    
    // 3. Update local otimista
    setColaboradores(prev => 
      prev.map(c => {
        if (c.id === colabId) {
          return {
            ...c,
            ...(type === 'setor' ? { setor_id: newValueId, setor_nome: newValueNome } : { cargo_id: newValueId, cargo_nome: newValueNome })
          };
        }
        return c;
      })
    );

    // 4. Update BD
    try {
      const { error } = await supabase
        .from('colaboradores')
        .update(fieldUpdate)
        .eq('id', colabId);
        
      if (error) throw error;
    } catch (error) {
       console.error(`Erro ao atualizar ${type}:`, error);
       alert(`Falha ao alterar o ${type}.`);
       fetchData(); // reverte estado
    }
  };

  return (
    <div className="p-10 h-full w-full flex flex-col animate-in fade-in duration-500">
      
      {/* Voltar e Header */}
      <div className="flex flex-col gap-4 mb-8">
        <button 
          onClick={() => navigate('/colaboradores')}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          <span className="text-sm font-medium">Voltar para Empresas</span>
        </button>

        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              {empresaInfo?.nome_fantasia}
            </h1>
          </div>
          
          <div className="flex gap-3">
             <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-2">
                <UserCheck size={14} />
                <span className="text-xs font-bold">{colaboradores.filter(c => c.ativo === 'ativo').length} Ativos</span>
             </div>
             <div className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2">
                <UserMinus size={14} />
                <span className="text-xs font-bold">{colaboradores.filter(c => c.ativo !== 'ativo').length} Outros</span>
             </div>
          </div>
        </div>
      </div>

      {/* Controles: Busca, Filtro e Seleção */}
      <div className="flex gap-3 mb-6 items-center">
        <div className="relative max-w-[50%] flex-1 group">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
        
        <div className="relative menu-container">
          <button 
            onClick={() => setActiveMenu(activeMenu === 'filter' ? null : 'filter')}
            className={`p-2.5 border rounded-xl transition-all shadow-sm flex items-center gap-2 ${filterConfig.status !== 'todos' || filterConfig.cargo !== 'todos' || filterConfig.setor !== 'todos' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:text-blue-600'}`}
          >
            <Filter size={18} />
            {(filterConfig.status !== 'todos' || filterConfig.cargo !== 'todos') && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
          </button>

          {activeMenu === 'filter' && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Filtros</span>
                <button 
                  onClick={() => setFilterConfig({ status: 'todos', cargo: 'todos', setor: 'todos', unidade: 'todos' })}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Limpar
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Status</label>
                  <select 
                    value={filterConfig.status}
                    onChange={(e) => setFilterConfig({ ...filterConfig, status: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  >
                    <option value="todos">Todos os Status</option>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Cargo</label>
                  <select 
                    value={filterConfig.cargo}
                    onChange={(e) => setFilterConfig({ ...filterConfig, cargo: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  >
                    <option value="todos">Todos os Cargos</option>
                    {uniqueCargos.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Setor</label>
                  <select 
                    value={filterConfig.setor}
                    onChange={(e) => setFilterConfig({ ...filterConfig, setor: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  >
                    <option value="todos">Todos os Setores</option>
                    {empresaSetores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative menu-container">
          <button 
            onClick={() => setActiveMenu(activeMenu === 'sort' ? null : 'sort')}
            className={`p-2.5 border rounded-xl transition-all shadow-sm flex items-center gap-2 ${sortConfig ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:text-blue-600'}`}
          >
            <ArrowUpDown size={18} />
          </button>

          {activeMenu === 'sort' && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in zoom-in duration-200">
              <div className="p-2 border-b border-slate-100 mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Ordenar por</span>
              </div>
              <div className="space-y-1">
                {[
                  { key: 'nome', label: 'Nome' },
                  { key: 'cpf', label: 'Documento' },
                  { key: 'cargo_nome', label: 'Cargo' },
                  { key: 'setor_nome', label: 'Setor' },
                  { key: 'unidade_nome', label: 'Unidade' },
                  { key: 'ativo', label: 'Status' }
                ].map((item) => (
                  <div key={item.key} className="flex gap-1">
                    <button 
                      onClick={() => setSortConfig({ key: item.key as any, direction: 'asc' })}
                      className={`flex-1 text-left px-3 py-2 text-xs rounded-lg transition-colors ${sortConfig?.key === item.key && sortConfig.direction === 'asc' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {item.label} (A-Z)
                    </button>
                    <button 
                      onClick={() => setSortConfig({ key: item.key as any, direction: 'desc' })}
                      className={`px-3 py-2 text-xs rounded-lg transition-colors ${sortConfig?.key === item.key && sortConfig.direction === 'desc' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      Z-A
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        
        {isSelectionMode && selectedIds.size > 0 && (
          <div className="flex gap-2 animate-in slide-in-from-right-4 duration-300">
            <button 
              onClick={() => handleBatchStatusUpdate('inativo')}
              className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-100 transition-all shadow-sm flex items-center gap-2"
            >
              <UserMinus size={16} />
              Inativar ({selectedIds.size})
            </button>
            <button 
              onClick={() => handleBatchStatusUpdate('ativo')}
              className="px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all shadow-sm flex items-center gap-2"
            >
              <UserCheck size={16} />
              Reativar ({selectedIds.size})
            </button>
          </div>
        )}

        <button 
          onClick={() => {
            setIsSelectionMode(!isSelectionMode);
            if (!isSelectionMode) setSelectedIds(new Set());
          }}
          className={`p-2.5 bg-white border rounded-xl transition-all shadow-sm ${isSelectionMode ? 'text-blue-600 border-blue-500 bg-blue-50' : 'text-slate-500 border-slate-200 hover:text-blue-600 hover:border-blue-200'}`}
          title="Modo de Seleção"
        >
          <CheckSquare size={18} />
        </button>
      </div>

      {/* Tabela de Colaboradores */}
      <div className="flex-1 overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
        <div className="overflow-x-auto h-full scrollbar-thin scrollbar-thumb-slate-200">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <div className="flex items-center gap-3">
                    {isSelectionMode && (
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={selectedIds.size === filtered.length && filtered.length > 0}
                        onChange={toggleSelectAll}
                      />
                    )}
                    <span>Colaborador</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Documento</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cargo</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Setor</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unidade</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                // Skeleton Rows
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-40"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-28"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-20"></div></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                       <Users size={48} className="text-slate-200" />
                       <span className="text-slate-500 font-medium">Nenhum colaborador encontrado nesta empresa.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(colab => (
                  <tr 
                    key={colab.id} 
                    className="hover:bg-slate-50/50 transition-colors group cursor-default"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {isSelectionMode && (
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={selectedIds.has(colab.id)}
                            onChange={() => toggleSelection(colab.id)}
                          />
                        )}
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm uppercase group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                          {colab.nome.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">{colab.nome}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-medium">Cadastrado em {new Date(colab.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
                         <Layers size={12} className="text-slate-400" />
                         {colab.cpf}
                      </div>
                    </td>
                    <td className="px-6 py-4 relative group dropdown-container">
                      <div 
                        className="flex items-center justify-between gap-1.5 text-xs text-slate-600 cursor-pointer p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        onClick={() => openDropdown(colab, 'cargo')}
                      >
                         <div className="flex items-center gap-1.5">
                           <Briefcase size={12} className="text-slate-400" />
                           <span className="font-semibold truncate max-w-[120px]" title={colab.cargo_nome}>{colab.cargo_nome}</span>
                         </div>
                         {activeDropdown?.colabId === colab.id && activeDropdown.type === 'cargo' ? (
                           <ChevronDown size={14} className="text-blue-500" />
                         ) : (
                           <ChevronRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                         )}
                      </div>
                      
                      {/* Dropdown Cargo */}
                      {activeDropdown?.colabId === colab.id && activeDropdown.type === 'cargo' && (
                        <div className="absolute top-full left-4 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-[100] max-h-48 flex flex-col animate-in fade-in zoom-in duration-200">
                          {loadingOptions ? (
                            <div className="p-3 text-center text-xs text-slate-500">Carregando...</div>
                          ) : dropdownOptions.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-400">Nenhum cargo disponível para o setor atual.</div>
                          ) : (
                            <div className="overflow-y-auto flex-1 p-1">
                              {dropdownOptions.map(opt => (
                                <button
                                  key={opt.id}
                                  onClick={() => updateColabField(colab.id, 'cargo', opt.id, opt.nome)}
                                  className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors hover:bg-blue-50 hover:text-blue-600 ${colab.cargo_id === opt.id ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700'}`}
                                >
                                  {opt.nome}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 relative group dropdown-container">
                      <div 
                        className="flex items-center justify-between gap-1.5 text-xs text-slate-500 cursor-pointer p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        onClick={() => openDropdown(colab, 'setor')}
                      >
                         <div className="flex items-center gap-1.5">
                           <Layers size={12} className="text-slate-400" />
                           <span className="truncate max-w-[120px]" title={colab.setor_nome}>{colab.setor_nome}</span>
                         </div>
                         {activeDropdown?.colabId === colab.id && activeDropdown.type === 'setor' ? (
                           <ChevronDown size={14} className="text-blue-500" />
                         ) : (
                           <ChevronRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                         )}
                      </div>

                      {/* Dropdown Setor */}
                      {activeDropdown?.colabId === colab.id && activeDropdown.type === 'setor' && (
                        <div className="absolute top-full left-4 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-[100] max-h-48 flex flex-col animate-in fade-in zoom-in duration-200">
                          {loadingOptions ? (
                            <div className="p-3 text-center text-xs text-slate-500">Carregando...</div>
                          ) : dropdownOptions.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-400">Nenhum setor disponível para esta unidade.</div>
                          ) : (
                            <div className="overflow-y-auto flex-1 p-1">
                              {dropdownOptions.map(opt => (
                                <button
                                  key={opt.id}
                                  onClick={() => updateColabField(colab.id, 'setor', opt.id, opt.nome)}
                                  className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors hover:bg-blue-50 hover:text-blue-600 ${colab.setor_id === opt.id ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700'}`}
                                >
                                  {opt.nome}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                         <MapPin size={12} className="text-blue-500" />
                         <span className="font-medium truncate max-w-[150px]" title={colab.unidade_nome}>{colab.unidade_nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleStatus(colab.id, colab.ativo)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
                          colab.ativo === 'ativo' 
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {colab.ativo}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseColabList;
