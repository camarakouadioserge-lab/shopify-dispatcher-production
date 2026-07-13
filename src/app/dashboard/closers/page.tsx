import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function ClosersPage() {
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          assignments: true,
          assignedOrders: true
        }
      }
    }
  });

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Utilisateurs et closers</h1>
          <p className="muted">Création rapide d’admins, managers et closers.</p>
        </div>
      </div>

      <section className="grid">
        <form action="/api/admin/users" method="post" className="card stack">
          <h2>Nouveau profil</h2>
          <div className="formGrid">
            <label className="field">
              <span>Nom</span>
              <input name="name" required />
            </label>
            <label className="field">
              <span>Email</span>
              <input type="email" name="email" required />
            </label>
            <label className="field">
              <span>Téléphone</span>
              <input name="phone" />
            </label>
            <label className="field">
              <span>Rôle</span>
              <select name="role" defaultValue={UserRole.CLOSER}>
                {Object.values(UserRole).map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Max commandes / jour</span>
              <input type="number" min="1" name="maxDailyOrders" defaultValue="20" required />
            </label>
            <label className="field">
              <span>Mot de passe</span>
              <input type="password" name="password" required />
            </label>
          </div>
          <button className="primaryButton" type="submit">Créer</button>
        </form>
      </section>

      <section className="card">
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Rôle</th>
                <th>Capacité</th>
                <th>Affectations</th>
                <th>Commandes</th>
                <th>Créé le</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                    <div className="muted">{user.email}</div>
                    <div className="muted">{user.phone ?? "N/A"}</div>
                  </td>
                  <td>{user.role}</td>
                  <td>{user.maxDailyOrders}</td>
                  <td>{user._count.assignments}</td>
                  <td>{user._count.assignedOrders}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <form action={`/api/admin/users/${user.id}`} method="post" className="inlineActions">
                      <input type="hidden" name="_method" value="patch" />
                      <input type="hidden" name="active" value={String(!user.active)} />
                      <button className={user.active ? "dangerButton" : "secondaryButton"} type="submit">
                        {user.active ? "Désactiver" : "Réactiver"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
