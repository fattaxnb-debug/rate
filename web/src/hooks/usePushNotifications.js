import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';
import { toast } from 'sonner';
import axios from 'axios';

export const usePushNotifications = () => {
  const { currentUser } = useAuth();
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/serviceWorker.js')
        .then(registration => {
          console.log('Service Worker registrado:', registration);
        })
        .catch(error => {
          console.error('Erro ao registrar Service Worker:', error);
        });
    }
    
    // Solicitar permissão automaticamente se usuário for técnico
    if (currentUser?.role === 'Técnico' && 'Notification' in window && Notification.permission === 'default') {
      // Pequeno delay para não bloquear o carregamento inicial
      setTimeout(() => {
        requestPermission();
      }, 2000);
    }
  }, [currentUser]);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Este navegador não suporta notificações');
      return false;
    }

    if (Notification.permission === 'granted') {
      return await subscribeToPush();
    }

    if (Notification.permission !== 'denied') {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        return await subscribeToPush();
      } else {
        toast.error('Permissão de notificação negada');
        return false;
      }
    }

    toast.error('Permissão de notificação negada');
    return false;
  };

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator)) {
      toast.error('Service Worker não suportado');
      return false;
    }

    try {
      setLoading(true);
      const registration = await navigator.serviceWorker.ready;
      
      // VAPID keys
      const vapidPublicKey = 'BFKeq88NfXqpO39I-imw2y0_U_glELzqiL2hevAQxlWP1ZXscrgi04xiBj1fdHuTCtvguzTyly-raEN4vkVRueM';
      
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      setSubscription(pushSubscription);

      // Enviar subscription para o backend
      await saveSubscriptionToBackend(pushSubscription);
      
      toast.success('Notificações ativadas com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao se inscrever em push:', error);
      toast.error('Erro ao ativar notificações');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const saveSubscriptionToBackend = async (pushSubscription) => {
    try {
      const token = localStorage.getItem('auth_token');
      const subscriptionData = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: pushSubscription.keys.p256dh,
          auth: pushSubscription.keys.auth
        },
        user_id: currentUser?.id
      };

      await axios.post(`${API_BASE_URL}/push-subscriptions`, subscriptionData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Erro ao salvar subscription:', error);
      throw error;
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  };

  return {
    permission,
    subscription,
    loading,
    requestPermission
  };
};
