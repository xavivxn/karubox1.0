interface ErrorAlertProps {
  message: string
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  if (!message) return null;

  return (
    <div
      className="animate-login-field-1 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm"
      role="alert"
    >
      <p>{message}</p>
    </div>
  );
}
