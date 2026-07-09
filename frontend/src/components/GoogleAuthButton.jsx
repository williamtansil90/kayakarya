import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';

export default function GoogleAuthButton({ role = 'student', onSuccess, label, compact = false }) {
  const { login } = useAuth();

  const handleSuccess = async (response) => {
    try {
      const res = await authApi.googleLogin(response.credential, role);
      login(res.data.user);
      onSuccess?.(res.data.user);
    } catch (err) {
      console.error('Login failed:', err);
      alert('Login gagal. Silakan coba lagi.');
    }
  };

  return (
    <div className={compact ? 'flex items-center' : 'flex flex-col items-center gap-3'}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => alert('Google login gagal')}
        text={label || 'signin_with'}
        shape="rectangular"
        size={compact ? 'medium' : 'large'}
        width={compact ? '180' : '280'}
      />
    </div>
  );
}
