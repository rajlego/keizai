import { useUIStore, type Toast } from '../../store/uiStore';

function ToastItem({ toast }: { toast: Toast }) {
  const dismissToast = useUIStore((state) => state.dismissToast);

  const bgColor = {
    error: 'bg-[var(--color-pixel-error)]',
    success: 'bg-[var(--color-pixel-success)]',
    info: 'bg-[var(--color-pixel-accent)]',
  }[toast.type];

  return (
    <div
      className={`${bgColor} text-[var(--color-pixel-bg)] px-3 py-2 text-[11px] border-2 border-[#000] shadow-lg flex items-start gap-2 max-w-[320px] animate-slide-in`}
    >
      <span className="flex-1 break-words">{toast.message}</span>
      <button
        onClick={() => dismissToast(toast.id)}
        className="text-[var(--color-pixel-bg)] hover:text-white font-bold leading-none"
      >
        ×
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useUIStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-12 right-2 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
