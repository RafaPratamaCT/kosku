import { Document, Page, StyleSheet, Text, View, type Styles } from '@react-pdf/renderer';

import { formatDate, formatPeriod, formatRupiah } from '@/lib/format';
import type { SettingsMap } from '@/lib/settings';

const INK = '#16202E';
const MUTED = '#6B7480';
const LINE = '#E6E6E1';
const BRAND = '#12796B';

const styles: Styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontSize: 10,
    color: INK,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    paddingBottom: 18,
    marginBottom: 22,
  },
  brandName: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: INK },
  brandMeta: { fontSize: 9, color: MUTED, marginTop: 3 },
  docTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: BRAND, textAlign: 'right' },
  docMeta: { fontSize: 9, color: MUTED, textAlign: 'right', marginTop: 3 },
  sectionRow: { flexDirection: 'row', gap: 28, marginBottom: 22 },
  sectionCol: { flex: 1 },
  label: {
    fontSize: 8,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 5,
    fontFamily: 'Helvetica-Bold',
  },
  value: { fontSize: 10, color: INK },
  valueStrong: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: INK },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F2',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  tableHeadText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: INK,
  },
  totalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginRight: 16 },
  totalValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: BRAND },
  note: {
    marginTop: 26,
    padding: 12,
    backgroundColor: '#F7F7F4',
    borderRadius: 6,
    fontSize: 9,
    color: MUTED,
  },
  footer: {
    position: 'absolute',
    bottom: 26,
    left: 44,
    right: 44,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: MUTED,
  },
  paragraph: { marginBottom: 9, textAlign: 'justify' },
  articleTitle: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', marginTop: 12, marginBottom: 5 },
  signRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40 },
  signBox: { width: 180, alignItems: 'center' },
  signLine: { borderTopWidth: 1, borderTopColor: INK, width: '100%', marginTop: 54, paddingTop: 5 },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 10,
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
  },
});

