const statusLabelMap = {
  picked: "Picked",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  open: "Open",
  investigate: "Investigating",
  resolve: "Resolved",
  close: "Closed",
  assigned: "Assigned",
  unassigned: "Unassigned",
  available: "Available",
  busy: "Busy",
  pod_verified: "POD Verified",
  pod_investigate: "POD Investigate"
};

export default function StatusBadge({ status }) {
  const normalizedStatus = status || "open";
  return (
    <span className={`status-badge status-${normalizedStatus}`}>
      {statusLabelMap[normalizedStatus] || normalizedStatus}
    </span>
  );
}
