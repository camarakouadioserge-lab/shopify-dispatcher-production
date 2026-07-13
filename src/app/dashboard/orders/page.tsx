import { DeliveryStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export default async function OrdersPage() {
  const [orders, closers] = await Promise.all([
    prisma.order.findMany({
      include: { assignedCloser: true, store: true, orderItems: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.user.findMany({
      where: { role: "CLOSER", active: true },
      orderBy: { name: "asc" }
    })
  ]);

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Commandes</h1>
          <p className="muted">Mise à jour rapide des statuts, dispatch manuel et appel client.</p>
        </div>
      </div>

      <section className="card">
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Commande</th>
                <th>Client</th>
                <th>Produits</th>
                <th>Payment</th>
                <th>Delivery</th>
                <th>Closer</th>
                <th>Appel</th>
                <th>Maj</th>
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
                    <div className="muted">{order.country ?? "N/A"}</div>
                    <div>{formatMoney(Number(order.totalAmount), order.currency)}</div>
                  </td>
                  <td>
                    {order.orderItems.map((item) => (
                      <div key={item.id}>{item.title} × {item.quantity}</div>
                    ))}
                  </td>
                  <td><StatusBadge value={order.paymentStatus} /></td>
                  <td><StatusBadge value={order.deliveryStatus} /></td>
                  <td>{order.assignedCloser?.name ?? "Non assigné"}</td>
                  <td>
                    <form action="/api/calls/start" method="post" className="inlineActions">
                      <input type="hidden" name="orderId" value={order.id} />
                      <button className="secondaryButton" type="submit" disabled={!order.phone}>
                        Appeler
                      </button>
                    </form>
                  </td>
                  <td>
                    <form action={`/api/orders/${order.id}`} method="post" className="stack">
                      <input type="hidden" name="_method" value="patch" />
                      <label className="field">
                        <span>Closer</span>
                        <select name="assignedCloserId" defaultValue={order.assignedCloserId ?? ""}>
                          <option value="">Non assigné</option>
                          {closers.map((closer) => (
                            <option key={closer.id} value={closer.id}>{closer.name}</option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Payment</span>
                        <select name="paymentStatus" defaultValue={order.paymentStatus}>
                          {Object.values(PaymentStatus).map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Delivery</span>
                        <select name="deliveryStatus" defaultValue={order.deliveryStatus}>
                          {Object.values(DeliveryStatus).map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </label>
                      <button className="primaryButton" type="submit">Enregistrer</button>
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
