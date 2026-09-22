import { cn } from '@/lib/utils';

/**
 * Gambar kamar. Kalau belum ada foto yang diunggah, ditampilkan ilustrasi
 * bawaan yang warnanya konsisten mengikuti nomor kamar — jadi halaman tetap
 * terlihat rapi sebelum pemilik kos mengunggah foto asli.
 */

function hashOf(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 100000;
  }
  return hash;
}

const PALETTES = [
  { from: '#E6F2EF', to: '#D2E7E1', line: '#9CC3B9' },
  { from: '#EEF1F8', to: '#DCE3F1', line: '#A9B6D4' },
  { from: '#F6EFE8', to: '#EDE0D2', line: '#CDB79F' },
  { from: '#EFEDF7', to: '#E1DCF0', line: '#B5ACD8' },
  { from: '#E9F2F7', to: '#D7E7F0', line: '#9CBFD2' },
] as const;

export function RoomImage({
  seed,
  src,
  alt,
  className,
  rounded = 'rounded-xl',
}: {
  seed: string;
  src?: string | null;
  alt: string;
  className?: string;
  rounded?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt}
        className={cn('h-full w-full bg-surface-muted object-cover', rounded, className)}
      />
    );
  }

  const palette = PALETTES[hashOf(seed) % PALETTES.length]!;
  const id = `g${hashOf(seed)}`;

  return (
    <div className={cn('relative overflow-hidden bg-surface-muted', rounded, className)}>
      <svg
        viewBox="0 0 400 280"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        role="img"
        aria-label={alt}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette.from} />
            <stop offset="100%" stopColor={palette.to} />
          </linearGradient>
        </defs>
        <rect width="400" height="280" fill={`url(#${id})`} />
        <g stroke={palette.line} strokeWidth="2" fill="none" strokeLinecap="round">
          {/* dinding & lantai */}
          <path d="M0 196 H400" />
          {/* jendela */}
          <rect x="52" y="58" width="104" height="84" rx="8" />
          <path d="M104 58 V142 M52 100 H156" />
          {/* ranjang */}
          <path d="M196 196 V150 a10 10 0 0 1 10-10 h128 a10 10 0 0 1 10 10 v46" />
          <path d="M196 168 H344" />
          <rect x="212" y="146" width="40" height="18" rx="6" />
          {/* lampu gantung */}
          <path d="M120 24 V44" />
          <path d="M104 60 a16 16 0 0 1 32 0 z" fill={palette.line} fillOpacity="0.25" />
          {/* tanaman */}
          <path d="M40 196 v-22 M40 174 c-14 -4 -18 -18 -6 -22 8 -3 12 8 6 22z M40 178 c14 -6 18 -20 6 -24 -8 -3 -12 10 -6 24z" />
        </g>
      </svg>
    </div>
  );
}
