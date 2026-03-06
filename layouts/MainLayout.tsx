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
  // Estado de autorização do usuário (role >= 5)
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Função que verifica se o usuário está logado e tem permissão
    const checkAuth = async () => {
      try {
        // Obtém a sessão atual do Supabase
        const { data: { session } } = await supabase.auth.getSession();

        // Se não há sessão, redireciona para login
        if (!session) {
          navigate('/login');
          return;
        }

        // Busca o role do usuário na tabela 'users'
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          // Em caso de erro ao buscar role, nega acesso
          console.error('Error fetching user role:', error);
          setAuthorized(false);
        } else {
          // Converte role para número e verifica se >= 5
          const roleValue = Number(userProfile?.role);
          if (!isNaN(roleValue) && roleValue >= 5) {
            setAuthorized(true);
          } else {
            setAuthorized(false);
          }
        }
      } catch (err) {
        // Erro genérico de autenticação
        console.error('Auth check error:', err);
        setAuthorized(false);
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

  // Exibe tela de acesso restrito se o usuário não é autorizado
  if (!authorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
          {/* Ícone de alerta */}
          <div className="bg-red-50 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={32} />
          </div>
          {/* Título */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso Restrito</h2>
          {/* Mensagem explicativa */}
          <p className="text-gray-500 mb-8">
            Seu usuário não possui permissão suficiente para acessar o sistema.
            <br />
            <span className="text-sm text-gray-400 mt-2 block">(Nível de acesso inferior a 5)</span>
          </p>
          {/* Botão para sair da conta */}
          <button
            onClick={() => {
              supabase.auth.signOut().then(() => navigate('/login'));
            }}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Sair da Conta
          </button>
        </div>
      </div>
    );
  }

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