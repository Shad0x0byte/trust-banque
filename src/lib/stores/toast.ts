// src/lib/stores/toast.ts

import { writable } from 'svelte/store';
import type { ToastMessage } from '$lib/types';

function createToastStore() {
  const { subscribe, update } = writable<ToastMessage[]>([]);

  return {
    subscribe,
    add: (toast: Omit<ToastMessage, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = { id, duration: 5000, ...toast };
      
      update((toasts) => [...toasts, newToast]);
      
      // Auto-remove after duration
      if (newToast.duration) {
        setTimeout(() => {
          update((toasts) => toasts.filter((t) => t.id !== id));
        }, newToast.duration);
      }
    },
    remove: (id: string) => {
      update((toasts) => toasts.filter((t) => t.id !== id));
    },
    success: (message: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      update((toasts) => [...toasts, { id, type: 'success', message, duration: 5000 }]);
      setTimeout(() => {
        update((toasts) => toasts.filter((t) => t.id !== id));
      }, 5000);
    },
    error: (message: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      update((toasts) => [...toasts, { id, type: 'error', message, duration: 7000 }]);
      setTimeout(() => {
        update((toasts) => toasts.filter((t) => t.id !== id));
      }, 7000);
    },
    info: (message: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      update((toasts) => [...toasts, { id, type: 'info', message, duration: 5000 }]);
      setTimeout(() => {
        update((toasts) => toasts.filter((t) => t.id !== id));
      }, 5000);
    },
    warning: (message: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      update((toasts) => [...toasts, { id, type: 'warning', message, duration: 5000 }]);
      setTimeout(() => {
        update((toasts) => toasts.filter((t) => t.id !== id));
      }, 5000);
    },
  };
}

export const toast = createToastStore();