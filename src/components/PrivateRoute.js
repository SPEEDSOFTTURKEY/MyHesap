import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { CSpinner } from '@coreui/react';

const PrivateRoute = ({ children, requiredYetkiId }) => {
  const { user, loading } = useUser();

  console.log('=== PRIVATE ROUTE DEBUG ===');
  console.log('User:', user);
  console.log('Loading:', loading);
  console.log('Required Yetki ID:', requiredYetkiId);
  console.log('User Yetki ID:', user?.yetkiId);
  console.log('===========================');

  if (loading) {
    return (
      <div className="pt-3 text-center">
        <CSpinner color="primary" variant="grow" />
        <p>Yetki kontrol ediliyor...</p>
      </div>
    );
  }

  if (!user || !user.id) {
    console.log('Kullanıcı yok, login sayfasına yönlendiriliyor');
    return <Navigate to="/login" replace />;
  }

  if (requiredYetkiId && user.yetkiId !== requiredYetkiId) {
    console.log('Yetki yetersiz, 404 sayfasına yönlendiriliyor');
    return <Navigate to="/404" replace />;
  }

  console.log('Erişim izni verildi');
  return children;
};

export default PrivateRoute;