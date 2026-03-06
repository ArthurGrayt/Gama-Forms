import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';

// Lazy Load das páginas mantidas
const Login = React.lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Formularios = React.lazy(() => import('./pages/Formularios').then(module => ({ default: module.Formularios })));
const FormularioPublico = React.lazy(() => import('./pages/FormularioPublico').then(module => ({ default: module.FormularioPublico })));

// Componente de loading exibido enquanto carrega uma página
const PageLoader = () => (
  <div className="h-full w-full flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-2">
      {/* Spinner animado */}
      <div className="w-8 h-8 rounded-full border-4 border-blue-500/30 border-t-blue-600 animate-spin"></div>
      {/* Texto de carregamento */}
      <span className="text-sm font-medium text-slate-500">Carregando...</span>
    </div>
  </div>
);

function App() {
  return (
    <HashRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Rota de login */}
          <Route path="/login" element={<Login />} />
          {/* Rota pública de formulário por slug */}
          <Route path="/form/:slug" element={<FormularioPublico />} />

          {/* Layout principal protegido (com sidebar e auth) */}
          <Route path="/" element={<MainLayout />}>
            {/* Rota raiz redireciona para formulários */}
            <Route index element={<Navigate to="/formularios" replace />} />
            {/* Página de formulários */}
            <Route path="formularios" element={<Formularios />} />
          </Route>

          {/* Qualquer rota desconhecida redireciona para raiz */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

export default App;