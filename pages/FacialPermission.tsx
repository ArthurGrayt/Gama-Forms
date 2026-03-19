// Importa hooks essenciais do React para gerenciamento de estado e ciclo de vida
import { useEffect, useRef, useState } from "react";
// Importa o núcleo do TensorFlow.js para processamento de Machine Learning no navegador
import * as tf from "@tensorflow/tfjs";
// Importa o modelo BlazeFace, otimizado para detecção rápida de rostos em tempo real
import * as blazeface from "@tensorflow-models/blazeface";
// Importa ícones da biblioteca Lucide para feedback visual e interface
import { Camera, RotateCcw, CheckCircle, XCircle, Loader2, Info } from "lucide-react";

/** --- COMPONENTES AUXILIARES INTERNOS --- **/

// Componente de Botão customizado com estilos Tailwind
const Button = ({ children, onClick, disabled, className, size = "md", variant = "default" }: any) => {
  const baseStyles = "inline-flex items-center justify-center rounded-2xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizeStyles = size === "lg" ? "px-10 h-12 text-base" : "px-6 h-10 text-sm";
  const variantStyles = variant === "default" ? "bg-[#35b6cf] text-white hover:bg-[#2ca1b7] shadow-lg shadow-[#35b6cf]/20" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50";
  
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}>
      {children}
    </button>
  );
};

// Componente de Barra de Progresso simplificado
const Progress = ({ value, className }: { value: number, className?: string }) => (
  <div className={`w-full bg-white/20 rounded-full h-2 overflow-hidden ${className}`}>
    <div 
      className="h-full bg-green-500 transition-all duration-300 ease-out" 
      style={{ width: `${value}%` }}
    />
  </div>
);

// Componente de Spinner animado para estados de loading
const Spinner = ({ className }: { className?: string }) => (
  <Loader2 className={`animate-spin ${className}`} />
);

// Componente FaceOverlay: Cria uma máscara escura com uma ELIPSE transparente no centro para guiar o usuário
interface FaceOverlayProps {
  isDesktop: boolean;
}

const FaceOverlay = ({ isDesktop }: FaceOverlayProps) => {
  // Define os raios da elipse (30% maior se for desktop)
  const rx = isDesktop ? 160 * 1.3 : 160;
  const ry = isDesktop ? 230 * 1.3 : 230;

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full">
        <defs>
          <mask id="face-mask">
            <rect width="100%" height="100%" fill="white" />
            <ellipse cx="50%" cy="45%" rx={rx} ry={ry} fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="black" fillOpacity="0.6" mask="url(#face-mask)" />
        <ellipse cx="50%" cy="45%" rx={rx} ry={ry} stroke="white" strokeWidth="3" strokeDasharray="8 8" fill="transparent" />
      </svg>
    </div>
  );
};

/** --- COMPONENTE PRINCIPAL --- **/

type FlowStep = "permission" | "camera" | "validating" | "success" | "error";

interface FacialPermissionProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

export default function FacialPermission({ onAccept, onDecline }: FacialPermissionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [model, setModel] = useState<blazeface.BlazeFaceModel | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [step, setStep] = useState<FlowStep>("permission");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  
  // Estado para detectar se o dispositivo é desktop
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  /** Monitora redimensionamento da tela para ajustar a moldura */
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadIA = async () => {
      try {
        await tf.ready();
        const m = await blazeface.load();
        setModel(m);
      } catch (e) {
        console.error("Erro IA:", e);
      } finally {
        setIsModelLoading(false);
      }
    };
    loadIA();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const requestCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(mediaStream);
      setHasPermission(true);
      setStep("camera");
    } catch (err) {
      setHasPermission(false);
    }
  };

  useEffect(() => {
    if (step === "camera" && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [step, stream]);

  const handleCaptureButton = () => {
    if (isModelLoading || !model) return;
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => (c !== null ? c - 1 : null)), 1000);
      return () => clearTimeout(t);
    } else {
      processCapture();
    }
  }, [countdown]);

  const processCapture = async () => {
    setCountdown(null);
    setStep("validating");

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !model) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedPhotoUrl(dataUrl);

    try {
      const predictions = await model.estimateFaces(canvas, false);
      setTimeout(() => evaluate(predictions), 1000);
    } catch (e) {
      setStep("error");
    }
  };

  const evaluate = (preds: any[]) => {
    if (preds.length === 1) {
      setProgressValue(0);
      setStep("success");
    } else {
      // Falha na detecção: obriga o usuário a tentar novamente
      setStep("error");
    }
  };

  const retry = () => {
    setCapturedPhotoUrl(null);
    setStep("camera");
  };

  useEffect(() => {
    if (step !== "success") return;

    const interval = setInterval(() => {
      setProgressValue(v => {
        if (v >= 100) {
          clearInterval(interval);
          onAccept?.();
          return 100;
        }
        return Math.min(v + 20, 100);
      });
    }, 150);

    return () => clearInterval(interval);
  }, [step, onAccept]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans">
      <canvas ref={canvasRef} className="hidden" />

      {step === "permission" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-slate-950 text-white p-8 animate-in fade-in duration-500">
          <Camera size={64} className="text-[#35b6cf]" />
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-bold">Biometria Facial</h1>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">
              Sua foto será analisada apenas localmente para segurança, sem armazenamento.
            </p>
          </div>
          <Button onClick={requestCamera} size="lg" className="mt-4">
            Ativar Câmera
          </Button>
          <button onClick={onDecline} className="text-slate-100 text-sm hover:underline mt-4">Sair</button>
        </div>
      )}

      {step === "camera" && (
        <>
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
          <FaceOverlay isDesktop={isDesktop} />
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="text-[120px] font-black text-white">{countdown}</span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-4 pb-12 pt-8 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-sm font-medium">Posicione seu rosto na moldura {isDesktop && '(Desktop Focus)'}</p>
            <button 
              onClick={handleCaptureButton} 
              className="w-20 h-20 rounded-full bg-white border-4 border-slate-200 shadow-2xl active:scale-95 transition-transform" 
            />
          </div>
        </>
      )}

      {step === "validating" && (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-6">
          <Spinner className="w-16 h-16 text-[#35b6cf]" />
          <h2 className="text-white text-xl font-bold italic">Analisando BioID...</h2>
        </div>
      )}

      {step === "success" && capturedPhotoUrl && (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-500">
          <div className="relative w-64 h-64 mb-8">
            <img src={capturedPhotoUrl} alt="Capture" className="w-full h-full object-cover rounded-full border-4 border-green-500 shadow-2xl" />
          </div>
          <h2 className="text-white text-2xl font-bold mb-4 text-center">Identificado com Sucesso!</h2>
          <div className="w-full max-w-xs">
            <Progress value={progressValue} />
          </div>
        </div>
      )}

      {step === "error" && (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-8 gap-6 text-center animate-in slide-in-from-top-4 duration-500">
          <XCircle size={64} className="text-red-500" />
          <div className="space-y-2">
            <h2 className="text-white text-xl font-bold">Rosto não detectado</h2>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              Não conseguimos identificar você. Uma nova foto é obrigatória para prosseguir.
              Certifique-se de estar em um local bem iluminado.
            </p>
          </div>
          <Button onClick={retry} variant="default" className="mt-2 gap-2">
            <RotateCcw size={18} /> Tentar Novamente
          </Button>
          <button onClick={onDecline} className="text-slate-500 text-sm hover:underline">Voltar</button>
        </div>
      )}
    </div>
  );
}