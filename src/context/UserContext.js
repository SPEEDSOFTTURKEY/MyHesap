// context/UserContext.js - Örnek implementasyon
import React, { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sayfa yüklendiğinde localStorage'dan kullanıcı bilgilerini kontrol et
    // const savedUser = localStorage.getItem('user');
    // if (savedUser) {
    //   try {
    //     setUser(JSON.parse(savedUser));
    //   } catch (error) {
    //     console.error('Kullanıcı bilgileri okunamadı:', error);
    //     localStorage.removeItem('user');
    //   }
    // }
    setLoading(false);
  }, []);

  const updateUser = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("user");
    }
  };

  const value = {
    user,
    setUser: updateUser,
    loading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
