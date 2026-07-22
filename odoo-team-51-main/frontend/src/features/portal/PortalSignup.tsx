import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import { portalSignup } from '../../api/authApi';
import { ApiError } from '../../api/client';
import { usePortalAuthStore } from '../../store/portalAuthStore';

export function PortalSignup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const login = usePortalAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    try {
      const { customer } = await portalSignup(form.name, form.email, form.password);
      login(customer);
      navigate('/portal');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size={48} />
        </div>
        <h2 className="text-center text-3xl font-semibold tracking-tight text-foreground">Create Customer Account</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSignup} className="space-y-4">
              <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              {error && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 rounded-lg">{error}</div>}
              <Button type="submit" className="w-full mt-2" size="lg">Sign Up</Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-4 border-t border-border/50 bg-secondary/50 mt-4 rounded-b-xl">
            <div className="text-sm text-center w-full text-foreground/60">
              Already have an account? <Link to="/portal/login" className="text-primary hover:underline font-medium">Sign In</Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
