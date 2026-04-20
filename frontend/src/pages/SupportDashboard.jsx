import { useEffect, useState } from "react";
import { apiRequest, apiRequestOrFallback } from "../api/client.js";
import StatusBadge from "../components/StatusBadge.jsx";
import DateFilterSummary from "../components/DateFilterSummary.jsx";
import DashboardDateControl from "../components/DashboardDateControl.jsx";
import { matchesSelectedDate } from "../utils/dateFilters.js";

export default function SupportDashboard({ searchQuery = "", selectedDate = "", onSelectedDateChange = () => {} }) {
  const [disputes, setDisputes] = useState([]);
  const [message, setMessage] = useState("");

  const loadDisputes = async () => {
    const data = await apiRequestOrFallback("/disputes", []);
    setDisputes(data);
  };

  useEffect(() => {
    loadDisputes();
  }, []);

  const updateDispute = async (id, status, resolution) => {
    try {
      await apiRequest(`/disputes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, resolution })
      });
      setMessage(`Dispute #${id} moved to ${status}`);
      await loadDisputes();
    } catch (error) {
      setMessage("Unable to update this dispute right now.");
    }
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const dateFilteredDisputes = disputes.filter((dispute) =>
    matchesSelectedDate(dispute.updated_at || dispute.created_at, selectedDate)
  );
  const filteredDisputes = dateFilteredDisputes.filter((dispute) => {
    if (!normalizedSearch) {
      return true;
    }

    return [
      dispute.id,
      dispute.order_id,
      dispute.customer_name,
      dispute.reason,
      dispute.status
    ].some((value) => String(value ?? "").toLowerCase().includes(normalizedSearch));
  });

  return (
    <section>
      <div className="hero page-hero">
        <div className="page-hero-heading">
          <p className="eyebrow">Support</p>
          <div className="page-hero-title-row">
            <h2>Dispute resolution desk</h2>
            <DashboardDateControl
              selectedDate={selectedDate}
              onChange={onSelectedDateChange}
              variant="inline"
              clearable
            />
          </div>
        </div>
      </div>
      <DateFilterSummary
        title="Support queue by month"
        subtitle="Use the date picker on this page to isolate disputes updated on a specific day."
        items={disputes}
        getDateValue={(dispute) => dispute.updated_at || dispute.created_at}
        selectedDate={selectedDate}
        valueLabel="cases"
      />
      {message ? <p className="banner">{message}</p> : null}
      <div className="list-grid">
        {filteredDisputes.map((dispute) => (
          <div className="card" key={dispute.id}>
            <h3>Dispute #{dispute.id}</h3>
            <p>Order #{dispute.order_id}</p>
            <p>Customer: {dispute.customer_name}</p>
            <p>Reason: {dispute.reason}</p>
            <StatusBadge status={dispute.status} />
            <div className="button-row">
              <button onClick={() => updateDispute(dispute.id, "investigate", "Investigating issue")}>
                Investigate
              </button>
              <button onClick={() => updateDispute(dispute.id, "resolve", "Refund approved")}>
                Resolve
              </button>
              <button onClick={() => updateDispute(dispute.id, "close", "Case closed")}>Close</button>
            </div>
          </div>
        ))}
      </div>
      {!filteredDisputes.length ? <p className="muted empty-state-text">No disputes match the selected date and search.</p> : null}
    </section>
  );
}
