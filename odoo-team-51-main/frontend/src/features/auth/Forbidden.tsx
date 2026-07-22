import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ShieldOff } from 'lucide-react';

/** Rendered in place by ProtectedRoute when the signed-in user lacks the permission a route requires — distinct from "not authenticated", which redirects to /login instead. */
export function Forbidden() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-secondary flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-red-600 flex items-center justify-center text-white">
            <ShieldOff className="w-6 h-6" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-semibold tracking-tight text-foreground">403 — Forbidden</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-center text-foreground/70">
              You're signed in, but your account doesn't have permission to view this page.
            </p>
          </CardContent>
          <CardFooter className="flex-col gap-4 border-t border-border/50 bg-secondary/50 mt-4 rounded-b-xl">
            <Button onClick={() => navigate('/')} className="w-full">
              Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
