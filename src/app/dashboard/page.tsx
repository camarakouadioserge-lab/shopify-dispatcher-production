import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { getOverviewKpis, getRevenueByCloser, getRevenueByCountry, getRevenueByProduct } from "@/lib/kpis";
import { DashboardCard } from "@/components/dashboard-card";

export default async function DashboardPage() {
  const [overview, byCountry, byCloser, byProduct, latestOrders] = await Promise.all([
    getOverviewKpis(),
    getRevenueByCountry(),
    getRevenueByCloser(),
    getRevenueByProduct(),
    prisma.order.findMany({
      include: { assignedCloser: true, store: true },
      orderBy: { createdAt: "desc" },
      take: 12
    })
  ]);

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Vue direction</h1>
          <p className="muted">Suivi global des ventes, livraisons, dépenses et dispatch.</p>
        </div>
        <div className="badge">Temps réel</div>
      </div>

      <section className="grid">
        <DashboardCard label="Commandes" value={overview.totalOrders} />
        <DashboardCard label="Livrées" value={overview.deliveredOrders} />
        <DashboardCard label="Annulées" value={overview.cancelledOrders} />
        <DashboardCard label="CA total" value={formatMoney(overview.revenue)} />
        <DashboardCard label="Dépenses" value={formatMoney(overview.totalExpenses)} />
        <DashboardCard label="Marge" value={formatMoney(overview.margin)} />
      </section>

      <section className="grid">
        <div className="card">
          <h2>CA par pays</h2>
          <div className="stack">
            {byCountry.map((item) => (
              <div key={item.country} className="inlineActions">
                <strong>{item.country}</strong>
                <span className="muted">{formatMoney(item.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>CA par closer</h2>
          <div className="stack">
            {byCloser.map((item) => (
              <div key={item.closerId ?? "na"} className="inlineActions">
                <strong>{item.closerName}</strong>
                <span className="muted">{formatMoney(item.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Top produits</h2>
          <div className="stack">
            {byProduct.map((item) => (
              <div key={item.productTitle} className="inlineActions">
                <strong>{item.productTitle}</strong>
                <span className="muted">{formatMoney(item.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Dernières commandes</h2>
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Commande</th>
                <th>Boutique</th>
                <th>Client</th>
                <th>Pays</th>
                <th>Montant</th>
                <th>Closer</th>
                <th>Livraison</th>
              </tr>
            </thead>
            <tbody>
              {latestOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td>{order.store.name}</td>
                  <td>{order.customerName}</td>
                  <td>{order.country ?? "N/A"}</td>
                  <td>{formatMoney(Number(order.totalAmount), order.currency)}</td>
                  <td>{order.assignedCloser?.name ?? "Non assigné"}</td>
                  <td>{order.deliveryStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
