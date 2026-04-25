"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actionEditAttendance } from "@/lib/admin-actions";

type FlagValue = "Telat" | "Pulang Cepat" | "none";

export function KoreksiForm({
  attendanceId,
  initial,
}: {
  attendanceId: string;
  initial: {
    jam: string;
    note: string;
    flag: FlagValue;
    alamat: string;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(initial);
  const [reason, setReason] = useState("");

  function submit() {
    if (reason.trim().length < 3) {
      toast.error("Alasan koreksi minimal 3 karakter.");
      return;
    }
    startTransition(async () => {
      const result = await actionEditAttendance({
        attendanceId,
        jam: form.jam,
        note: form.note,
        flag: form.flag,
        alamat: form.alamat,
        reason: reason.trim(),
      });
      if (result.ok) {
        toast.success(result.message ?? "Tersimpan.");
        setReason("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <section className="mt-6 rounded-2xl border bg-card p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Edit
      </p>
      <div className="mt-3 space-y-4">
        <div>
          <Label htmlFor="k-jam">Jam (HH:MM:SS)</Label>
          <Input
            id="k-jam"
            value={form.jam}
            onChange={(e) => setForm((f) => ({ ...f, jam: e.target.value }))}
            placeholder="08:00:00"
          />
        </div>
        <div>
          <Label htmlFor="k-flag">Flag</Label>
          <select
            id="k-flag"
            value={form.flag}
            onChange={(e) => setForm((f) => ({ ...f, flag: e.target.value as FlagValue }))}
            className="mt-1 flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
          >
            <option value="none">Tidak ada</option>
            <option value="Telat">Telat</option>
            <option value="Pulang Cepat">Pulang Cepat</option>
          </select>
        </div>
        <div>
          <Label htmlFor="k-alamat">Alamat</Label>
          <Input
            id="k-alamat"
            value={form.alamat}
            onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="k-note">Catatan</Label>
          <textarea
            id="k-note"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value.slice(0, 500) }))}
            rows={3}
            className="mt-1 w-full resize-none rounded-md border bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="rounded-lg border border-amber-300/60 bg-amber-50 p-3 dark:border-amber-900/60 dark:bg-amber-950/20">
          <Label htmlFor="k-reason" className="text-xs">
            Alasan koreksi (wajib, akan tersimpan di audit log)
          </Label>
          <Input
            id="k-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="mis. Karyawan lupa absen pulang"
            className="mt-1"
          />
        </div>
        <Button onClick={submit} disabled={pending} className="w-full">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Simpan Koreksi
        </Button>
      </div>
    </section>
  );
}
