export const API_BASE_URL = "http://localhost:5000/api";
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

export const apiRequest = async (path, options = {}) => {
  const token = localStorage.getItem("logistics_token");
  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  return response.json();
};

export const apiRequestOrFallback = async (path, fallbackValue, options = {}) => {
  try {
    return await apiRequest(path, options);
  } catch (error) {
    return fallbackValue;
  }
};
