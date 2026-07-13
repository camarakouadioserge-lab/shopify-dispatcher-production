
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function AuditPage() {
  const auditLogs = await prisma.auditLog.findMany({
    take: 150,
    orderBy: { createdAt: "desc" },
    include: {
      actorUser: true
    }
  });

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Journal d'audit</h1>
          <p className="muted">Historique des actions critiques système et utilisateurs.</p>
        </div>
      </div>

      <section className="card">
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Acteur</th>
                <th>Entité</th>
                <th>Référence</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.createdAt)}</td>
                  <td>{log.action}</td>
                  <td>{log.actorUser?.email ?? log.actorType}</td>
                  <td>{log.entityType}</td>
                  <td>{log.entityId ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
