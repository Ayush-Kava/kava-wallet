'use client';

import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useToast, TOAST_COPY } from '@/hooks/useToast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const intentIcon = {
  success: <CheckCircle2 className="h-5 w-5 text-white" aria-hidden />,
  error: <AlertCircle className="h-5 w-5 text-white" aria-hidden />,
  warning: <AlertTriangle className="h-5 w-5 text-white" aria-hidden />,
  info: <Info className="h-5 w-5 text-white" aria-hidden />,
} as const;

const intentStyles = {
  success: 'border border-white/10 bg-black text-white',
  error: 'border border-red-500 bg-red-600 text-white',
  warning: 'border border-amber-500 bg-amber-600 text-white',
  info: 'border border-white/10 bg-black text-white',
} as const;

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={5000}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const intent =
          (props as { dataIntent?: keyof typeof intentIcon }).dataIntent ??
          (props.variant === 'destructive' ? 'error' : 'success');
        const intentKey = intent as keyof typeof intentIcon;
        const fallback = TOAST_COPY[intentKey] ?? TOAST_COPY.info;
        const icon = intentIcon[intentKey] ?? intentIcon.info;
        const tone = intentStyles[intentKey] ?? intentStyles.info;

        return (
          <Toast key={id} {...props} className={cn(props.className, tone)}>
            <div className="flex gap-2">
              <span className="mt-0.5" aria-hidden>
                {icon}
              </span>
              <div className="grid gap-1">
                <ToastTitle>{title ?? fallback.title}</ToastTitle>
                {(description ?? fallback.description) && (
                  <ToastDescription>{description ?? fallback.description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
