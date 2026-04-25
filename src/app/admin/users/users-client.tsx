"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  UserPlus,
  Search,
  ShieldCheck,
  User as UserIcon,
  Pencil,
  Trash2,
  Loader2,
  MailCheck,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  actionInviteUser,
  actionUpdateUser,
  actionDeleteUser,
  actionResendInvite,
} from "@/lib/admin-actions";
import type { AppProfile, UserRole } from "@/lib/users";
import type { Division } from "@/lib/divisions";

type Props = {
  initialUsers: AppProfile[];
  divisions: Division[];
};

export function UsersClient({ initialUsers, divisions }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AppProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppProfile | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.divisionName ?? "").toLowerCase().includes(q),
    );
  }, [users, search]);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-12 pt-6 lg:px-10 lg:pt-10">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Admin
          </p>
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
            Karyawan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {users.length} karyawan terdaftar.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shadow-sm">
          <UserPlus className="size-4" />
          <span className="hidden sm:inline">Undang</span>
        </Button>
      </header>

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama, email, atau divisi…"
          className="h-10 pl-9"
        />
      </div>

      <ul className="mt-4 grid gap-2 lg:grid-cols-2">
        {filtered.length === 0 ? (
          <li className="col-span-full rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
            {users.length === 0 ? "Belum ada karyawan." : "Tidak ada hasil."}
          </li>
        ) : (
          filtered.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              onEdit={() => setEditTarget(u)}
              onDelete={() => setDeleteTarget(u)}
            />
          ))
        )}
      </ul>

      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        divisions={divisions}
        onCreated={(u) => setUsers((prev) => [...prev, u].sort((a, b) => a.name.localeCompare(b.name)))}
      />

      {editTarget ? (
        <EditUserDialog
          key={editTarget.id}
          user={editTarget}
          divisions={divisions}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) =>
            setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
          }
        />
      ) : null}

      {deleteTarget ? (
        <DeleteUserDialog
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() =>
            setUsers((prev) => prev.filter((x) => x.id !== deleteTarget.id))
          }
        />
      ) : null}
    </main>
  );
}

function UserRow({
  user,
  onEdit,
  onDelete,
}: {
  user: AppProfile;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const initial = (user.name || user.email).slice(0, 2).toUpperCase();
  const [resending, startResend] = useTransition();

  function handleResend() {
    startResend(async () => {
      const result = await actionResendInvite({
        userId: user.id,
        email: user.email,
      });
      if (result.ok) toast.success(result.message ?? "Undangan dikirim ulang.");
      else toast.error(result.error);
    });
  }

  return (
    <li className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm transition hover:shadow-md">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{user.name}</p>
          {user.role === "admin" ? (
            <Badge variant="default" className="h-4 px-1.5 text-[10px]">
              <ShieldCheck className="size-2.5" />
              Admin
            </Badge>
          ) : null}
          {!user.isActive ? (
            <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
              Nonaktif
            </Badge>
          ) : null}
          {user.inviteStatus === "pending" ? (
            <Badge variant="outline" className="h-4 px-1.5 text-[10px] border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <Clock className="size-2.5" />
              Menunggu setup
            </Badge>
          ) : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {user.divisionName ?? "Tanpa divisi"} · {user.email}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        {user.inviteStatus === "pending" ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-primary"
            onClick={handleResend}
            disabled={resending}
            title="Kirim ulang undangan"
          >
            {resending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MailCheck className="size-4" />
            )}
          </Button>
        ) : null}
        <Button variant="ghost" size="icon" className="size-8" onClick={onEdit}>
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
  );
}

function CreateUserDialog({
  open,
  onClose,
  divisions,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  divisions: Division[];
  onCreated: (u: AppProfile) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    email: "",
    name: "",
    role: "user" as UserRole,
    divisionId: "",
  });

  function submit(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    if (!email || !name) {
      toast.error("Email & nama wajib diisi.");
      return;
    }
    startTransition(async () => {
      const result = await actionInviteUser({
        email,
        name,
        role: form.role,
        divisionId: form.divisionId || null,
      });
      if (result.ok) {
        toast.success(result.message ?? "Tersimpan.");
        onCreated({
          id: crypto.randomUUID(), // placeholder, akan ditimpa saat router refresh
          email,
          name,
          role: form.role,
          isActive: true,
          divisionId: form.divisionId || null,
          divisionName:
            divisions.find((d) => d.id === form.divisionId)?.name ?? null,
          inviteStatus: "pending",
          lastSignInAt: null,
          createdAt: new Date(),
        });
        setForm({ email: "", name: "", role: "user", divisionId: "" });
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
          <DialogTitle>Undang Karyawan</DialogTitle>
          <DialogDescription>
            Email berisi link &quot;set password&quot; akan dikirim. Karyawan
            klik link → buat password → bisa login. Mereka juga bisa login
            dengan Google kalau emailnya cocok.
          </DialogDescription>
        </DialogHeader>
        <form action={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nama@enthalphy.com"
              autoFocus
              required
            />
          </div>
          <div>
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input id="name" name="name" type="text" required />
          </div>
          <div>
            <Label htmlFor="role">Peran</Label>
            <select
              id="role"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
              className="mt-1 flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
            >
              <option value="user">Karyawan</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <Label htmlFor="divisionId">Divisi</Label>
            <select
              id="divisionId"
              value={form.divisionId}
              onChange={(e) => setForm((f) => ({ ...f, divisionId: e.target.value }))}
              className="mt-1 flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
            >
              <option value="">Tanpa divisi</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
              Kirim Undangan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  divisions,
  onClose,
  onSaved,
}: {
  user: AppProfile;
  divisions: Division[];
  onClose: () => void;
  onSaved: (u: AppProfile) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: user.name,
    role: user.role,
    divisionId: user.divisionId ?? "",
    isActive: user.isActive,
  });

  function submit() {
    startTransition(async () => {
      const result = await actionUpdateUser({
        id: user.id,
        name: form.name,
        role: form.role,
        divisionId: form.divisionId || null,
        isActive: form.isActive,
      });
      if (result.ok) {
        toast.success(result.message ?? "Tersimpan.");
        onSaved({
          ...user,
          name: form.name,
          role: form.role,
          divisionId: form.divisionId || null,
          divisionName:
            divisions.find((d) => d.id === form.divisionId)?.name ?? null,
          isActive: form.isActive,
        });
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
          <DialogTitle>Edit Karyawan</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Nama Lengkap</Label>
            <Input
              id="edit-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="edit-role">Peran</Label>
            <select
              id="edit-role"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
              className="mt-1 flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
            >
              <option value="user">Karyawan</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <Label htmlFor="edit-division">Divisi</Label>
            <select
              id="edit-division"
              value={form.divisionId}
              onChange={(e) => setForm((f) => ({ ...f, divisionId: e.target.value }))}
              className="mt-1 flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
            >
              <option value="">Tanpa divisi</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="size-4 rounded border"
            />
            Akun aktif (bisa login)
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Batal
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <UserIcon className="size-4" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserDialog({
  user,
  onClose,
  onDeleted,
}: {
  user: AppProfile;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [pending, startTransition] = useTransition();
  function submit() {
    startTransition(async () => {
      const result = await actionDeleteUser(user.id);
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
          <DialogTitle>Hapus karyawan?</DialogTitle>
          <DialogDescription>
            Akun <strong>{user.name}</strong> ({user.email}) akan dihapus
            bersama seluruh data absensinya. Tindakan ini tidak bisa dibatalkan.
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
