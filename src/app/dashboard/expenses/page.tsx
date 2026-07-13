import { ExpenseCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";

export default async function ExpensesPage() {
  const [expenses, stores] = await Promise.all([
    prisma.expense.findMany({
      include: { store: true },
      orderBy: { expenseDate: "desc" }
    }),
    prisma.store.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Dépenses</h1>
          <p className="muted">Ajoute les coûts et calcule la marge plus proprement.</p>
        </div>
      </div>

      <section className="card stack">
        <h2>Nouvelle dépense</h2>
        <form action="/api/expenses" method="post" className="formGrid">
          <label className="field">
            <span>Boutique</span>
            <select name="storeId">
              <option value="">Aucune</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Pays</span>
            <input name="country" placeholder="CI" />
          </label>
          <label className="field">
            <span>Catégorie</span>
            <select name="category" defaultValue={ExpenseCategory.ADS}>
              {Object.values(ExpenseCategory).map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Libellé</span>
            <input name="label" required />
          </label>
          <label className="field">
            <span>Montant</span>
            <input name="amount" type="number" step="0.01" required />
          </label>
          <label className="field">
            <span>Date</span>
            <input name="expenseDate" type="date" required />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            <span>Notes</span>
            <textarea name="notes" rows={3} />
          </label>
          <button className="primaryButton" type="submit">Ajouter</button>
        </form>
      </section>

      <section className="card">
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Catégorie</th>
                <th>Libellé</th>
                <th>Boutique</th>
                <th>Pays</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{formatDate(expense.expenseDate)}</td>
                  <td>{expense.category}</td>
                  <td>{expense.label}</td>
                  <td>{expense.store?.name ?? "-"}</td>
                  <td>{expense.country ?? "-"}</td>
                  <td>{formatMoney(Number(expense.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
