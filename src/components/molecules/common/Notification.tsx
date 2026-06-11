'use client';

import { showToast, type ShowToastOptions } from '@/hooks/useToast';
import { Toaster } from '@/components/ui/toaster';

/** Shared notification API — use after any success or error action. */
export const notify = {
  success(title: string, description?: string) {
    return showToast({ intent: 'success', title, description });
  },
  error(title: string, description?: string) {
    return showToast({ intent: 'error', title, description });
  },
  info(title: string, description?: string) {
    return showToast({ intent: 'info', title, description });
  },
  warning(title: string, description?: string) {
    return showToast({ intent: 'warning', title, description });
  },
  show(options: ShowToastOptions) {
    return showToast(options);
  },
};

export function NotificationToaster() {
  return <Toaster />;
}
