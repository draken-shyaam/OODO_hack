import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import { forgotPassword } from '../../api/authApi';
import { ApiError, extractApiErrorMessage } from '../../api/client';

export function ForgotPassword() {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await forgotPassword(identifier);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? extractApiErrorMessage(err) : 'Could not send reset link');
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
          Reset Password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent className="pt-6">
            {submitted ? (
              <div className="text-sm text-center text-foreground/70">
                If an account exists for <span className="font-medium text-foreground">{identifier}</span>,
                a password reset link has been sent to the email on file.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Login ID or Email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your Login ID or Email"
                  required
                />

                {error && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 rounded-lg">{error}</div>}

                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            )}
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
