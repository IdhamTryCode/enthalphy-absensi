// Shared types untuk attendance — bebas import dari mana saja (client / server).
export type AttendanceStatus = "Masuk" | "Pulang";
export type AttendanceFlag = "Telat" | "Pulang Cepat" | null;
export type NextAction = AttendanceStatus | "Selesai";

export type AttendanceRow = {
  id: string;
  userId: string;
  nama: string;
  email: string;
  divisionName: string | null;
  tanggal: string; // YYYY-MM-DD (WIB)
  jam: string; // HH:mm:ss
  status: AttendanceStatus;
  latitude: number;
  longitude: number;
  alamat: string;
  linkFoto: string;
  flag: AttendanceFlag;
  note: string | null;
  timestampAt: Date;
};

export type TodayState = {
  checkIn: AttendanceRow | null;
  checkOut: AttendanceRow | null;
  nextAction: NextAction;
};
