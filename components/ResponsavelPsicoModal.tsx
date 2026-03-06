import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { X, Plus, Edit2, Trash2, Save, XCircle } from 'lucide-react';

interface ResponsavelPsico {
    id: number;
    created_at: string;
    nome: string;
    CRP: string;
    Especialidade: string;
    cargo?: string;
    form_id: number;
}

interface ResponsavelPsicoModalProps {
    isOpen: boolean;
    onClose: () => void;
    formId: number;
    onResponsavelChange: () => void; // Callback to trigger refresh on parent
}

export const ResponsavelPsicoModal: React.FC<ResponsavelPsicoModalProps> = ({ isOpen, onClose, formId, onResponsavelChange }) => {
    const [responsaveis, setResponsaveis] = useState<ResponsavelPsico[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<number | null>(null);
    const [editData, setEditData] = useState<Partial<ResponsavelPsico>>({ nome: '', CRP: '', Especialidade: '', cargo: '' });

    // Buscar dados quando o modal abre
    useEffect(() => {
        if (isOpen && formId) {
            fetchResponsaveis();
        }
    }, [isOpen, formId]);

    // Função para buscar os responsáveis do formulário atual
    const fetchResponsaveis = async () => {
        setLoading(true);
        try {
            // Busca apenas os responsáveis associados a este formulário
            const { data, error } = await supabase
                .from('responsavel_psico')
                .select('*')
                .eq('form_id', formId)
                .order('nome');

            if (error) {
                console.error("Erro ao buscar responsáveis:", error);
                // Evita quebrar a tela em caso de falha silenciosa
            } else {
                setResponsaveis(data || []);
            }
        } catch (error) {
            console.error("Exceção ao buscar responsáveis:", error);
        } finally {
            setLoading(false);
        }
    };

    // Função para iniciar criação de novo responsável
    const handleAddNew = () => {
        setIsEditing(-1); // -1 indica novo registro
        setEditData({ nome: '', CRP: '', Especialidade: '', cargo: '' });
    };

    // Função para iniciar edição de existente
    const handleEdit = (responsavel: ResponsavelPsico) => {
        setIsEditing(responsavel.id);
        setEditData({ nome: responsavel.nome, CRP: responsavel.CRP, Especialidade: responsavel.Especialidade, cargo: responsavel.cargo || '' });
    };

    // Função para cancelar edição/criação
    const handleCancelEdit = () => {
        setIsEditing(null);
        setEditData({ nome: '', CRP: '', Especialidade: '', cargo: '' });
    };

    // Função para salvar cadastro (novo ou edição)
    const handleSave = async () => {
        if (!editData.nome || !editData.CRP || !editData.Especialidade || !editData.cargo) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        try {
            if (isEditing === -1) {
                // Inserir novo
                const { error } = await supabase
                    .from('responsavel_psico')
                    .insert([{
                        nome: editData.nome,
                        CRP: editData.CRP,
                        Especialidade: editData.Especialidade,
                        cargo: editData.cargo,
                        form_id: formId
                    }]);
                if (error) throw error;
            } else if (isEditing !== null) {
                // Atualizar existente
                const { error } = await supabase
                    .from('responsavel_psico')
                    .update({
                        nome: editData.nome,
                        CRP: editData.CRP,
                        Especialidade: editData.Especialidade,
                        cargo: editData.cargo
                    })
                    .eq('id', isEditing);
                if (error) throw error;
            }

            // Após salvar, recarregar estado, fechar edição e avisar parent
            await fetchResponsaveis();
            handleCancelEdit();
            onResponsavelChange(); // Avisa o component pai que houve mudança

        } catch (error) {
            console.error("Erro ao salvar responsável:", error);
            alert("Erro ao salvar dados do responsável.");
        }
    };

    // Função para deletar um responsável
    const handleDelete = async (id: number) => {
        if (!window.confirm("Tem certeza que deseja excluir este responsável?")) return;

        try {
            const { error } = await supabase
                .from('responsavel_psico')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await fetchResponsaveis();
            onResponsavelChange(); // Avisa o component pai que houve mudança
        } catch (error) {
            console.error("Erro ao excluir responsável:", error);
            alert("Erro ao excluir responsável.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Editar Responsáveis</h2>
                        <p className="text-sm text-slate-500 mt-1">Gerencie os profissionais associados a este formulário</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-semibold text-slate-700">Profissionais Cadastrados</h3>
                        {isEditing === null && (
                            <button
                                onClick={handleAddNew}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                <Plus size={16} />
                                Adicionar
                            </button>
                        )}
                    </div>

                    {/* Formulário de Criação/Edição */}
                    {isEditing !== null && (
                        <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm mb-6 animate-in slide-in-from-top-4">
                            <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
                                {isEditing === -1 ? 'Novo Responsável' : 'Editar Responsável'}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Nome</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Dra. Ana Silva"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        value={editData.nome}
                                        onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Documento</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: 00/00000"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        value={editData.CRP}
                                        onChange={(e) => setEditData({ ...editData, CRP: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Especialidade</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Psicóloga Organizacional"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        value={editData.Especialidade}
                                        onChange={(e) => setEditData({ ...editData, Especialidade: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Cargo</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Psicólogo Sênior"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        value={editData.cargo || ''}
                                        onChange={(e) => setEditData({ ...editData, cargo: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <XCircle size={16} /> Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                                >
                                    <Save size={16} /> Salvar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Tabela de Listagem */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        {loading ? (
                            <div className="p-8 text-center text-slate-500">Caregando...</div>
                        ) : responsaveis.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50">
                                <p className="text-slate-500 mb-2">Nenhum responsável cadastrado para este formulário.</p>
                                {isEditing === null && (
                                    <button onClick={handleAddNew} className="text-blue-600 font-medium hover:underline text-sm">
                                        Clique aqui para adicionar o primeiro.
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3">Nome</th>
                                            <th className="px-4 py-3">Documento</th>
                                            <th className="px-4 py-3">Especialidade</th>
                                            <th className="px-4 py-3">Cargo</th>
                                            <th className="px-4 py-3 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {responsaveis.map((resp) => (
                                            <tr key={resp.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-slate-800">{resp.nome}</td>
                                                <td className="px-4 py-3">{resp.CRP}</td>
                                                <td className="px-4 py-3">{resp.Especialidade}</td>
                                                <td className="px-4 py-3">{resp.cargo}</td>
                                                <td className="px-4 py-3 text-right space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(resp)}
                                                        disabled={isEditing !== null}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(resp.id)}
                                                        disabled={isEditing !== null}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
