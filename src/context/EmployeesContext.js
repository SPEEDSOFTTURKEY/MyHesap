import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../api/api";

const EmployeesContext = createContext();
const API_BASE_URL = "https://localhost:44375/api";

export const EmployeesProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [employeeBalances, setEmployeeBalances] = useState({});

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`${API_BASE_URL}/calisan/calisan-get-all`, {
        headers: { accept: "*/*" },
      });
      const data = (
        Array.isArray(response.data) ? response.data : response.data.data || []
      ).map((item) => ({
        id: item.id,
        adiSoyadi: item.adiSoyadi || item.name || "",
        email: item.email || "",
        tc: item.tc || "",
        dogumTarihi: item.dogumTarihi || "",
        girisTarihi: item.girisTarihi || "",
        cikisTarihi: item.cikisTarihi || "",
        departman: item.departman || item.department || "",
        maas: item.maas || item.salary || 0,
        paraBirimi: item.paraBirimi || item.currency || "TRY",
        fotograf: item.fotograf || item.photo || "",
        telefon: item.telefon || "",
        adres: item.adres || "",
        notlar: item.notlar || "",
        hesapNo: item.hesapNo || "",
      }));
      setEmployees(data);
      setError(null);
      // Tüm çalışanlar için bakiyeleri çek
      for (const employee of data) {
        await fetchEmployeeBalance(employee.id);
      }
    } catch (err) {
      const errorMessage = err.response
        ? `Durum: ${err.response.status}, Mesaj: ${err.response.data?.message || err.message}`
        : err.message;
      setError("Çalışanlar alınamadı: " + errorMessage);
      console.error("API hatası:", err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployeeById = useCallback(async (employeeId) => {
    if (!employeeId || isNaN(employeeId)) {
      console.error("Geçersiz çalışan ID'si:", employeeId);
      setError("Geçersiz çalışan ID'si.");
      setSelectedEmployee(null);
      return { success: false, message: "Geçersiz çalışan ID'si." };
    }
    setLoading(true);
    try {
      console.log("Çalışan ID Değeri:", employeeId); // Doğru ID'yi logla
      const response = await api.get(
        `${API_BASE_URL}/calisan/calisan-get-by-Id/${employeeId}`,
        {
          headers: { accept: "*/*" },
        }
      );
      const data = response.data.data || response.data;
      const formattedData = {
        id: data.id,
        adiSoyadi: data.adiSoyadi || data.name || "",
        departman: data.departman || data.department || "",
        maas: data.maas || data.salary || 0,
        paraBirimi: data.paraBirimi || data.currency || "TRY",
        fotograf: data.fotograf || data.photo || "",
        email: data.email || "",
        telefon: data.telefon || "",
        tc: data.tc || "",
        adres: data.adres || "",
        notlar: data.notlar || "",
        girisTarihi: data.girisTarihi || "",
        cikisTarihi: data.cikisTarihi || "",
        dogumTarihi: data.dogumTarihi || "",
        hesapNo: data.hesapNo || "",
      };
      setSelectedEmployee(formattedData);
      setEmployees((prev) => {
        const exists = prev.some((emp) => emp.id === data.id);
        if (!exists) return [...prev, formattedData];
        return prev.map((emp) => (emp.id === data.id ? formattedData : emp));
      });
      setError(null);
      await fetchEmployeeBalance(Number(employeeId)); // Çalışan detayına gidildiğinde bakiyeyi yenile
      return { success: true, data: formattedData };
    } catch (err) {
      const errorMessage = err.response
        ? `Durum: ${err.response.status}, Mesaj: ${err.response.data?.message || err.message}`
        : err.message;
      setError("Çalışan detayları alınamadı: " + errorMessage);
      console.error("API hatası:", err);
      setSelectedEmployee(null);
      return {
        success: false,
        message: "Çalışan detayları alınamadı: " + errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployeeBalance = useCallback(async (employeeId) => {
    if (!employeeId || isNaN(employeeId)) {
      console.error("Geçersiz çalışan ID'si:", employeeId);
      setEmployeeBalances((prev) => ({ ...prev, [employeeId]: 0 }));
      return 0;
    }
    try {
      const response = await api.get(
        `${API_BASE_URL}/calisancari/calisancaricalisan-get-by-Id/${employeeId}`,
        {
          headers: { accept: "*/*" },
        }
      );
      const transactions = Array.isArray(response.data)
        ? response.data
        : response.data
          ? [response.data]
          : [];

      const totalBalance = transactions.reduce((sum, transaction) => {
        const borc = transaction.borc || 0;
        const alacak = transaction.alacak || 0;
        return sum + (alacak - borc);
      }, 0);
      setEmployeeBalances((prev) => ({
        ...prev,
        [employeeId]: totalBalance,
      }));
      return totalBalance;
    } catch (err) {
      console.error(`Bakiye alınamadı (Çalışan ID: ${employeeId}):`, err);
      setEmployeeBalances((prev) => ({ ...prev, [employeeId]: 0 }));
      return 0;
    }
  }, []);

  const addEmployee = async (employeeData, file) => {
    try {
      const formPayload = new FormData();
      Object.keys(employeeData).forEach((key) => {
        if (
          employeeData[key] !== undefined &&
          employeeData[key] !== null &&
          employeeData[key] !== ""
        ) {
          formPayload.append(key, employeeData[key]);
        }
      });
      if (file) formPayload.append("fotograf", file);
      formPayload.append("eklenmeTarihi", new Date().toISOString());
      formPayload.append("guncellenmeTarihi", new Date().toISOString());

      const response = await api.post(
        `${API_BASE_URL}/calisan/calisan-create`,
        formPayload,
        {
          headers: { "Content-Type": "multipart/form-data", accept: "*/*" },
        }
      );
      const newEmployee = response.data.data || response.data;
      const formattedEmployee = {
        id: newEmployee.id,
        adiSoyadi: newEmployee.adiSoyadi || "",
        email: newEmployee.email || "",
        tc: newEmployee.tc || "",
        dogumTarihi: newEmployee.dogumTarihi || "",
        girisTarihi: newEmployee.girisTarihi || "",
        cikisTarihi: newEmployee.cikisTarihi || "",
        departman: newEmployee.departman || "",
        maas: newEmployee.maas || 0,
        paraBirimi: newEmployee.paraBirimi || "TRY",
        fotograf: newEmployee.fotograf || "",
        telefon: newEmployee.telefon || "",
        adres: newEmployee.adres || "",
        notlar: newEmployee.notlar || "",
        hesapNo: newEmployee.hesapNo || "",
      };
      setEmployees((prev) => [...prev, formattedEmployee]);
      await fetchEmployeeBalance(newEmployee.id); // Yeni çalışanın bakiyesini çek
      return { success: true, message: "Çalışan başarıyla eklendi." };
    } catch (err) {
      const errorMessage = err.response
        ? `Durum: ${err.response.status}, Mesaj: ${err.response.data?.message || err.message}`
        : err.message;
      console.error("addEmployee error:", err);
      return { success: false, message: "Çalışan eklenemedi: " + errorMessage };
    }
  };

  const updateEmployee = async (employeeId, employeeData, file) => {
    try {
      const formPayload = new FormData();
      formPayload.append("id", employeeId);
      Object.keys(employeeData).forEach((key) => {
        if (
          employeeData[key] !== undefined &&
          employeeData[key] !== null &&
          employeeData[key] !== ""
        ) {
          formPayload.append(key, employeeData[key]);
        }
      });
      if (file) formPayload.append("fotograf", file);
      formPayload.append("guncellenmeTarihi", new Date().toISOString());

      const response = await api.put(
        `${API_BASE_URL}/calisan/calisan-update`,
        formPayload,
        {
          headers: { "Content-Type": "multipart/form-data", accept: "*/*" },
        }
      );
      const updatedEmployee = response.data.data || response.data;
      const formattedEmployee = {
        id: updatedEmployee.id,
        adiSoyadi: updatedEmployee.adiSoyadi || "",
        email: updatedEmployee.email || "",
        tc: updatedEmployee.tc || "",
        dogumTarihi: updatedEmployee.dogumTarihi || "",
        girisTarihi: updatedEmployee.girisTarihi || "",
        cikisTarihi: updatedEmployee.cikisTarihi || "",
        departman: updatedEmployee.departman || "",
        maas: updatedEmployee.maas || 0,
        paraBirimi: updatedEmployee.paraBirimi || "TRY",
        fotograf: updatedEmployee.fotograf || "",
        telefon: updatedEmployee.telefon || "",
        adres: updatedEmployee.adres || "",
        notlar: updatedEmployee.notlar || "",
        hesapNo: updatedEmployee.hesapNo || "",
      };
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === employeeId ? formattedEmployee : emp))
      );
      if (selectedEmployee?.id === employeeId) {
        setSelectedEmployee(formattedEmployee);
      }
      await fetchEmployeeBalance(employeeId); // Güncellenen çalışanın bakiyesini yenile
      return { success: true, message: "Çalışan başarıyla güncellendi." };
    } catch (err) {
      const errorMessage = err.response
        ? `Durum: ${err.response.status}, Mesaj: ${err.response.data?.message || err.message}`
        : err.message;
      return {
        success: false,
        message: "Çalışan güncellenemedi: " + errorMessage,
      };
    }
  };

  const deleteEmployee = async (employeeId) => {
    console.log("deleteEmployee fonksiyonu çağrıldı"); //--->
    try {
      await api.delete(`${API_BASE_URL}/calisan/calisan-delete/${employeeId}`, {
        headers: { accept: "*/*" },
      });
      setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
      if (selectedEmployee?.id === employeeId) {
        setSelectedEmployee(null);
      }
      setEmployeeBalances((prev) => {
        const updatedBalances = { ...prev };
        delete updatedBalances[employeeId];
        return updatedBalances;
      });
      return { success: true, message: "Çalışan başarıyla silindi." };
    } catch (err) {
      const errorMessage = err.response
        ? `Durum: ${err.response.status}, Mesaj: ${err.response.data?.message || err.message}`
        : err.message;
      return { success: false, message: "Çalışan silinemedi: " + errorMessage };
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return (
    <EmployeesContext.Provider
      value={{
        employees,
        selectedEmployee,
        loading,
        error,
        employeeBalances,
        fetchEmployees,
        fetchEmployeeById,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        fetchEmployeeBalance,
      }}
    >
      {children}
    </EmployeesContext.Provider>
  );
};

export const useEmployees = () => {
  const context = useContext(EmployeesContext);
  if (!context) {
    throw new Error("useEmployees must be used within an EmployeesProvider");
  }
  return context;
};
