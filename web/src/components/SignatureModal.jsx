import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { X } from 'lucide-react';

export default function SignatureModal({ isOpen, onClose, onSave, title = 'Assinatura' }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 200 });
  const [isLandscape, setIsLandscape] = useState(false);

  // Detectar orientação e tamanho da tela
  useEffect(() => {
    const updateCanvasSize = () => {
      const isLandscapeMode = window.innerWidth > window.innerHeight;
      setIsLandscape(isLandscapeMode);
      
      const padding = 32;
      const availableWidth = Math.min(window.innerWidth - padding, 800);
      const availableHeight = Math.min(window.innerHeight - 200, 400);
      
      if (isLandscapeMode) {
        // Em landscape: usar toda largura disponível
        setCanvasSize({
          width: availableWidth,
          height: Math.max(200, availableHeight * 0.5)
        });
      } else {
        // Em portrait: altura maior, largura limitada
        setCanvasSize({
          width: Math.min(400, availableWidth),
          height: Math.max(250, availableHeight * 0.6)
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    window.addEventListener('orientationchange', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      window.removeEventListener('orientationchange', updateCanvasSize);
    };
  }, []);

  // Configurar canvas quando modal abre
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      setHasDrawing(false);
      setSignerName('');
    }
  }, [isOpen, canvasSize]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
  };

  const handleConfirm = () => {
    if (!hasDrawing) {
      toast.error('Desenhe a assinatura primeiro');
      return;
    }
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    toast.success('Assinatura capturada com sucesso');
    if (onSave) onSave(dataUrl, signerName);
    handleClose();
  };

  const handleClose = () => {
    handleClear();
    setSignerName('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Campo para nome do assinante */}
          <div>
            <label className="block text-sm font-medium mb-1">Nome do Assinante</label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Digite o nome completo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Canvas de assinatura */}
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="cursor-crosshair touch-none w-full"
              style={{ display: 'block', touchAction: 'none' }}
            />
          </div>

          {/* Instrução de orientação */}
          {isLandscape && (
            <p className="text-xs text-gray-500 text-center">
              ✨ Modo horizontal ativo - Área de captura expandida
            </p>
          )}

          {/* Botões */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Limpar
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!hasDrawing}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirmar Assinatura
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
