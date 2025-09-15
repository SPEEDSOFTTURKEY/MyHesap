import { useEffect } from "react";

const ExitPage = () => {

  useEffect(() => {
    console.log("✅ ExitPage çalıştı");

    // 1️⃣ LocalStorage temizle
    localStorage.clear();

    // 2️⃣ SessionStorage temizle
    sessionStorage.clear();

    // 3️⃣ Çerezleri temizle
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    console.log("🗑️ Tüm depolama alanları temizlendi");
  }, []);

};

export default ExitPage;
