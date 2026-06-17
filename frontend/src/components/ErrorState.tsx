import { AlertCircle } from 'lucide-react';

interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-6">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-danger" />
      </div>
      <p className="text-sm text-slate-600">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary text-sm py-2.5 px-5">
          Повторить
        </button>
      )}
    </div>
  );
}
