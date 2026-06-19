import Link from "next/link";

export default function ServiceNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h2 className="text-lg font-semibold text-foreground">Service tidak ditemukan</h2>
      <p className="mt-1 text-sm text-muted-foreground">Service order yang kamu cari tidak ada.</p>
      <Link
        href="/services"
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Kembali ke daftar
      </Link>
    </div>
  );
}
