import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import RegisterForm from "@/components/auth/register-form";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/novels");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <RegisterForm />
    </main>
  );
}
