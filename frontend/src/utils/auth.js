// // Get token from localStorage
// export function getToken() {
//   return localStorage.getItem('token');
// }

// // Decode JWT to get user info (role, etc.)
// export function getUserFromToken() {
//   const token = getToken();
//   if (!token) return null;
//   try {
//     const payload = JSON.parse(atob(token.split('.')[1]));
//     return payload;
//   } catch {
//     return null;
//   }
//   // try {
//   //   return JSON.parse(localStorage.getItem('user'));
//   // } catch {
//   //   return null;
//   // }
// }

// // Check if user is admin
// export function isAdmin() {
//   const user = getUserFromToken();
//   return user && user.role === 'admin';
// }


// auth.js

// ✅ Get token from localStorage (used for authenticated API requests)
export function getToken() {
  return localStorage.getItem('token');
}

// ✅ Get the full user object (including role) from localStorage
export function getUserFromToken() {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

// ✅ Check if user is logged in (based on token presence)
export function isLoggedIn() {
  return !!getToken();
}

// ✅ Check if logged-in user is an admin
export function isAdmin() {
  const user = getUser();
  return user && user.role === 'admin';
}

// ✅ Check if logged-in user is a manager (optional, based on your schema)
export function isManager() {
  const user = getUser();
  return user && user.role === 'manager';
}

// ✅ Clear user session (logout)
export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
