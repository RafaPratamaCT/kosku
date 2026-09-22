import { cva } from 'class-variance-authority';

/**
 * Definisi gaya tombol dipisahkan dari komponennya supaya bisa dipakai
 * komponen server (misalnya ButtonLink) tanpa ikut menarik kode klien.
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-all duration-200 ease-out active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-white shadow-xs hover:bg-brand-hover hover:shadow-soft',
        secondary: 'bg-surface-muted text-ink hover:bg-line/70',
        outline: 'border border-line-strong bg-surface text-ink hover:bg-surface-muted',
        ghost: 'text-ink-muted hover:bg-surface-muted hover:text-ink',
        soft: 'bg-brand-soft text-brand-ink hover:bg-brand-soft/70',
        danger: 'bg-danger text-white hover:bg-danger/90',
        dangerSoft: 'bg-danger-soft text-danger hover:bg-danger-soft/70',
        link: 'text-brand underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-3.5 text-[13px] [&_svg]:size-4',
        md: 'h-11 px-5 text-sm [&_svg]:size-[18px]',
        lg: 'h-12 px-6 text-[15px] [&_svg]:size-5',
        icon: 'size-10 [&_svg]:size-[18px]',
        iconSm: 'size-9 rounded-sm [&_svg]:size-4',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);
