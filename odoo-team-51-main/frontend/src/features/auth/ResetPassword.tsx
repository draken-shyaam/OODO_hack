import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import { resetPassword } from '../../api/authApi';
import { ApiError, extractApiErrorMessage } from '../../api/client';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('This reset link is missing its token. Request a new one.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain a lowercase letter');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain an uppercase letter');
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      setError('Password must contain a special character');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      navigate('/login', { state: { passwordReset: true } });
    } catch (err) {
      setError(err instanceof ApiError ? extractApiErrorMessage(err) : 'Could not reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size={48} />
        </div>
        <h2 className="text-center text-3xl font-semibold tracking-tight text-foreground">
          Choose a New Password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                label="Re-Enter New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              {error && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 rounded-lg">{error}</div>}

              <Button type="submit" className="w-full mt-2" size="lg" disabled={submitting}>
                {submitting ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-4 border-t border-border/50 bg-secondary/50 mt-4 rounded-b-xl">
            <div className="text-sm text-center w-full text-foreground/60">
              <Link to="/login" className="text-primary hover:underline font-medium">Back to Sign In</Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
