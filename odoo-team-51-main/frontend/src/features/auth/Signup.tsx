import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import { AuthLayout } from '../../components/ui/AuthLayout';
import { signup as signupApi } from '../../api/authApi';
import { ApiError, extractApiErrorMessage } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

export function Signup() {
  const [formData, setFormData] = useState({
    loginId: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!/[a-z]/.test(formData.password)) {
      setError('Password must contain a lowercase letter');
      return;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain an uppercase letter');
      return;
    }
    if (!/[^A-Za-z0-9]/.test(formData.password)) {
      setError('Password must contain a special character');
      return;
    }
    if (formData.loginId.length < 6 || formData.loginId.length > 12) {
      setError('Login Id must be 6-12 characters');
      return;
    }

    try {
      const { user } = await signupApi(formData.loginId, formData.email, formData.password);
      login(user);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? extractApiErrorMessage(err) : 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size={48} />
        </div>
        <h2 className="text-center text-3xl font-semibold tracking-tight text-foreground">
          Create an Account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSignup} className="space-y-4">
              <Input 
                label="Login ID (6-12 chars)" 
                value={formData.loginId} 
                onChange={(e) => setFormData({...formData, loginId: e.target.value})} 
                required 
                minLength={6}
                maxLength={12}
              />
              <Input 
                label="Email ID" 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                required 
              />
              <Input 
                label="Password" 
                type="password" 
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                required 
              />
              <Input 
                label="Re-Enter Password" 
                type="password" 
                value={formData.confirmPassword} 
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
                required 
              />
              
              {error && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 rounded-lg">{error}</div>}

              <Button type="submit" className="w-full mt-2" size="lg">
                Sign Up
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-4 border-t border-border/50 bg-secondary/50 mt-4 rounded-b-xl">
            <div className="text-sm text-center w-full text-foreground/60">
              Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Sign In</Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
