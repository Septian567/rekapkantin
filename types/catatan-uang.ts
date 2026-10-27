export type CatatanUang = {
id: string;
tanggal: string;
uangMasuk: number;
uangKeluar: number;
keterangan: string;
};

export type CatatanUangDB = {
id: string;
tanggal: string;
uang_masuk: number | string;
uang_keluar: number | string;
keterangan: string | null;
};

export type RingkasanHarian = {
tanggal: string;
uangMasuk: number;
uangKeluar: number;
saldo: number;
jumlahTransaksi: number;
};
