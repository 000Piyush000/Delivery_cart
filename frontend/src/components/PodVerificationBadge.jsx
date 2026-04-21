import StatusBadge from "./StatusBadge.jsx";

export default function PodVerificationBadge({ status }) {
  if (status === "verified") {
    return <StatusBadge status="pod_verified" />;
  }

  if (status === "investigate") {
    return <StatusBadge status="pod_investigate" />;
  }

  return null;
}
