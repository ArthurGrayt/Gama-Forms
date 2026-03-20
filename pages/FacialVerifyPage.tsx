import React from "react";
// Importa ícones necessários da biblioteca lucide-react para manter a consistência visual
import { ShieldCheck, AlertCircle } from "lucide-react";

/**
 * Propriedades para o componente FacialVerifyPage.
 */
interface FacialVerifyPageProps {
  // Função chamada quando o usuário clica em "Aceito os termos"
  onAccept: () => void;
  // Função chamada quando o usuário clica em "Não aceito os termos"
  onDecline: () => void;
}

/**
 * Componente da página de verificação facial e aceitação de termos.
 * Adaptado para usar Tailwind puro, garantindo compatibilidade e design premium.
 */
const FacialVerifyPage: React.FC<FacialVerifyPageProps> = ({ onAccept, onDecline }) => {
  // Função para lidar com o aceite dos termos
  const handleAccept = () => {
    // Loga a ação para fins de depuração/auditoria
    console.log("Termos aceitos pelo usuário");
    // Executa a callback de sucesso passada pelo componente pai
    onAccept();
  };

  // Função para lidar com a recusa dos termos
  const handleDecline = () => {
    // Loga a recusa para fins de depuração
    console.log("Termos recusados pelo usuário");
    // Executa a callback de cancelamento passada pelo componente pai
    onDecline();
  };

  return (
    // Container principal centralizado com fundo levemente acinzentado e preenchimento responsivo
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 sm:p-6 font-sans">
      {/* Wrapper com largura máxima controlada para leitura confortável */}
      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Cabeçalho da seção com logo e título */}
        <header className="flex items-center gap-4 mb-6">
          {/* Logo da Gama Center (usando o caminho correto conforme outros arquivos) */}
          <img 
            src="/corped.png" 
            alt="Gama Logo" 
            className="h-10 w-auto object-contain"
          />
          {/* Título da tela com estilo tipográfico moderno */}
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800">
            Identificação e Termos
          </h2>
        </header>

        {/* Card customizado usando Tailwind puro para simular o visual Premium */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col border-t-[8px] border-t-[#35b6cf]">
          
          {/* Cabeçalho do Card */}
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-[#35b6cf] rounded-full flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Contrato de Consentimento</h3>
              <p className="text-xs text-slate-500">Leia atentamente as informações abaixo</p>
            </div>
          </div>

          {/* Conteúdo do Card com área de scroll interna */}
          <div className="p-6">
            <div className="h-[300px] sm:h-[400px] overflow-y-auto pr-4 text-sm text-slate-600 leading-relaxed custom-scrollbar bg-slate-50/50 p-4 rounded-lg">
              <p className="font-bold text-slate-700 mb-3">Reconhecimento Facial e Proteção de Dados</p>
              <p>
                Para garantir a segurança e a integridade da sua participação neste formulário, utilizamos tecnologias de reconhecimento facial. 
                Ao prosseguir, você autoriza a captura e o processamento de sua imagem facial para fins exclusivos de validação de identidade.
              </p>
              
              <p className="mt-4">
                Seus dados biométricos são tratados com o mais alto nível de confidencialidade, em estrita conformidade com a Lei Geral de Proteção de Dados (LGPD). 
                Não compartilhamos sua imagem com terceiros sem consentimento explícito, exceto nos casos previstos em lei.
              </p>

              <div className="mt-6 p-4 bg-blue-50/50 rounded-lg border border-blue-100 flex gap-3">
                <AlertCircle className="text-[#35b6cf] shrink-0" size={20} />
                <p className="text-xs text-slate-600 italic">
                  A recusa destes termos impossibilitará o preenchimento deste formulário específico, uma vez que a autenticação facial é um requisito de segurança estabelecido.
                </p>
              </div>

              <p className="mt-6">
                <strong>Consentimento Adicional:</strong> Além da verificação facial, você confirma que as informações fornecidas neste questionário são verídicas e que você tem autorização legal para respondê-las.
              </p>
              
              <p className="mt-4">
                Este processo leva apenas alguns segundos e ajuda a prevenir fraudes, garantindo que a sua voz e suas respostas sejam registradas de forma autêntica.
              </p>
            </div>
          </div>
          
          {/* Rodapé do Card com botões de ação responsivos */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3">
            {/* Botão de recusa - Estilo "secondary" adaptado */}
            <button 
              onClick={handleDecline}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 transition-colors border border-slate-200"
            >
              Não aceito os termos
            </button>
            
            {/* Botão de aceite - Estilo "primary" com a cor da marca */}
            <button 
              onClick={handleAccept}
              className="w-full sm:w-auto px-8 py-2.5 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/20 transition-all flex items-center justify-center gap-2"
            >
              Aceito e desejo continuar
            </button>
          </div>
        </div>

        {/* Rodapé simples fora do card */}
        <div className="mt-6 flex items-center justify-center gap-2 opacity-50">
          <img src="/favicon.png" alt="Logo" className="h-4 w-auto" />
          <span className="text-xs text-slate-500">Segurança Gama Center © 2025</span>
        </div>

      </div>
    </div>
  );
};

// Exporta o componente como padrão
export default FacialVerifyPage;