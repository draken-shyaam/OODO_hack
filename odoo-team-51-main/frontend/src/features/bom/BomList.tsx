import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListView } from '../../components/ui/ListView';
import type { Bom } from '../../types';
import { listBoms } from '../../api/bomApi';

export function BomList() {
  const [boms, setBoms] = useState<Bom[]>([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const debounce = setTimeout(() => {
      listBoms({ search: search || undefined }).then(setBoms).catch(console.error);
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const columns = [
    { header: 'Reference', accessor: 'reference' as keyof Bom },
    { header: 'Finished Product', accessor: (row: Bom) => row.product?.name ?? '' },
    { header: 'Quantity', accessor: 'quantity' as keyof Bom },
  ];

  return (
    <ListView
      title="Bills of Materials"
      data={boms}
      columns={columns}
      onNew={() => navigate('/bom/new')}
      viewMode="list"
      searchValue={search}
      onSearchChange={setSearch}
      onRowClick={(row) => navigate(`/bom/${row.id}`)}
    />
  );
}
