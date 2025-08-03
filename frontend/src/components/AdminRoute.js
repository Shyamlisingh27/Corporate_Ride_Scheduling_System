import React from 'react';
import { Navigate } from 'react-router-dom';
import { getToken, getUserFromToken, isAdmin } from '../utils/auth';

// const AdminRoute = ({ children }) => {
//   const token = getToken();
//   const user = getUserFromToken();
//   return token && user && user.role === 'admin'
//     ? children
//     : <Navigate to="/login" />;
  
// };


const AdminRoute = ({ children }) => {
  const token = getToken();
  const user = getUserFromToken();

  console.log("🧠 AdminRoute - token:", token);
  console.log("🧠 AdminRoute - user:", user);

  if (!token || !user || user.role !== 'admin') {
    console.warn("⛔ Not an admin or not logged in");
    return <Navigate to="/login" />;
  }

  return children;
};




export default AdminRoute;