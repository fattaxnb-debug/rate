import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function useServiceWorkerUpdate() {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Controller changed, reloading page...');
        window.location.reload();
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SKIP_WAITING') {
          console.log('[SW] Skip waiting message received');
          if (waitingWorker) {
            waitingWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      });
    }
  }, [waitingWorker]);

  const onSWUpdate = (registration) => {
    console.log('[SW] New version available');
    setWaitingWorker(registration.waiting);
    setShowReload(true);
    
    toast.info('Nova versão disponível! Recarregando...', {
      duration: 2000,
      position: 'top-center'
    });

    // Recarregar automaticamente após 2 segundos
    setTimeout(() => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }, 2000);
  };

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/serviceWorker.js')
        .then((registration) => {
          console.log('[SW] Registered:', registration);

          // Verificar atualizações a cada 30 segundos
          const intervalId = setInterval(() => {
            registration.update();
          }, 30000);

          // Detectar atualização imediatamente
          registration.addEventListener('updatefound', () => {
            console.log('[SW] Update found');
            const newWorker = registration.installing;
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                onSWUpdate(registration);
              }
            });
          });

          return () => clearInterval(intervalId);
        })
        .catch((error) => {
          console.error('[SW] Registration failed:', error);
        });
    }
  }, []);

  return { showReload, waitingWorker };
}
