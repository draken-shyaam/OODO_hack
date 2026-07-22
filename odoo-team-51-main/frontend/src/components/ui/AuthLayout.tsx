import { CheckCircle2 } from 'lucide-react';
import { Logo } from './Logo';

const FEATURES = [
  'Real-time Sales, Purchase & Manufacturing in one place',
  'Field-reported supplier intelligence before orders confirm',
  'Live delay tracing back to the actual root cause',
];

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Shared split layout for every auth screen (staff login, admin login,
 * signup, forgot/reset password, customer portal login/signup) — brand
 * panel on the left, the actual form on the right. Below the `lg` breakpoint
 * the left panel disappears entirely (each page falls back to its own small
 * inline logo) rather than squeezing both columns onto a phone screen.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center bg-secondary/40 border-r border-border p-12">
        <div className="flex flex-col items-center text-center max-w-sm">
          <Logo size={96} />
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground">PINERP</h1>
          <p className="mt-2 text-sm text-muted-foreground tracking-wide uppercase">Since 2026</p>
          <p className="mt-8 text-base text-foreground/70 leading-relaxed">
            A real-time ERP for procurement, manufacturing, and inventory — built with field intelligence at its core, not bolted on after.
          </p>
          <div className="mt-10 space-y-4 text-left w-full">
            {FEATURES.map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground/70">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
