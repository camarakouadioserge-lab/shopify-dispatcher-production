import { prisma } from "@/lib/db";

export default async function AssignmentsPage() {
  const [products, closers, assignments] = await Promise.all([
    prisma.product.findMany({ include: { store: true }, orderBy: { title: "asc" } }),
    prisma.user.findMany({ where: { role: "CLOSER" }, orderBy: { name: "asc" } }),
    prisma.closerProductAssignment.findMany({
      include: { closer: true, product: true },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }]
    })
  ]);

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Règles d’affectation</h1>
          <p className="muted">Un produit peut être lié à plusieurs closers avec priorité et pays.</p>
        </div>
      </div>

      <section className="card stack">
        <h2>Nouvelle règle</h2>
        <form action="/api/admin/assignments" method="post" className="formGrid">
          <label className="field">
            <span>Closer</span>
            <select name="closerId" required>
              <option value="">Choisir</option>
              {closers.map((closer) => (
                <option key={closer.id} value={closer.id}>{closer.name}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Produit</span>
            <select name="productId" required>
              <option value="">Choisir</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.title} · {product.store.name}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Pays</span>
            <input name="countryCode" placeholder="CI, SN, FR..." />
          </label>

          <label className="field">
            <span>Priorité</span>
            <input type="number" name="priority" min="1" defaultValue="100" required />
          </label>

          <div className="inlineActions" style={{ alignItems: "end" }}>
            <button className="primaryButton" type="submit">Créer la règle</button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Closer</th>
                <th>Produit</th>
                <th>Pays</th>
                <th>Priorité</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td>{assignment.closer.name}</td>
                  <td>{assignment.product.title}</td>
                  <td>{assignment.countryCode ?? "Tous"}</td>
                  <td>{assignment.priority}</td>
                  <td>
                    <form action={`/api/admin/assignments/${assignment.id}`} method="post">
                      <input type="hidden" name="_method" value="delete" />
                      <button className="dangerButton" type="submit">Supprimer</button>
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
