import { redirect } from "next/navigation";
import { loginWithPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const user = await loginWithPassword(email, password);

  if (!user) {
    redirect("/login");
  }

  redirect(user.role === "CLOSER" ? "/workspace" : "/dashboard");
}
