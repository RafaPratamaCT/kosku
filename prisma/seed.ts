import 'dotenv/config';

import { PrismaClient, type Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL belum diisi. Salin .env.example menjadi .env terlebih dahulu.');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/** Angka acak yang selalu sama setiap kali seed dijalankan. */
let seedState = 20260101;
function random(): number {
  seedState = (seedState * 1103515245 + 12345) % 2147483648;
  return seedState / 2147483648;
}
function pick<T>(items: readonly T[]): T {
  return items[Math.floor(random() * items.length)]!;
}
function between(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const day = result.getDate();
  result.setMonth(result.getMonth() + months);
  if (result.getDate() < day) result.setDate(0);
  return result;
}

function periodOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

const NOW = new Date();
const THIS_MONTH = new Date(NOW.getFullYear(), NOW.getMonth(), 1);

const SETTINGS: Record<string, string> = {
  kosName: 'Kos Melati Residence',
  kosTagline: 'Hunian nyaman, tenang, dan dekat ke mana-mana',
  kosAddress: 'Jl. Melati Indah No. 24, Tembalang',
  kosCity: 'Semarang, Jawa Tengah',
  kosMapUrl: 'https://maps.google.com/?q=Tembalang%20Semarang',
  ownerName: 'Ibu Sri Wahyuni',
  ownerPhone: '081234567890',
  ownerEmail: 'admin@kosmelati.id',
  bankName: 'BCA',
  bankAccountNumber: '1234567890',
  bankAccountName: 'Sri Wahyuni',
  defaultDueDay: '0',
  lateFeeType: 'FIXED',
  lateFeeValue: '50000',
  depositAmount: '500000',
  bookingHoldMinutes: '30',
  checkInTime: '14.00',
  checkOutTime: '12.00',
  rules: [
    'Jam malam pukul 23.00, gerbang dikunci otomatis.',
    'Tamu lawan jenis tidak diperbolehkan masuk kamar.',
    'Wajib menjaga kebersihan kamar dan area bersama.',
    'Dilarang merokok di dalam kamar.',
    'Memasak hanya di dapur bersama.',
    'Pembayaran sewa paling lambat tanggal jatuh tempo tiap bulan.',
  ].join('\n'),
};

const STANDARD_FACILITIES = ['Kasur & lemari', 'Meja belajar', 'WiFi', 'Kipas angin'];
const DELUXE_FACILITIES = ['Kasur & lemari', 'Meja belajar', 'WiFi', 'AC', 'Kamar mandi dalam'];
const VIP_FACILITIES = [
  'Kasur & lemari',
  'Meja belajar',
  'WiFi',
  'AC',
  'Kamar mandi dalam',
  'Water heater',
  'TV',
  'Balkon',
];

type RoomSeed = {
  number: string;
  type: 'STANDARD' | 'DELUXE' | 'VIP';
  floor: number;
  price: number;
  size: string;
  description: string;
  facilities: string[];
};

function buildRooms(): RoomSeed[] {
  const rooms: RoomSeed[] = [];

  for (let index = 1; index <= 8; index += 1) {
    rooms.push({
      number: `A${index}`,
      type: 'STANDARD',
      floor: 1,
      price: 750_000 + (index % 3) * 50_000,
      size: '3 x 3 m',
      description:
        'Kamar standar di lantai satu, dekat dapur bersama dan area jemur. Cocok untuk mahasiswa yang cari harga hemat tapi tetap nyaman.',
      facilities: STANDARD_FACILITIES,
    });
  }

  for (let index = 1; index <= 8; index += 1) {
    rooms.push({
      number: `B${index}`,
      type: 'DELUXE',
      floor: 2,
      price: 1_150_000 + (index % 4) * 50_000,
      size: '3 x 4 m',
      description:
        'Kamar deluxe dengan kamar mandi dalam dan AC. Jendela menghadap taman, jadi terang sepanjang hari.',
      facilities: DELUXE_FACILITIES,
    });
  }

  for (let index = 1; index <= 4; index += 1) {
    rooms.push({
      number: `C${index}`,
      type: 'VIP',
      floor: 3,
      price: 1_750_000 + (index % 2) * 100_000,
      size: '4 x 4 m',
      description:
        'Kamar VIP paling luas, lengkap dengan water heater, TV, dan balkon pribadi. Lantai tiga jadi lebih tenang.',
      facilities: VIP_FACILITIES,
    });
  }

  return rooms;
}

const TENANT_PROFILES = [
  { username: 'budi', fullName: 'Budi Santoso', occupation: 'Mahasiswa Teknik' },
  { username: 'sitiaminah', fullName: 'Siti Aminah', occupation: 'Mahasiswa Kedokteran' },
  { username: 'agusprasetyo', fullName: 'Agus Prasetyo', occupation: 'Karyawan swasta' },
  { username: 'dewilestari', fullName: 'Dewi Lestari', occupation: 'Guru' },
  { username: 'ekopurnomo', fullName: 'Eko Purnomo', occupation: 'Barista' },
  { username: 'fitriyani', fullName: 'Fitri Handayani', occupation: 'Mahasiswa Akuntansi' },
  { username: 'gilangramadhan', fullName: 'Gilang Ramadhan', occupation: 'Desainer grafis' },
  { username: 'hanafiroh', fullName: 'Hana Firoh', occupation: 'Perawat' },
  { username: 'indrakusuma', fullName: 'Indra Kusuma', occupation: 'Programmer' },
  { username: 'joko', fullName: 'Joko Widodo Putra', occupation: 'Mahasiswa Hukum' },
  { username: 'kartika', fullName: 'Kartika Sari', occupation: 'Apoteker' },
  { username: 'lutfihakim', fullName: 'Lutfi Hakim', occupation: 'Fotografer' },
] as const;

async function reset(): Promise<void> {
  // Urutan penghapusan mengikuti relasi agar tidak melanggar foreign key.
  await prisma.payment.deleteMany();
  await prisma.billItem.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.complaintReply.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.request.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.tenancy.deleteMany();
  await prisma.roomPhoto.deleteMany();
  await prisma.room.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.fileBlob.deleteMany();
}

async function main(): Promise<void> {
  console.log('→ Membersihkan data lama...');
  await reset();

  console.log('→ Menyimpan pengaturan kos...');
  await prisma.setting.createMany({
    data: Object.entries(SETTINGS).map(([key, value]) => ({ key, value })),
  });

  console.log('→ Membuat akun admin...');
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      fullName: 'Sri Wahyuni',
      phone: '081234567890',
      email: 'admin@kosmelati.id',
      occupation: 'Pemilik kos',
      emergencyName: 'Bambang Wahyudi',
      emergencyPhone: '081298765432',
    },
  });

  console.log('→ Membuat 20 kamar...');
  const roomSeeds = buildRooms();
  const rooms = [];
  for (const seed of roomSeeds) {
    rooms.push(await prisma.room.create({ data: seed }));
  }

  // 12 terisi, 6 tersedia, 1 terkunci, 1 perbaikan.
  const occupiedRooms = rooms.slice(0, 12);
  const availableRooms = rooms.slice(12, 18);
  const lockedRoom = rooms[18]!;
  const maintenanceRoom = rooms[19]!;

  await prisma.room.update({
    where: { id: lockedRoom.id },
    data: {
      status: 'LOCKED',
      lockReason: 'Disimpan untuk keluarga pemilik sampai akhir tahun.',
    },
  });
  await prisma.room.update({
    where: { id: maintenanceRoom.id },
    data: {
      status: 'MAINTENANCE',
      lockReason: 'Perbaikan plafon dan pengecatan ulang, selesai sekitar 2 minggu.',
    },
  });
  await prisma.room.updateMany({
    where: { id: { in: availableRooms.map((room) => room.id) } },
    data: { status: 'AVAILABLE' },
  });

  console.log('→ Membuat penghuni, sewa, tagihan, dan pembayaran...');
  const tenantPassword = await bcrypt.hash('budi123', 10);
  const genericPassword = await bcrypt.hash('penghuni123', 10);
  const paymentMethods = ['QRIS_DEMO', 'TRANSFER', 'CASH'] as const;

  let budiTenancyId = '';
  let budiUserId = '';
  const createdUsers: { id: string; fullName: string }[] = [];

  for (let index = 0; index < occupiedRooms.length; index += 1) {
    const room = occupiedRooms[index]!;
    const profile = TENANT_PROFILES[index]!;
    const isBudi = profile.username === 'budi';

    const user = await prisma.user.create({
      data: {
        username: profile.username,
        passwordHash: isBudi ? tenantPassword : genericPassword,
        role: 'TENANT',
        fullName: profile.fullName,
        phone: `0812${String(34000000 + index * 13571).slice(0, 8)}`,
        email: `${profile.username}@email.com`,
        occupation: profile.occupation,
        emergencyName: `Wali ${profile.fullName.split(' ')[0]}`,
        emergencyPhone: `0857${String(11000000 + index * 24680).slice(0, 8)}`,
      },
    });
    createdUsers.push({ id: user.id, fullName: user.fullName });

    // Budi sengaja dibuat punya tepat 3 tagihan: lunas, telat, dan belum bayar.
    const monthsAgo = isBudi ? 2 : between(1, 11);
    const startDate = addMonths(new Date(THIS_MONTH), -monthsAgo);
    startDate.setDate(between(1, 26));

    const tenancy = await prisma.tenancy.create({
      data: {
        userId: user.id,
        roomId: room.id,
        startDate,
        endDate: addMonths(startDate, 12),
        durationMonths: 12,
        monthlyPrice: room.price,
        depositAmount: 500_000,
        status: 'ACTIVE',
      },
    });

    if (isBudi) {
      budiTenancyId = tenancy.id;
      budiUserId = user.id;
    }

    await prisma.room.update({ where: { id: room.id }, data: { status: 'OCCUPIED' } });

    for (let offset = 0; offset <= monthsAgo; offset += 1) {
      const periodDate = addMonths(startDate, offset);
      const period = periodOf(periodDate);
      const dueDate = new Date(
        periodDate.getFullYear(),
        periodDate.getMonth(),
        startDate.getDate(),
        23,
        59,
        59,
      );
      const isCurrentMonth = period === periodOf(NOW);
      const isPreviousMonth = period === periodOf(addMonths(NOW, -1));

      const items: Prisma.BillItemCreateManyBillInput[] = [
        { label: `Sewa kamar ${room.number}`, amount: room.price, type: 'RENT' },
      ];
      if (offset === 0) {
        items.push({
          label: 'Deposit (dikembalikan saat check-out)',
          amount: 500_000,
          type: 'SERVICE',
        });
      }
      if (!isBudi && offset > 0 && random() > 0.75) {
        items.push({
          label: 'Tambahan listrik AC',
          amount: between(3, 9) * 10_000,
          type: 'ELECTRIC',
        });
      }

      let status: 'PAID' | 'UNPAID' | 'OVERDUE' = 'PAID';
      if (isBudi && isCurrentMonth) status = 'UNPAID';
      else if (isBudi && isPreviousMonth) status = 'OVERDUE';
      else if (!isBudi && isCurrentMonth && random() > 0.65) status = 'UNPAID';

      let lateFee = 0;
      if (status === 'OVERDUE') {
        lateFee = 50_000;
        items.push({ label: 'Denda keterlambatan', amount: lateFee, type: 'FINE' });
      }

      const baseAmount = items
        .filter((item) => item.type !== 'FINE')
        .reduce((sum, item) => sum + item.amount, 0);
      const totalAmount = baseAmount + lateFee;
      const paidAt =
        status === 'PAID' ? new Date(dueDate.getTime() - between(1, 6) * 86_400_000) : null;

      const bill = await prisma.bill.create({
        data: {
          tenancyId: tenancy.id,
          period,
          dueDate,
          baseAmount,
          lateFee,
          totalAmount,
          status,
          paidAt,
          items: { createMany: { data: items } },
        },
      });

      if (status === 'PAID' && paidAt) {
        const method = offset === 0 ? 'QRIS_DEMO' : pick(paymentMethods);
        await prisma.payment.create({
          data: {
            billId: bill.id,
            amount: totalAmount,
            method,
            status: 'VERIFIED',
            qrisRef:
              method === 'QRIS_DEMO' ? `SEED-${room.number}-${period}-${index}${offset}` : null,
            paidAt,
            verifiedAt: paidAt,
            note:
              method === 'CASH'
                ? 'Dibayar tunai ke pemilik kos'
                : method === 'TRANSFER'
                  ? 'Transfer bank, sudah diverifikasi'
                  : 'Pembayaran QRIS demo',
          },
        });
      }
    }
  }

  console.log('→ Membuat komplain contoh...');
  const budiRoom = occupiedRooms[0]!;
  const complaintOne = await prisma.complaint.create({
    data: {
      userId: budiUserId,
      roomId: budiRoom.id,
      category: 'AC',
      priority: 'HIGH',
      title: 'AC kamar tidak dingin sejak kemarin',
      description:
        'Sudah dicoba di suhu 16 derajat tapi angin yang keluar tetap hangat. Ada bunyi berdengung juga dari unit indoor. Mohon dicek ya, Bu.',
      status: 'IN_PROGRESS',
      createdAt: new Date(NOW.getTime() - 3 * 86_400_000),
    },
  });
  await prisma.complaintReply.createMany({
    data: [
      {
        complaintId: complaintOne.id,
        userId: admin.id,
        message: 'Baik Mas Budi, teknisi saya jadwalkan datang besok pagi sekitar jam 9.',
        createdAt: new Date(NOW.getTime() - 2 * 86_400_000),
      },
      {
        complaintId: complaintOne.id,
        userId: budiUserId,
        message: 'Siap Bu, besok pagi saya ada di kamar. Terima kasih.',
        createdAt: new Date(NOW.getTime() - 2 * 86_400_000 + 3_600_000),
      },
    ],
  });

  await prisma.complaint.create({
    data: {
      userId: budiUserId,
      roomId: budiRoom.id,
      category: 'WiFi',
      priority: 'MEDIUM',
      title: 'WiFi lantai 1 sering putus malam hari',
      description:
        'Mulai jam 9 malam koneksi sering terputus sendiri, terutama di kamar dekat tangga. Kalau bisa router-nya ditambah satu di area tengah.',
      status: 'RESOLVED',
      createdAt: new Date(NOW.getTime() - 14 * 86_400_000),
    },
  });

  console.log('→ Membuat pengajuan contoh...');
  await prisma.request.create({
    data: {
      userId: budiUserId,
      type: 'GUEST',
      payload: { guestName: 'Rian Saputra', guestIdNumber: '3374xxxxxxxx0007', guestNights: 2 },
      note: 'Teman kuliah dari luar kota, menginap dua malam saat ada seminar.',
      status: 'PENDING',
      createdAt: new Date(NOW.getTime() - 86_400_000),
    },
  });
  await prisma.request.create({
    data: {
      userId: createdUsers[1]!.id,
      type: 'SERVICE',
      payload: { serviceType: 'Laundry', serviceQty: 5 },
      note: 'Laundry 5 kg, tolong diambil hari Sabtu.',
      status: 'APPROVED',
      adminNote: 'Sudah dicatat, diambil Sabtu pagi.',
      createdAt: new Date(NOW.getTime() - 6 * 86_400_000),
    },
  });

  console.log('→ Membuat pengumuman...');
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Pembayaran sewa bulan ini',
        content:
          'Mohon pembayaran sewa diselesaikan paling lambat tanggal jatuh tempo masing-masing. Pembayaran bisa lewat QRIS di dashboard atau transfer ke rekening BCA 1234567890 a.n. Sri Wahyuni. Jangan lupa unggah bukti transfernya ya.',
        isPinned: true,
        createdAt: new Date(NOW.getTime() - 2 * 86_400_000),
      },
      {
        title: 'Kerja bakti bersama hari Minggu',
        content:
          'Minggu ini kita bersih-bersih area parkir dan dapur bersama mulai pukul 07.00. Setelah selesai disediakan sarapan bersama di teras depan. Ditunggu partisipasinya.',
        isPinned: false,
        createdAt: new Date(NOW.getTime() - 8 * 86_400_000),
      },
      {
        title: 'Perbaikan pipa air lantai 3',
        content:
          'Akan ada perbaikan pipa di lantai 3 pada hari Selasa pukul 09.00 sampai 15.00. Air akan dimatikan sementara di lantai tersebut. Mohon menyiapkan air secukupnya sebelum jam tersebut.',
        isPinned: false,
        createdAt: new Date(NOW.getTime() - 20 * 86_400_000),
      },
    ],
  });

  console.log('→ Membuat catatan pengeluaran...');
  const expenseTemplates = [
    { category: 'Listrik', label: 'Tagihan listrik bulanan', min: 1_800_000, max: 2_600_000 },
    { category: 'Air', label: 'Tagihan PDAM', min: 600_000, max: 950_000 },
    { category: 'Internet', label: 'Langganan internet fiber', min: 700_000, max: 700_000 },
    { category: 'Kebersihan', label: 'Gaji petugas kebersihan', min: 900_000, max: 900_000 },
  ];

  for (let offset = 11; offset >= 0; offset -= 1) {
    const month = addMonths(THIS_MONTH, -offset);
    for (const template of expenseTemplates) {
      await prisma.expense.create({
        data: {
          category: template.category,
          label: template.label,
          amount: between(template.min, template.max),
          date: new Date(month.getFullYear(), month.getMonth(), between(3, 12)),
        },
      });
    }
    if (random() > 0.6) {
      await prisma.expense.create({
        data: {
          category: 'Perawatan',
          label: pick([
            'Servis AC berkala',
            'Perbaikan keran kamar mandi',
            'Ganti lampu koridor',
            'Perbaikan pompa air',
          ]),
          amount: between(250_000, 1_400_000),
          date: new Date(month.getFullYear(), month.getMonth(), between(10, 25)),
        },
      });
    }
  }

  console.log('→ Membuat notifikasi...');
  await prisma.notification.createMany({
    data: [
      {
        userId: budiUserId,
        title: 'Tagihan bulan ini sudah terbit',
        message: 'Segera lakukan pembayaran sebelum tanggal jatuh tempo agar tidak kena denda.',
        link: '/kosku/tenant/bills',
      },
      {
        userId: budiUserId,
        title: 'Komplain AC sedang diproses',
        message: 'Teknisi dijadwalkan datang besok pagi pukul 09.00.',
        link: '/kosku/tenant/complaints',
      },
      {
        userId: admin.id,
        title: 'Ada pengajuan baru',
        message: 'Budi Santoso mengajukan izin tamu menginap selama 2 malam.',
        link: '/kosku/admin/requests',
      },
    ],
  });

  const summary = await Promise.all([
    prisma.room.count(),
    prisma.user.count(),
    prisma.bill.count(),
    prisma.payment.count(),
  ]);

  console.log('\n✅ Seed selesai.');
  console.log(`   Kamar      : ${summary[0]}`);
  console.log(`   Pengguna   : ${summary[1]}`);
  console.log(`   Tagihan    : ${summary[2]}`);
  console.log(`   Pembayaran : ${summary[3]}`);
  console.log('\n   Akun demo');
  console.log('   Admin    → username: admin  password: admin123');
  console.log('   Penghuni → username: budi   password: budi123');
  console.log(`   (penghuni lain memakai password: penghuni123)\n`);
  void budiTenancyId;
}

main()
  .catch((error) => {
    console.error('❌ Seed gagal:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
