import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5001/api', // Change if your backend runs elsewhere
});

// Add token to headers if present
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
      console.log('Adding token to request:', token.substring(0, 20) + '...');
    } else {
      console.log('No token found in localStorage');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;