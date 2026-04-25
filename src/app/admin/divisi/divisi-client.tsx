"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Building2, Plus, Pencil, Trash2, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  actionCreateDivision,
  actionRenameDivision,
  actionDeleteDivision,
} from "@/lib/admin-actions";
import type { Division } from "@/lib/divisions";

export function DivisiClient({ initial }: { initial: Division[] }) {
  const [divisions, setDivisions] = useState(initial);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Division | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Division | null>(null);

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-12 pt-6 lg:px-10 lg:pt-10">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Admin
          </p>
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
            Divisi
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {divisions.length} divisi terdaftar.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shadow-sm">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Tambah</span>
        </Button>
      </header>

      <ul className="mt-6 grid gap-2 sm:grid-cols-2">
        {divisions.length === 0 ? (
          <li className="col-span-full rounded-2xl border bg-card p-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Building2 className="size-5" />
            </div>
            <p className="mt-3 font-medium">Belum ada divisi</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Buat divisi pertama untuk mengelompokkan karyawan.
            </p>
          </li>
        ) : (
          divisions.map((d) => (
            <li
              key={d.id}
              className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm transition hover:shadow-md"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{d.name}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="size-3" />
                  {d.memberCount} karyawan
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setEditTarget(d)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget(d)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>

      <CreateDivisi
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(name) => {
          setDivisions((prev) =>
            [
              ...prev,
              { id: crypto.randomUUID(), name, memberCount: 0 },
            ].sort((a, b) => a.name.localeCompare(b.name)),
          );
        }}
      />

      {editTarget ? (
        <EditDivisi
          key={editTarget.id}
          division={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(name) => {
            setDivisions((prev) =>
              prev.map((x) => (x.id === editTarget.id ? { ...x, name } : x)),
            );
          }}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteDivisi
          division={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() =>
            setDivisions((prev) => prev.filter((x) => x.id !== deleteTarget.id))
          }
        />
      ) : null}
    </main>
  );
}

function CreateDivisi({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await actionCreateDivision(name.trim());
      if (result.ok) {
        toast.success(result.message ?? "Divisi dibuat.");
        onCreated(name.trim());
        setName("");
        onClose();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Divisi</DialogTitle>
          <DialogDescription>
            Divisi membantu mengelompokkan karyawan untuk filter rekap.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label htmlFor="div-name">Nama Divisi</Label>
          <Input
            id="div-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="mis. Engineering"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Batal
          </Button>
          <Button onClick={submit} disabled={pending || !name.trim()}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Tambah
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDivisi({
  division,
  onClose,
  onSaved,
}: {
  division: Division;
  onClose: () => void;
  onSaved: (name: string) => void;
}) {
  const [name, setName] = useState(division.name);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await actionRenameDivision({ id: division.id, name: name.trim() });
      if (result.ok) {
        toast.success(result.message ?? "Tersimpan.");
        onSaved(name.trim());
        onClose();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah Nama Divisi</DialogTitle>
        </DialogHeader>
        <div>
          <Label htmlFor="edit-div-name">Nama Divisi</Label>
          <Input
            id="edit-div-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Batal
          </Button>
          <Button onClick={submit} disabled={pending || !name.trim()}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDivisi({
  division,
  onClose,
  onDeleted,
}: {
  division: Division;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [pending, startTransition] = useTransition();
  function submit() {
    startTransition(async () => {
      const result = await actionDeleteDivision(division.id);
      if (result.ok) {
        toast.success(result.message ?? "Dihapus.");
        onDeleted();
        onClose();
      } else {
        toast.error(result.error);
      }
    });
  }
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus divisi?</DialogTitle>
          <DialogDescription>
            Divisi <strong>{division.name}</strong> akan dihapus. Karyawan
            yang ada di dalamnya tidak akan dihapus, tapi divisinya jadi kosong.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Batal
          </Button>
          <Button variant="destructive" onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
