import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SignaturePadNative({ onSave, onClear, width = 400, height = 200, initialSignature = null }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Desenhar assinatura inicial se existir
    if (initialSignature && initialSignature.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        setHasDrawing(true);
      };
      img.src = initialSignature;
    }
  }, [initialSignature, width, height]);

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
    // NÃO faz auto-save - usuário deve clicar no botão "Confirmar Assinatura"
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
    if (onClear) onClear();
  };

  const handleConfirm = () => {
    if (!hasDrawing) {
      toast.error('Desenhe a assinatura primeiro');
      return;
    }
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    console.log('✅ Assinatura confirmada, tamanho:', dataUrl.length);
    toast.success('Assinatura capturada com sucesso');
    if (onSave) onSave(dataUrl);
  };

  const isEmpty = () => !hasDrawing;

  // Expor métodos via ref
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.getTrimmedCanvas = () => canvasRef.current;
      canvasRef.current.isEmpty = isEmpty;
    }
  }, [hasDrawing]);

  return (
    <div className="space-y-3">
      <div className="border rounded-lg bg-white overflow-hidden" style={{ width: width + 2, height: height + 2 }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="cursor-crosshair touch-none"
          style={{ display: 'block' }}
        />
      </div>
      <div className="flex gap-2 justify-center">
        <Button 
          type="button" 
          variant="default" 
          size="sm" 
          onClick={handleConfirm}
          disabled={!hasDrawing}
          className="bg-green-600 hover:bg-green-700"
        >
          Confirmar Assinatura
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleClear}>
          Limpar
        </Button>
      </div>
    </div>
  );
}
