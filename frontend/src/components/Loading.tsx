import { Loader2 } from 'lucide-react';

interface Props {
  text?: string;
}

export default function Loading({ text = 'Загрузка...' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}