function Header({
  settings,
  title,
  meta,
}: {
  settings: SettingsMap;
  title: string;
  meta: string[];
}) {
  return (
    <View style={styles.headerRow}>
      <View>
        <Text style={styles.brandName}>{settings.kosName}</Text>
        <Text style={styles.brandMeta}>{settings.kosAddress}</Text>
        <Text style={styles.brandMeta}>{settings.kosCity}</Text>
        <Text style={styles.brandMeta}>
          {settings.ownerPhone} · {settings.ownerEmail}
        </Text>
      </View>
      <View>
        <Text style={styles.docTitle}>{title}</Text>
        {meta.map((line) => (
          <Text key={line} style={styles.docMeta}>
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Footer({ text }: { text: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>{text}</Text>
      <Text render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`} />
    </View>
  );
}

export type InvoiceData = {
  billId: string;
  period: string;
  dueDate: Date;
  status: string;
  paidAt: Date | null;
  items: { label: string; amount: number }[];
  totalAmount: number;
  tenantName: string;
  tenantPhone: string;
  roomNumber: string;
  createdAt: Date;
};

export function InvoiceDocument({ data, settings }: { data: InvoiceData; settings: SettingsMap }) {
  const paid = data.status === 'PAID';

  return (
    <Document title={`Invoice ${data.period} - Kamar ${data.roomNumber}`} author={settings.kosName}>
      <Page size="A4" style={styles.page}>
        <Header
          settings={settings}
          title="INVOICE"
          meta={[
            `No. ${data.billId.slice(-10).toUpperCase()}`,
            `Periode ${formatPeriod(data.period)}`,
            `Terbit ${formatDate(data.createdAt)}`,
          ]}
        />

        <View style={styles.sectionRow}>
          <View style={styles.sectionCol}>
            <Text style={styles.label}>Ditagihkan kepada</Text>
            <Text style={styles.valueStrong}>{data.tenantName}</Text>
            <Text style={styles.value}>Kamar {data.roomNumber}</Text>
            <Text style={styles.value}>{data.tenantPhone}</Text>
          </View>
          <View style={styles.sectionCol}>
            <Text style={styles.label}>Jatuh tempo</Text>
            <Text style={styles.valueStrong}>{formatDate(data.dueDate)}</Text>
            <Text style={[styles.label, { marginTop: 12 }]}>Status</Text>
            <Text
              style={[
                styles.badge,
                paid
                  ? { backgroundColor: '#E3F2EC', color: '#12796B' }
                  : { backgroundColor: '#FDEEEC', color: '#B14A43' },
              ]}
            >
              {paid ? 'LUNAS' : 'BELUM DIBAYAR'}
            </Text>
          </View>
        </View>

        <View style={styles.tableHead}>
          <Text style={[styles.tableHeadText, { flex: 1 }]}>Keterangan</Text>
          <Text style={[styles.tableHeadText, { width: 110, textAlign: 'right' }]}>Jumlah</Text>
        </View>

        {data.items.map((item, index) => (
          <View key={`${item.label}-${index}`} style={styles.tableRow}>
            <Text style={{ flex: 1 }}>{item.label}</Text>
            <Text style={{ width: 110, textAlign: 'right' }}>{formatRupiah(item.amount)}</Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total tagihan</Text>
          <Text style={styles.totalValue}>{formatRupiah(data.totalAmount)}</Text>
        </View>

        <View style={styles.note}>
          <Text>
            Pembayaran dapat dilakukan melalui QRIS pada dashboard penghuni, atau transfer ke
            rekening {settings.bankName} {settings.bankAccountNumber} atas nama{' '}
            {settings.bankAccountName}. Untuk pembayaran transfer, mohon unggah bukti pembayaran
            pada halaman detail tagihan agar dapat diverifikasi.
          </Text>
          {paid && data.paidAt ? (
            <Text style={{ marginTop: 6 }}>
              Tagihan ini telah dibayar pada {formatDate(data.paidAt)}. Terima kasih.
            </Text>
          ) : null}
        </View>

        <Footer text={`${settings.kosName} · Dokumen dibuat otomatis oleh sistem KosKu`} />
      </Page>
    </Document>
  );
}

export type ReceiptData = {
  paymentId: string;
  amount: number;
  method: string;
  paidAt: Date;
  note: string | null;
  period: string | null;
  tenantName: string;
  roomNumber: string;
};

export function ReceiptDocument({ data, settings }: { data: ReceiptData; settings: SettingsMap }) {
  return (
    <Document title={`Kwitansi ${data.paymentId.slice(-8)}`} author={settings.kosName}>
      <Page size="A4" style={styles.page}>
        <Header
          settings={settings}
          title="KWITANSI"
          meta={[
            `No. ${data.paymentId.slice(-10).toUpperCase()}`,
            `Tanggal ${formatDate(data.paidAt)}`,
          ]}
        />

        <View style={styles.sectionRow}>
          <View style={styles.sectionCol}>
            <Text style={styles.label}>Telah diterima dari</Text>
            <Text style={styles.valueStrong}>{data.tenantName}</Text>
            <Text style={styles.value}>Kamar {data.roomNumber}</Text>
          </View>
          <View style={styles.sectionCol}>
            <Text style={styles.label}>Metode pembayaran</Text>
            <Text style={styles.valueStrong}>{data.method}</Text>
            {data.period ? (
              <>
                <Text style={[styles.label, { marginTop: 12 }]}>Untuk periode</Text>
                <Text style={styles.value}>{formatPeriod(data.period)}</Text>
              </>
            ) : null}
          </View>
        </View>

        <View
          style={{
            backgroundColor: '#F2F8F6',
            borderRadius: 8,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <Text style={styles.label}>Jumlah diterima</Text>
          <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: BRAND }}>
            {formatRupiah(data.amount)}
          </Text>
        </View>

        {data.note ? (
          <View>
            <Text style={styles.label}>Keterangan</Text>
            <Text style={styles.value}>{data.note}</Text>
          </View>
        ) : null}

        <View style={styles.signRow}>
          <View style={styles.signBox}>
            <Text style={styles.value}>Penyetor</Text>
            <Text style={styles.signLine}>{data.tenantName}</Text>
          </View>
          <View style={styles.signBox}>
            <Text style={styles.value}>Penerima</Text>
            <Text style={styles.signLine}>{settings.ownerName}</Text>
          </View>
        </View>

        <Footer text={`${settings.kosName} · Kwitansi sah tanpa tanda tangan basah`} />
      </Page>
    </Document>
  );
}

export type ContractData = {
  tenancyId: string;
  tenantName: string;
  tenantPhone: string;
  tenantIdNumber: string | null;
  roomNumber: string;
  roomType: string;
  roomSize: string;
  monthlyPrice: number;
  depositAmount: number;
  startDate: Date;
  endDate: Date;
  durationMonths: number;
  rules: string[];
};

export function ContractDocument({
  data,
  settings,
}: {
  data: ContractData;
  settings: SettingsMap;
}) {
  return (
    <Document title={`Kontrak Sewa Kamar ${data.roomNumber}`} author={settings.kosName}>
      <Page size="A4" style={styles.page}>
        <Header
          settings={settings}
          title="KONTRAK SEWA"
          meta={[`No. ${data.tenancyId.slice(-10).toUpperCase()}`, `Kamar ${data.roomNumber}`]}
        />

        <Text style={styles.paragraph}>
          Perjanjian sewa kamar kos ini dibuat dan disepakati pada tanggal{' '}
          {formatDate(data.startDate)} antara kedua pihak di bawah ini:
        </Text>

        <View style={styles.sectionRow}>
          <View style={styles.sectionCol}>
            <Text style={styles.label}>Pihak pertama (pemilik)</Text>
            <Text style={styles.valueStrong}>{settings.ownerName}</Text>
            <Text style={styles.value}>{settings.kosAddress}</Text>
            <Text style={styles.value}>{settings.ownerPhone}</Text>
          </View>
          <View style={styles.sectionCol}>
            <Text style={styles.label}>Pihak kedua (penyewa)</Text>
            <Text style={styles.valueStrong}>{data.tenantName}</Text>
            <Text style={styles.value}>{data.tenantPhone}</Text>
            {data.tenantIdNumber ? <Text style={styles.value}>{data.tenantIdNumber}</Text> : null}
          </View>
        </View>

        <Text style={styles.articleTitle}>Pasal 1 — Objek sewa</Text>
        <Text style={styles.paragraph}>
          Pihak pertama menyewakan kepada pihak kedua satu kamar bernomor {data.roomNumber} tipe{' '}
          {data.roomType} berukuran {data.roomSize} yang berada di {settings.kosName},{' '}
          {settings.kosAddress}, {settings.kosCity}.
        </Text>

        <Text style={styles.articleTitle}>Pasal 2 — Jangka waktu</Text>
        <Text style={styles.paragraph}>
          Sewa berlaku selama {data.durationMonths} bulan, terhitung sejak{' '}
          {formatDate(data.startDate)} sampai dengan {formatDate(data.endDate)}. Perpanjangan dapat
          diajukan melalui menu Pengajuan pada dashboard penghuni paling lambat tujuh hari sebelum
          masa sewa berakhir.
        </Text>

        <Text style={styles.articleTitle}>Pasal 3 — Biaya sewa dan deposit</Text>
        <Text style={styles.paragraph}>
          Biaya sewa ditetapkan sebesar {formatRupiah(data.monthlyPrice)} per bulan, sudah termasuk
          listrik, air, dan internet dengan pemakaian wajar. Pihak kedua menyerahkan deposit sebesar{' '}
          {formatRupiah(data.depositAmount)} yang dikembalikan penuh pada saat check-out apabila
          tidak terdapat kerusakan atau tunggakan.
        </Text>

        <Text style={styles.articleTitle}>Pasal 4 — Pembayaran</Text>
        <Text style={styles.paragraph}>
          Pembayaran dilakukan setiap bulan paling lambat pada tanggal jatuh tempo yang tercantum
          pada tagihan. Keterlambatan pembayaran dikenakan denda sesuai ketentuan yang berlaku dan
          diinformasikan melalui dashboard penghuni.
        </Text>

        <Text style={styles.articleTitle}>Pasal 5 — Tata tertib</Text>
        {data.rules.map((rule, index) => (
          <Text key={rule} style={{ marginBottom: 3 }}>
            {index + 1}. {rule}
          </Text>
        ))}

        <Text style={styles.articleTitle}>Pasal 6 — Pengakhiran</Text>
        <Text style={styles.paragraph}>
          Pihak kedua wajib memberitahukan rencana check-out paling lambat tiga puluh hari
          sebelumnya melalui menu Pengajuan. Pihak pertama berhak mengakhiri perjanjian apabila
          pihak kedua melanggar tata tertib atau menunggak pembayaran lebih dari tiga puluh hari.
        </Text>

        <View style={styles.signRow}>
          <View style={styles.signBox}>
            <Text style={styles.value}>Pihak pertama</Text>
            <Text style={styles.signLine}>{settings.ownerName}</Text>
          </View>
          <View style={styles.signBox}>
            <Text style={styles.value}>Pihak kedua</Text>
            <Text style={styles.signLine}>{data.tenantName}</Text>
          </View>
        </View>

        <Footer text={`${settings.kosName} · Kontrak sewa kamar ${data.roomNumber}`} />
      </Page>
    </Document>
  );
}
