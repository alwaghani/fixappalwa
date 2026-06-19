import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function GlobalNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-extrabold text-foreground">404</h1>
        <p className="text-muted-foreground">Halaman tidak ditemukan</p>
        <Button variant="default" render={<Link href="/dashboard" />}>
          Kembali ke Dashboard
        </Button>
      </div>
    </div>
  );
}
