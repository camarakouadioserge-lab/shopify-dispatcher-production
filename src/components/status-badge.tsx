type StatusBadgeProps = {
  value: string;
};

export function StatusBadge({ value }: StatusBadgeProps) {
  return <span className="badge">{value.replaceAll("_", " ")}</span>;
}
