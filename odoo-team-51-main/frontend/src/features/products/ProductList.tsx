import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListView } from '../../components/ui/ListView';
import { KanbanView } from '../../components/ui/KanbanView';
import { Card } from '../../components/ui/Card';
import type { Product } from '../../types';
import { listProducts } from '../../api/productApi';

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const navigate = useNavigate();

  useEffect(() => {
    listProducts().then(setProducts).catch(console.error);
  }, []);

  const columns = [
    { header: 'Reference', accessor: 'reference' as keyof Product },
    { header: 'Product Name', accessor: 'name' as keyof Product },
    { header: 'Sales Price', accessor: (row: Product) => `₹${row.salesPrice.toFixed(2)}` },
    { header: 'Cost Price', accessor: (row: Product) => `₹${row.costPrice.toFixed(2)}` },
    { header: 'On Hand', accessor: 'onHandQty' as keyof Product },
    { header: 'Free to Use', accessor: (row: Product) => row.freeToUseQty ?? '-' },
  ];

  const kanbanColumns = [{ id: 'all', title: 'All Products', items: products }];

  const renderKanbanCard = (product: Product) => (
    <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(`/products/${product.id}`)}>
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-sm">{product.name}</span>
      </div>
      <p className="text-xs text-foreground/60">{product.reference}</p>
      <div className="mt-3 flex justify-between text-sm">
        <span>Price: ₹{product.salesPrice.toFixed(2)}</span>
        <span className="text-foreground/70">Stock: {product.onHandQty}</span>
      </div>
    </Card>
  );

  return (
    <ListView
      title="Products"
      data={products}
      columns={columns}
      onNew={() => navigate('/products/new')}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      onRowClick={(row) => navigate(`/products/${row.id}`)}
      kanbanComponent={<KanbanView columns={kanbanColumns} renderCard={renderKanbanCard} />}
    />
  );
}
