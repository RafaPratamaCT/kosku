import Link from 'next/link';
import {
  ArrowRight,
  Bath,
  BedDouble,
  Check,
  CookingPot,
  MapPin,
  MessageCircle,
  ParkingCircle,
  ShieldCheck,
  Shirt,
  Snowflake,
  Sparkles,
  Sun,
  Wifi,
} from 'lucide-react';

import { FaqList } from '@/components/public/faq';
import { RoomImage } from '@/components/room-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonLink, ExternalButtonLink } from '@/components/ui/button-link';
import { Card } from '@/components/ui/card';
import { IconBox, SectionHeading } from '@/components/ui/misc';
import { RoomTypeBadge } from '@/components/ui/status';
import { expireStaleBookings, heldRoomIds } from '@/lib/bookings';
import { prisma } from '@/lib/db';
import { formatRupiah, waLink } from '@/lib/format';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const FACILITIES = [
  {
    icon: Wifi,
    label: 'WiFi 100 Mbps',
    description: 'Fiber optic, stabil sampai kamar.',
    tone: 'sky' as const,
  },
  {
    icon: Snowflake,
    label: 'AC di setiap kamar',
    description: 'Dirawat rutin tiap 3 bulan.',
    tone: 'brand' as const,
  },
  {
    icon: Bath,
    label: 'Kamar mandi dalam',
    description: 'Air panas untuk tipe Deluxe & VIP.',
    tone: 'lilac' as const,
  },
  {
    icon: CookingPot,
    label: 'Dapur bersama',
    description: 'Kompor, kulkas, dan microwave.',
    tone: 'peach' as const,
  },
  {
    icon: Shirt,
    label: 'Laundry',
    description: 'Layanan cuci-setrika kiloan.',
    tone: 'mint' as const,
  },
  {
    icon: ParkingCircle,
    label: 'Parkir luas',
    description: 'Motor gratis, mobil terbatas.',
    tone: 'sky' as const,
  },
  {
    icon: ShieldCheck,
    label: 'CCTV 24 jam',
    description: 'Gerbang otomatis dan penjaga.',
    tone: 'brand' as const,
  },
  {
    icon: Sparkles,
    label: 'Bersih tiap hari',
    description: 'Area bersama disapu dua kali sehari.',
    tone: 'lilac' as const,
  },
];

const FAQ_ITEMS = [
  {
    question: 'Bagaimana cara booking kamar di sini?',
    answer:
      'Pilih kamar yang berstatus tersedia, tentukan tanggal masuk dan durasi sewa, lalu buat akun. Kamar akan dikunci untuk Anda selama 30 menit sambil menyelesaikan pembayaran. Setelah pembayaran berhasil, kamar langsung menjadi milik Anda tanpa menunggu persetujuan.',
  },
  {
    question: 'Apa saja yang harus dibayar di awal?',
    answer:
      'Biaya sewa sesuai durasi yang dipilih ditambah deposit. Deposit dikembalikan penuh saat check-out bila tidak ada kerusakan pada kamar.',
  },
  {
    question: 'Apakah bisa perpanjang sewa?',
    answer:
      'Bisa. Masuk ke dashboard penghuni, buka menu Pengajuan, lalu pilih Perpanjang sewa. Pemilik kos akan menyetujui dan tagihan bulan berikutnya otomatis terbit.',
  },
  {
    question: 'Bagaimana kalau ada kerusakan di kamar?',
    answer:
      'Laporkan lewat menu Komplain di dashboard penghuni. Pilih kategori, tingkat prioritas, dan lampirkan foto. Anda bisa memantau statusnya dan membalas langsung di halaman komplain.',
  },
  {
    question: 'Metode pembayarannya apa saja?',
    answer:
      'Tersedia QRIS dan transfer bank. Untuk transfer, unggah bukti pembayaran lalu pemilik kos akan memverifikasi. Perlu dicatat, QRIS pada aplikasi ini masih mode demo — tidak ada uang sungguhan yang berpindah.',
  },
];

