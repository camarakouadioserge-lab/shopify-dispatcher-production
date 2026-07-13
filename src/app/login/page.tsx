import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(user.role === "CLOSER" ? "/workspace" : "/dashboard");
  }

  return (
    <main className="loginPage">
      <div className="loginCard">
        <div>
          <h1>Connexion</h1>
          <p className="muted">Utilise les identifiants du seed pour démarrer.</p>
        </div>

        <form action="/api/auth/login" method="post" className="stack">
          <label className="field">
            <span>Email</span>
            <input type="email" name="email" placeholder="admin@example.com" required />
          </label>

          <label className="field">
            <span>Mot de passe</span>
            <input type="password" name="password" placeholder="••••••••" required />
          </label>

          <button className="primaryButton" type="submit">
            Se connecter
          </button>
        </form>

        <div className="card">
          <strong>Comptes de démo</strong>
          <div className="muted">Admin: admin@example.com / Admin123!</div>
          <div className="muted">Closer: closer1@example.com / Closer123!</div>
        </div>
      </div>
    </main>
  );
}
