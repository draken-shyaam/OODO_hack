import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListView } from '../../components/ui/ListView';
import type { User } from '../../types';
import { listUsers } from '../../api/userManagementApi';

export function UserList() {
  const [users, setUsers] = useState<Omit<User, 'permissions'>[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    listUsers().then(setUsers).catch(console.error);
  }, []);

  type Row = Omit<User, 'permissions'>;
  const columns = [
    { header: 'Name', accessor: 'name' as keyof Row },
    { header: 'Email', accessor: 'email' as keyof Row },
    { header: 'Position', accessor: (row: Row) => row.position ?? '-' },
    { header: 'Role', accessor: (row: Row) => (row.isAdmin ? 'Admin' : 'User') },
  ];

  return (
    <ListView
      title="User Management"
      data={users}
      columns={columns}
      onNew={() => navigate('/users/new')}
      viewMode="list"
      onRowClick={(row) => navigate(`/users/${row.id}`)}
    />
  );
}
