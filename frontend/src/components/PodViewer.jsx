import { useEffect, useMemo, useState } from "react";
import { API_ORIGIN } from "../api/client.js";

export default function PodViewer({ pod, localPreview }) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = useMemo(() => {
    const rawUrl = pod?.file_url || localPreview;

    if (!rawUrl) {
      return "";
    }

    if (rawUrl.startsWith("blob:") || rawUrl.startsWith("data:") || rawUrl.startsWith("http")) {
      return rawUrl;
    }

    if (rawUrl.startsWith("/")) {
      return `${API_ORIGIN}${rawUrl}`;
    }

    return rawUrl;
  }, [localPreview, pod?.file_url]);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  if (!imageUrl) {
    return (
      <div className="pod-empty">
        <strong>POD pending</strong>
        <span>Upload a delivery image or signature to complete proof of delivery.</span>
      </div>
    );
  }

  return (
    <>
      <div className="pod-card">
        {!imageFailed ? (
          <div className="pod-image-frame">
            <img
              src={imageUrl}
              alt="Proof of delivery"
              className="pod-image"
              onError={() => setImageFailed(true)}
            />
          </div>
        ) : (
          <div className="pod-empty">
            <strong>POD image unavailable</strong>
            <span>The file was uploaded, but the preview could not be loaded in the browser.</span>
          </div>
        )}
        <div className="pod-meta">
          <div>
            <p className="section-kicker">Proof of Delivery</p>
            <strong>{pod?.verified === false ? "Verification mismatch" : imageFailed ? "Preview unavailable" : "Image ready"}</strong>
          </div>
          <div className="pod-meta-list">
            <span>{pod?.uploaded_at ? new Date(pod.uploaded_at).toLocaleString() : "Pending upload"}</span>
            <div className="button-row">
              {!imageFailed ? (
                <button type="button" className="ghost-button" onClick={() => setIsZoomed(true)}>
                  Zoom preview
                </button>
              ) : null}
              <a href={imageUrl} target="_blank" rel="noreferrer" className="ghost-button pod-open-link">
                Open file
              </a>
            </div>
          </div>
        </div>
      </div>

      {isZoomed && !imageFailed ? (
        <div className="modal-backdrop" onClick={() => setIsZoomed(false)}>
          <div className="modal-card modal-image-card" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="ghost-button modal-close" onClick={() => setIsZoomed(false)}>
              Close
            </button>
            <img src={imageUrl} alt="Proof of delivery zoomed" className="pod-image pod-image-zoomed" />
          </div>
        </div>
      ) : null}
    </>
  );
}
