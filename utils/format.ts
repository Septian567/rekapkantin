export const formatRupiah = (angka: number) =>
new Intl.NumberFormat("id-ID", {
style: "currency",
currency: "IDR",
maximumFractionDigits: 0,
}).format(angka);

export const formatTanggal = (tanggal: string) => {
if (!tanggal) return "-";

const [tahun, bulan, hari] = tanggal.split("-").map(Number);
const tanggalObj = new Date(tahun, bulan - 1, hari);

return tanggalObj.toLocaleDateString("id-ID", {
day: "numeric",
month: "long",
year: "numeric",
});
};
