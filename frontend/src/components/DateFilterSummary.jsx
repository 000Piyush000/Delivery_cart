import { buildMonthlyBuckets, formatSelectedDateLabel } from "../utils/dateFilters.js";

export default function DateFilterSummary({
  title,
  subtitle,
  items,
  getDateValue,
  selectedDate,
  valueLabel = "records"
}) {
  const monthlyBuckets = buildMonthlyBuckets(items, getDateValue).slice(0, 6);

  return (
    <div className="card date-summary-card">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Date overview</p>
          <h3>{title}</h3>
        </div>
        <span className="date-summary-badge">{formatSelectedDateLabel(selectedDate)}</span>
      </div>
      {subtitle ? <p className="muted">{subtitle}</p> : null}
      <div className="month-summary-grid">
        {monthlyBuckets.length ? (
          monthlyBuckets.map((bucket) => (
            <div key={bucket.key} className="month-summary-item">
              <strong>{bucket.count}</strong>
              <span>{bucket.label}</span>
              <small>{valueLabel}</small>
            </div>
          ))
        ) : (
          <p className="muted">No dated activity is available yet.</p>
        )}
      </div>
    </div>
  );
}
