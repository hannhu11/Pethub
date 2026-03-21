import brandLockup from '../../assets/images/branding/pethub-logo-lockup.png';
import { cn } from './ui/utils';

type BrandLockupProps = {
  className?: string;
  imageClassName?: string;
  alt?: string;
};

export function BrandLockup({
  className,
  imageClassName,
  alt = 'PetHub',
}: BrandLockupProps) {
  return (
    <div className={cn('inline-flex items-center', className)}>
      <img
        src={brandLockup}
        alt={alt}
        className={cn('h-10 w-auto max-w-none object-contain', imageClassName)}
        decoding='async'
      />
    </div>
  );
}
