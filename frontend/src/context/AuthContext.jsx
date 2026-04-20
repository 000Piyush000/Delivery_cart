import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "../api/client.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("logistics_user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("logistics_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("logistics_user");
    }
  }, [user]);

  const login = async (name, password) => {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ name, password })
    });

    localStorage.setItem("logistics_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const registerCustomer = async ({ name, password, address }) => {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, password, address })
    });

    localStorage.setItem("logistics_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("logistics_token");
    localStorage.removeItem("logistics_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, registerCustomer, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
