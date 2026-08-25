import { useState, useCallback } from 'react';
import { loginUser, registerUser, googleLogin } from '../services/api';
import { useAuth } from '../context/AuthContext';

const useAuthActions = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = useCallback(async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await loginUser({ email, password });
      login(data, data.token);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [login]);

  const handleRegister = useCallback(async (formData) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await registerUser(formData);
      login(data, data.token);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [login]);

  const handleGoogleLogin = useCallback(async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await googleLogin(credentialResponse.credential);
      login(data, data.token);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [login]);

  return { handleLogin, handleRegister, handleGoogleLogin, loading, error, setError };
};

export default useAuthActions;
