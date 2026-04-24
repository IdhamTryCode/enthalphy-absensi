import Image from "next/image";
import { signIn, auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-6 p-8">
          <Image
            src="/logo.png"
            alt="Enthalphy"
            width={180}
            height={60}
            priority
          />
          <div className="text-center">
            <h1 className="text-xl font-semibold">Absensi Enthalphy</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Masuk dengan akun Google perusahaan Anda
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
            className="w-full"
          >
            <Button type="submit" className="w-full" size="lg">
              Login dengan Google
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
