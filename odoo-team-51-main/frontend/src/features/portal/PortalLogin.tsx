import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import { portalLogin } from '../../api/authApi';
import { ApiError } from '../../api/client';
import { usePortalAuthStore } from '../../store/portalAuthStore';

export function PortalLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = usePortalAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { customer } = await portalLogin(email, password);
      login(customer);
      navigate('/portal');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size={48} />
        </div>
        <h2 className="text-center text-3xl font-semibold tracking-tight text-foreground">Customer Portal</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-6">
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              {error && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 rounded-lg">{error}</div>}
              <Button type="submit" className="w-full" size="lg">Sign In</Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-4 border-t border-border/50 bg-secondary/50 mt-4 rounded-b-xl">
            <div className="text-sm text-center w-full text-foreground/60">
              New customer? <Link to="/portal/signup" className="text-primary hover:underline font-medium">Sign Up</Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
