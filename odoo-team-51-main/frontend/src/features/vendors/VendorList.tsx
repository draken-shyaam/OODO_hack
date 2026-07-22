import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListView } from '../../components/ui/ListView';
import type { Vendor } from '../../types';
import { listVendors } from '../../api/vendorApi';

export function VendorList() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    listVendors().then(setVendors).catch(console.error);
  }, []);

  const columns = [
    { header: 'Reference', accessor: 'reference' as keyof Vendor },
    { header: 'Vendor Name', accessor: 'name' as keyof Vendor },
    { header: 'Address', accessor: (row: Vendor) => row.address ?? '-' },
    { header: 'Contact', accessor: (row: Vendor) => row.contact ?? '-' },
  ];

  return (
    <ListView
      title="Vendors"
      data={vendors}
      columns={columns}
      onNew={() => navigate('/vendors/new')}
      viewMode="list"
      onRowClick={(row) => navigate(`/vendors/${row.id}`)}
    />
  );
}
