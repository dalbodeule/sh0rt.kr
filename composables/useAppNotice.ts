export interface AppNotice {
  type: 'info' | 'success' | 'error' | 'confirm';
  message: string;
}

let pendingConfirmation: ((accepted: boolean) => void) | null = null;

export const useAppNotice = () => {
  const notice = useState<AppNotice | null>('app-notice', () => null);

  const close = (accepted = false) => {
    const resolve = pendingConfirmation;
    pendingConfirmation = null;
    notice.value = null;
    resolve?.(accepted);
  };

  const show = (message: string, type: AppNotice['type'] = 'info') => {
    notice.value = { message, type };
  };

  const confirm = (message: string) =>
    new Promise<boolean>((resolve) => {
      pendingConfirmation = resolve;
      notice.value = { message, type: 'confirm' };
    });

  return { notice, show, confirm, close };
};
