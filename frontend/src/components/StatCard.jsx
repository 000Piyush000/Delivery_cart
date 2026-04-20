export default function StatCard({ label, value, helper, icon = "ST", trend, tone = "positive" }) {
  return (
    <div className="card stat-card">
      <div className="stat-card-top">
        <span className="stat-icon">{icon}</span>
        {trend ? <span className={`stat-trend stat-trend-${tone}`}>{trend}</span> : null}
      </div>
      <p className="muted">{label}</p>
      <h3>{value}</h3>
      {helper ? <span className="helper">{helper}</span> : null}
    </div>
  );
}
