import { ChevronLeft } from 'lucide-react';
import { useBackNavigation } from '../hooks/use-back-navigation';

export function BackButton({ fallbackPath, label = 'Quay lại' }: { fallbackPath: string; label?: string }) {
  const goBack = useBackNavigation(fallbackPath);

  return (
    <button
      type='button'
      onClick={goBack}
      className='inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[#2d2a26]/30 rounded-xl bg-white hover:-translate-y-0.5 transition-all'
    >
      <ChevronLeft className='w-4 h-4' />
      {label}
    </button>
  );
}
