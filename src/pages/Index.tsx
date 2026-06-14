import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Welcome from './Welcome';

const Index = () => {
  const { isAuthenticated, userType } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      if (userType === 'admin' || userType === 'manager') {
        navigate('/admin');
      } else if (userType === 'user') {
        navigate('/user');
      }
    }
  }, [isAuthenticated, userType, navigate]);

  return <Welcome />;
};

export default Index;
