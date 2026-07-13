type DashboardCardProps = {
  label: string;
  value: string | number;
};

export function DashboardCard({ label, value }: DashboardCardProps) {
  return (
    <div className="metricCard">
      <div className="muted">{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{value}</div>
    </div>
  );
}
