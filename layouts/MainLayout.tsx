import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

// Importa o cliente Supabase para autenticação
import { supabase } from '../services/supabase';
// Importa ícones para a tela de acesso restrito e logout
import { ShieldAlert, LogOut } from 'lucide-react';

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
    <div className="flex min-h-screen bg-slate-50">
      <div className={`flex-1 flex flex-col relative transition-all duration-300 print:ml-0 print:w-auto print:h-auto print:static`}>
        <header className="bg-white/60 backdrop-blur-xl h-24 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm border-b border-white/40">
          <div className="flex items-center gap-4">
            {/* Logo Gama reduzida no header */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-50 to-white shadow-md flex items-center justify-center p-1 border border-white/60">
              <img
                src="https://wofipjazcxwxzzxjsflh.supabase.co/storage/v1/object/public/Media/Image/image-removebg-preview%20(2).png"
                alt="Gama Logo"
                className="w-full h-auto object-contain"
              />
            </div>
            {/* Título fixo da página */}
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Formulários</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Botão de logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-slate-500 hover:text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-all duration-300 font-medium"
            >
              <span>Sair</span>
              <LogOut size={20} />
            </button>
          </div>
        </header>
        {/* Área de conteúdo onde as rotas filhas são renderizadas */}
        <main className="p-8 overflow-y-auto flex-1 print:overflow-visible print:h-auto print:block">
          <Outlet />
        </main>
      </div>
    </div>
  );
};