export default async function LandingPage() {
  await expireStaleBookings();

  const [settings, rooms, totalRooms, availableRooms, held] = await Promise.all([
    getSettings(),
    prisma.room.findMany({
      where: { status: 'AVAILABLE' },
      orderBy: [{ price: 'asc' }],
      take: 3,
      include: { photos: { orderBy: { order: 'asc' }, take: 1 } },
    }),
    prisma.room.count(),
    prisma.room.count({ where: { status: 'AVAILABLE' } }),
    heldRoomIds(),
  ]);

  const cheapest = await prisma.room.aggregate({ _min: { price: true } });
  const rules = settings.rules.split('\n').filter(Boolean);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(120% 80% at 85% 0%, hsl(var(--brand-soft)) 0%, transparent 55%)',
          }}
          aria-hidden
        />
        <div className="container grid items-center gap-14 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="animate-fade-up space-y-7">
            <Badge tone="brand" className="px-3 py-1.5">
              <Sun className="size-3.5" aria-hidden />
              {availableRooms} dari {totalRooms} kamar tersedia
            </Badge>

            <div className="space-y-5">
              <h1 className="text-[34px] font-bold leading-[1.1] tracking-tight text-ink sm:text-[46px] lg:text-[52px]">
                {settings.kosName}
              </h1>
              <p className="max-w-lg text-[16px] leading-relaxed text-ink-muted sm:text-[17px]">
                {settings.kosTagline}. Booking online, bayar, dan urus semua kebutuhan kos dari satu
                dashboard.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/kosku/rooms" size="lg" className="w-full sm:w-auto">
                Lihat kamar tersedia
                <ArrowRight aria-hidden />
              </ButtonLink>
              <ExternalButtonLink
                href={waLink(
                  settings.ownerPhone,
                  `Halo, saya mau tanya kamar di ${settings.kosName}`,
                )}
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle aria-hidden />
                Tanya pemilik
              </ExternalButtonLink>
            </div>

            <dl className="grid max-w-md grid-cols-3 gap-6 pt-4">
              <div>
                <dt className="text-[12.5px] text-ink-muted">Mulai dari</dt>
                <dd className="mt-1 text-[19px] font-bold text-ink">
                  {formatRupiah(cheapest._min.price ?? 0)}
                </dd>
                <p className="text-[12px] text-ink-subtle">per bulan</p>
              </div>
              <div>
                <dt className="text-[12.5px] text-ink-muted">Total kamar</dt>
                <dd className="mt-1 text-[19px] font-bold text-ink">{totalRooms}</dd>
                <p className="text-[12px] text-ink-subtle">3 tipe pilihan</p>
              </div>
              <div>
                <dt className="text-[12.5px] text-ink-muted">Check-in</dt>
                <dd className="mt-1 text-[19px] font-bold text-ink">{settings.checkInTime}</dd>
                <p className="text-[12px] text-ink-subtle">setiap hari</p>
              </div>
            </dl>
          </div>

          <div className="relative animate-fade-up">
            <div className="grid grid-cols-2 gap-4">
              <RoomImage
                seed="hero-a"
                alt="Ilustrasi kamar kos"
                rounded="rounded-2xl"
                className="col-span-2 aspect-[16/10] shadow-lift"
              />
              <RoomImage
                seed="hero-b"
                alt="Ilustrasi area bersama"
                rounded="rounded-xl"
                className="aspect-[4/3] shadow-soft"
              />
              <RoomImage
                seed="hero-c"
                alt="Ilustrasi dapur bersama"
                rounded="rounded-xl"
                className="aspect-[4/3] shadow-soft"
              />
            </div>

            <Card className="absolute -bottom-6 left-4 flex items-center gap-3 p-4 shadow-lift sm:left-8">
              <IconBox tone="mint">
                <ShieldCheck aria-hidden />
              </IconBox>
              <div>
                <p className="text-[13.5px] font-semibold text-ink">Keamanan 24 jam</p>
                <p className="text-[12px] text-ink-muted">CCTV & gerbang otomatis</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Kamar pilihan */}
      <section className="section-gap">
        <div className="container space-y-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Pilihan kamar"
              title="Kamar yang siap ditempati"
              description="Harga sudah termasuk listrik, air, dan WiFi. Tidak ada biaya tersembunyi."
            />
            <ButtonLink href="/kosku/rooms" variant="outline" className="shrink-0">
              Semua kamar
              <ArrowRight aria-hidden />
            </ButtonLink>
          </div>

          {rooms.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-[15px] font-semibold text-ink">Semua kamar sedang terisi</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
                Hubungi pemilik kos untuk masuk daftar tunggu. Kami kabari begitu ada kamar kosong.
              </p>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <Link key={room.id} href={`/kosku/rooms/${room.id}`} className="group">
                  <Card interactive className="overflow-hidden">
                    <RoomImage
                      seed={room.number}
                      src={room.photos[0]?.url}
                      alt={`Kamar ${room.number}`}
                      rounded="rounded-none"
                      className="aspect-[16/10]"
                    />
                    <div className="space-y-3 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[15px] font-semibold text-ink">Kamar {room.number}</p>
                        <RoomTypeBadge type={room.type} />
                      </div>
                      <p className="line-clamp-2 text-[13.5px] leading-relaxed text-ink-muted">
                        {room.description || `Kamar ${room.size} di lantai ${room.floor}.`}
                      </p>
                      <div className="flex items-end justify-between pt-1">
                        <p className="text-[17px] font-bold text-ink">
                          {formatRupiah(room.price)}
                          <span className="text-[12.5px] font-medium text-ink-muted">/bulan</span>
                        </p>
                        {held.has(room.id) ? (
                          <Badge tone="warn">Sedang dihold</Badge>
                        ) : (
                          <span className="text-[13px] font-semibold text-brand transition group-hover:underline">
                            Lihat detail
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Fasilitas */}
      <section id="fasilitas" className="scroll-mt-20 bg-surface">
        <div className="section-gap container space-y-12">
          <SectionHeading
            eyebrow="Fasilitas"
            title="Semua kebutuhan harian sudah tersedia"
            description="Anda tinggal bawa barang pribadi — sisanya sudah kami siapkan."
            align="center"
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FACILITIES.map((facility) => (
              <div key={facility.label} className="flex gap-4 rounded-xl p-2">
                <IconBox tone={facility.tone}>
                  <facility.icon aria-hidden />
                </IconBox>
                <div className="space-y-1 pt-1">
                  <p className="text-[14px] font-semibold text-ink">{facility.label}</p>
                  <p className="text-[12.5px] leading-relaxed text-ink-muted">
                    {facility.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Galeri + lokasi */}
      <section className="section-gap">
        <div className="container grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <SectionHeading eyebrow="Galeri" title="Suasana di dalam kos" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {['g1', 'g2', 'g3', 'g4', 'g5', 'g6'].map((seed, index) => (
                <RoomImage
                  key={seed}
                  seed={seed}
                  alt={`Foto suasana kos ${index + 1}`}
                  rounded="rounded-xl"
                  className={
                    index === 0 ? 'aspect-square sm:col-span-2 sm:aspect-[2/1]' : 'aspect-square'
                  }
                />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <SectionHeading eyebrow="Lokasi" title="Dekat ke mana-mana" />
            <Card className="space-y-5 p-6">
              <div className="flex gap-3">
                <IconBox tone="peach">
                  <MapPin aria-hidden />
                </IconBox>
                <div className="space-y-1">
                  <p className="text-[14.5px] font-semibold text-ink">{settings.kosAddress}</p>
                  <p className="text-[13px] text-ink-muted">{settings.kosCity}</p>
                </div>
              </div>

              <ul className="space-y-3 border-t border-line pt-5 text-[13.5px] text-ink-muted">
                {[
                  ['5 menit', 'ke kampus & sekolah terdekat'],
                  ['3 menit', 'ke minimarket dan warung makan'],
                  ['10 menit', 'ke stasiun dan halte bus'],
                  ['8 menit', 'ke rumah sakit dan apotek'],
                ].map(([time, place]) => (
                  <li key={place} className="flex items-center gap-3">
                    <span className="min-w-[68px] rounded-xs bg-surface-muted px-2 py-1 text-center text-[12px] font-semibold text-ink">
                      {time}
                    </span>
                    <span>{place}</span>
                  </li>
                ))}
              </ul>

              <ExternalButtonLink
                href={settings.kosMapUrl}
                variant="soft"
                className="block w-full"
                target="_blank"
                rel="noreferrer"
              >
                Buka di Google Maps
              </ExternalButtonLink>
            </Card>
          </div>
        </div>
      </section>

      {/* Aturan */}
      <section id="aturan" className="scroll-mt-20 bg-surface">
        <div className="section-gap container grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading
            eyebrow="Aturan kos"
            title="Aturan sederhana agar semua nyaman"
            description="Aturan ini berlaku untuk seluruh penghuni dan tamu yang berkunjung."
          />
          <ul className="grid gap-3 sm:grid-cols-2">
            {rules.map((rule) => (
              <li
                key={rule}
                className="flex gap-3 rounded-xl bg-canvas p-4 text-[13.5px] leading-relaxed text-ink-muted"
              >
                <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section-gap scroll-mt-20">
        <div className="container grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <SectionHeading
            eyebrow="FAQ"
            title="Pertanyaan yang sering ditanyakan"
            description="Belum ketemu jawabannya? Chat pemilik kos, biasanya dibalas cepat."
          />
          <FaqList items={FAQ_ITEMS} />
        </div>
      </section>

      {/* Kontak */}
      <section id="kontak" className="scroll-mt-20 pb-20">
        <div className="container">
          <Card className="overflow-hidden">
            <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div className="space-y-4">
                <h2 className="text-[26px] font-bold leading-tight text-ink sm:text-[30px]">
                  Siap pindah ke {settings.kosName}?
                </h2>
                <p className="max-w-lg text-[15px] leading-relaxed text-ink-muted">
                  Pilih kamar, bayar, dan langsung dapat akses dashboard penghuni. Semua tagihan dan
                  komplain tercatat rapi di satu tempat.
                </p>
                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <ButtonLink href="/kosku/rooms" size="lg" className="w-full sm:w-auto">
                    Booking sekarang
                    <ArrowRight aria-hidden />
                  </ButtonLink>
                  <ExternalButtonLink
                    href={waLink(settings.ownerPhone)}
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Hubungi {settings.ownerName}
                  </ExternalButtonLink>
                </div>
              </div>

              <div className="space-y-4 rounded-xl bg-canvas p-6">
                {[
                  { icon: BedDouble, label: 'Kamar tersedia', value: `${availableRooms} kamar` },
                  { icon: MapPin, label: 'Alamat', value: settings.kosCity },
                  { icon: MessageCircle, label: 'WhatsApp', value: settings.ownerPhone },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <IconBox tone="neutral" className="size-9 bg-surface">
                      <item.icon aria-hidden />
                    </IconBox>
                    <div>
                      <p className="text-[12px] text-ink-muted">{item.label}</p>
                      <p className="text-[13.5px] font-semibold text-ink">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}
