interface ToastProps {
  message: string | null;
  className?: string;
}

export default function Toast({ message, className }: ToastProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={
        className ??
        "fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in"
      }
    >
      {message}
    </div>
  );
}
