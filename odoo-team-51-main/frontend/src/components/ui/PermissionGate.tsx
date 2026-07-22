import React from 'react';
import { usePermission } from '../../hooks/usePermission';

interface PermissionGateProps {
  module: string;
  field: string;
  action: 'view' | 'create' | 'edit' | 'delete';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ module, field, action, children, fallback = null }: PermissionGateProps) {
  const permissions = usePermission(module, field);
  
  let hasPermission = false;
  switch (action) {
    case 'view':
      hasPermission = permissions.canView;
      break;
    case 'create':
      hasPermission = permissions.canCreate;
      break;
    case 'edit':
      hasPermission = permissions.canEdit;
      break;
    case 'delete':
      hasPermission = permissions.canDelete;
      break;
  }

  if (hasPermission) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
