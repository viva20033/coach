import { Inbox } from 'lucide-react';

interface Props {
  title?: string;
  description?: string;
}

export default function Empty({ title = 'Пусто', description = 'Здесь пока ничего нет' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
        <Inbox className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="font-semibold text-slate-700">{title}</h3>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}
