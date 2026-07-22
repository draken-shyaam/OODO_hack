import { useAuthStore } from '../store/authStore';

export function usePermission(module: string, field: string) {
  const { user } = useAuthStore();

  if (!user) return { canView: false, canCreate: false, canEdit: false, canDelete: false };
  if (user.isAdmin) return { canView: true, canCreate: true, canEdit: true, canDelete: true };

  const permission = user.permissions.find(
    (p) => p.module.toLowerCase() === module.toLowerCase() && p.field.toLowerCase() === field.toLowerCase()
  );

  return {
    canView: permission?.canView ?? false,
    canCreate: permission?.canCreate ?? false,
    canEdit: permission?.canEdit ?? false,
    canDelete: permission?.canDelete ?? false,
  };
}
