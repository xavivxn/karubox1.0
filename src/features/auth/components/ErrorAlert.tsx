interface ErrorAlertProps {
  message: string
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  if (!message) return null;

  return (
    <div
      className="animate-login-field-1 rounded-xl border border-red-500/25 bg-red-950/35 px-4 py-3 text-sm text-red-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
      role="alert"
    >
      <p>{message}</p>
    </div>
  );
}
