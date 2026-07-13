import { prisma } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth";

export default async function WorkspacePage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const orders = await prisma.order.findMany({
    where: {
      assignedCloserId: user.id
    },
    include: {
      store: true,
      orderItems: true
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Mes commandes</h1>
          <p className="muted">Espace closer pour traiter, appeler et confirmer.</p>
        </div>
        <div className="badge">{orders.length} commandes</div>
      </div>

      <section className="card">
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Commande</th>
                <th>Client</th>
                <th>Produits</th>
                <th>Statut</th>
                <th>Appel</th>
                <th>Confirmation</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.orderNumber}</strong>
                    <div className="muted">{order.store.name}</div>
                    <div className="muted">{formatDate(order.createdAt)}</div>
                  </td>
                  <td>
                    <div>{order.customerName}</div>
                    <div className="muted">{order.phone ?? "Pas de téléphone"}</div>
                    <div>{formatMoney(Number(order.totalAmount), order.currency)}</div>
                  </td>
                  <td>
                    {order.orderItems.map((item) => (
                      <div key={item.id}>{item.title} × {item.quantity}</div>
                    ))}
                  </td>
                  <td>{order.deliveryStatus}</td>
                  <td>
                    <form action="/api/calls/start" method="post">
                      <input type="hidden" name="orderId" value={order.id} />
                      <button className="secondaryButton" type="submit" disabled={!order.phone}>Appeler</button>
                    </form>
                  </td>
                  <td>
                    <form action={`/api/orders/${order.id}`} method="post" className="inlineActions">
                      <input type="hidden" name="_method" value="patch" />
                      <input type="hidden" name="deliveryStatus" value="CONFIRMED" />
                      <button className="primaryButton" type="submit">Confirmer</button>
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
