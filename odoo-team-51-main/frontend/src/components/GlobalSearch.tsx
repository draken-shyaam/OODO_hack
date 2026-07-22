import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Store, Factory, Package, Radar, Loader2 } from 'lucide-react';
import { listSalesOrders } from '../api/salesApi';
import { listPurchaseOrders } from '../api/purchaseApi';
import { listManufacturingOrders } from '../api/manufacturingApi';
import { listProducts } from '../api/productApi';
import { listIntelPosts } from '../api/intelHubApi';

interface ResultGroup {
  label: string;
  icon: typeof ShoppingCart;
  items: { id: number; title: string; subtitle: string; href: string }[];
}

const MIN_QUERY_LENGTH = 2;
const PER_GROUP_LIMIT = 4;

/**
 * The header search bar was previously decorative — no value/onChange at
 * all, the ⌘K hint did nothing. This wires it to the same per-module
 * `search` query param every list page already uses (Sales/Purchase/
 * Manufacturing/Products/IntelHub), fanned out in parallel, rather than
 * inventing a new backend search endpoint.
 */
export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<ResultGroup[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Cmd/Ctrl+K focuses the search bar from anywhere in the app.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside closes the dropdown without clearing the typed query.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setGroups([]);
      return;
    }
    setLoading(true);
    const debounce = setTimeout(() => {
      Promise.all([
        listSalesOrders({ search: query }).catch(() => []),
        listPurchaseOrders({ search: query }).catch(() => []),
        listManufacturingOrders({ search: query }).catch(() => []),
        listProducts(query).catch(() => []),
        listIntelPosts({ search: query }).catch(() => []),
      ]).then(([sales, purchase, manufacturing, products, intel]) => {
        const next: ResultGroup[] = [
          {
            label: 'Sale Orders', icon: ShoppingCart,
            items: sales.slice(0, PER_GROUP_LIMIT).map((o) => ({ id: o.id, title: o.reference, subtitle: o.customer?.name ?? '', href: `/sales/${o.id}` })),
          },
          {
            label: 'Purchase Orders', icon: Store,
            items: purchase.slice(0, PER_GROUP_LIMIT).map((o) => ({ id: o.id, title: o.reference, subtitle: o.vendor?.name ?? '', href: `/purchase/${o.id}` })),
          },
          {
            label: 'Manufacturing Orders', icon: Factory,
            items: manufacturing.slice(0, PER_GROUP_LIMIT).map((o) => ({ id: o.id, title: o.reference, subtitle: o.finishedProduct?.name ?? '', href: `/manufacturing/${o.id}` })),
          },
          {
            label: 'Products', icon: Package,
            items: products.slice(0, PER_GROUP_LIMIT).map((p) => ({ id: p.id, title: p.name, subtitle: p.reference, href: `/products/${p.id}` })),
          },
          {
            label: 'IntelHub Leads', icon: Radar,
            items: intel.slice(0, PER_GROUP_LIMIT).map((p) => ({ id: p.id, title: p.title, subtitle: `${p.materialName} · ${p.supplierName}`, href: `/intel-hub` })),
          },
        ].filter((g) => g.items.length > 0);
        setGroups(next);
        setLoading(false);
      });
    }, 250);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (href: string) => {
    setIsOpen(false);
    navigate(href);
  };

  const hasResults = groups.length > 0;

  return (
    <div ref={containerRef} className="hidden md:flex flex-1 max-w-md items-center relative">
      <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder="Search transaction, Budget..."
        className="w-full bg-transparent border border-border rounded-lg pl-9 pr-12 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
      />
      {query ? (
        <button
          onClick={() => { setQuery(''); inputRef.current?.focus(); }}
          className="absolute right-2 px-1.5 py-0.5 rounded border border-border bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/70"
        >
          Esc
        </button>
      ) : (
        <div className="absolute right-2 px-1.5 py-0.5 rounded border border-border bg-secondary text-secondary-foreground text-xs font-medium">
          ⌘K
        </div>
      )}

      {isOpen && query.trim().length >= MIN_QUERY_LENGTH && (
        <div className="absolute top-full left-0 mt-2 w-[28rem] max-h-[26rem] overflow-y-auto custom-scrollbar bg-card border border-border rounded-xl shadow-floating z-50 animate-in fade-in zoom-in-95 duration-150">
          {loading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-6">
              <Loader2 className="w-4 h-4 animate-spin" /> Searching...
            </div>
          )}
          {!loading && !hasResults && (
            <p className="text-sm text-muted-foreground text-center py-6">No matches for "{query}".</p>
          )}
          {!loading && groups.map((group) => (
            <div key={group.label} className="py-1.5">
              <p className="px-4 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <group.icon className="w-3 h-3" /> {group.label}
              </p>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.href)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors flex items-center justify-between gap-3"
                >
                  <span className="font-medium text-foreground">{item.title}</span>
                  <span className="text-xs text-muted-foreground truncate">{item.subtitle}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
