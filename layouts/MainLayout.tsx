import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

// Importa o cliente Supabase para autenticação
import { supabase } from '../services/supabase';
// Importa ícones para a tela de acesso restrito, logout e navegação na sidebar
import { ShieldAlert, LogOut, FileText, Users } from 'lucide-react';
// Importa NavLink do react-router-dom para os links de navegação ativa
import { NavLink } from 'react-router-dom';

export const MainLayout: React.FC = () => {
  // Hook de navegação
  const navigate = useNavigate();
  // Estado de loading enquanto verifica autenticação
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Função que verifica se o usuário está logado
    const checkAuth = async () => {
      try {
        // Obtém a sessão atual do Supabase
        const { data: { session } } = await supabase.auth.getSession();

        // Se não há sessão, redireciona para login
        if (!session) {
          navigate('/login');
          return;
        }
      } catch (err) {
        // Erro genérico de autenticação
        console.error('Auth check error:', err);
      } finally {
        // Finaliza o loading independente do resultado
        setLoading(false);
      }
    };

    // Executa verificação de auth
    checkAuth();

    // Ouve mudanças no estado de autenticação (logout, expiração)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/login');
      }
    });

    // Cleanup: cancela a subscription ao desmontar
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Função de logout: desconecta do Supabase e redireciona para login
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Exibe loading enquanto verifica autenticação
  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-gray-50/50 backdrop-blur-sm">Carregando...</div>;

  return (
    // Container principal de toda a estrutura com fundo cinza
    <div className="flex min-h-screen bg-slate-50">
      
      {/* Sidebar Fixa Lateral */}
      <aside className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-6 fixed h-full z-20 shadow-sm print:hidden">
        
        {/* Logo Gama no topo da Sidebar */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-50 to-white shadow-sm flex items-center justify-center p-1.5 border border-slate-100 mb-6">
          <img
            src="https://wofipjazcxwxzzxjsflh.supabase.co/storage/v1/object/public/Media/Image/image-removebg-preview%20(2).png"
            alt="Gama Logo"
            className="w-full h-auto object-contain"
          />
        </div>

        <nav className="flex flex-col gap-4 items-center w-full">
          {/* Link para visualização de Formulários */}
          <NavLink 
            to="/formularios"
            className={({ isActive }) => 
              `group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${isActive ? 'bg-blue-100 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`
            }
          >
            <FileText size={20} />
            <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-all duration-200 z-50 uppercase tracking-wider">
              Forms
            </span>
          </NavLink>

          {/* Link para gerenciamento de Colaboradores */}
          <NavLink 
            to="/colaboradores"
            className={({ isActive }) => 
              `group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${isActive ? 'bg-blue-100 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`
            }
          >
            <Users size={20} />
            <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-all duration-200 z-50 uppercase tracking-wider">
              Equipe
            </span>
          </NavLink>
        </nav>

        {/* Botão de Logout no rodapé da Sidebar */}
        <button
          onClick={handleLogout}
          className="mt-auto group relative flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all duration-300 mb-2"
        >
          <LogOut size={20} />
          <span className="absolute left-full ml-4 px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-all duration-200 z-50 uppercase tracking-wider">
            Sair
          </span>
        </button>
        
      </aside>

      {/* Conteúdo Principal */}
      <div className={`flex-1 ml-16 flex flex-col relative transition-all duration-300 print:ml-0 print:w-auto print:h-auto print:static`}>
        {/* Área de conteúdo onde as rotas filhas são renderizadas */}
        <main className="p-0 overflow-y-auto flex-1 print:overflow-visible print:h-auto print:block">
          <Outlet />
        </main>
      </div>
    </div>
  );
};