export default function StatCard({ label, value, helper }) {
  return (
    <div className="card stat-card">
      <p className="muted">{label}</p>
      <h3>{value}</h3>
      {helper ? <span className="helper">{helper}</span> : null}
    </div>
  );
}
