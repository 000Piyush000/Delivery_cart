import { formatSelectedDateLabel } from "../utils/dateFilters.js";

export default function DashboardDateControl({
  selectedDate,
  onChange,
  variant = "card",
  clearable = false
}) {
  const isInline = variant === "inline";

  return (
    <div className={`dashboard-date-control${isInline ? " dashboard-date-control-inline" : ""}`}>
      <label className="dashboard-date-picker">
        <span>Select date</span>
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Select dashboard date"
        />
      </label>
      {isInline ? null : <small>{formatSelectedDateLabel(selectedDate)}</small>}
      {clearable ? (
        <button
          className="ghost-button dashboard-date-clear-button"
          type="button"
          disabled={!selectedDate}
          onClick={() => onChange("")}
        >
          Clear date
        </button>
      ) : null}
    </div>
  );
}
