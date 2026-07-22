import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormView } from '../../components/ui/FormView';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { createIntelPost } from '../../api/intelHubApi';
import { ApiError, extractApiErrorMessage } from '../../api/client';
import type { IntelPostType } from '../../types';

const TYPE_OPTIONS: { value: IntelPostType; label: string }[] = [
  { value: 'new_supplier', label: 'New Supplier' },
  { value: 'cheaper_supplier', label: 'Cheaper Supplier' },
  { value: 'better_quality', label: 'Better Quality Supplier' },
  { value: 'faster_delivery', label: 'Faster Delivery Supplier' },
  { value: 'bulk_discount', label: 'Bulk Discount Supplier' },
  { value: 'local_supplier', label: 'Local Supplier' },
  { value: 'alternative_material', label: 'Alternative Material' },
  { value: 'excess_stock', label: 'Supplier with Excess Stock' },
];

export function IntelHubForm() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', postType: 'new_supplier' as IntelPostType,
    materialName: '', supplierName: '', location: '', price: '', quantity: '', contactInfo: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await createIntelPost({
        title: form.title,
        description: form.description,
        postType: form.postType,
        materialName: form.materialName,
        supplierName: form.supplierName,
        location: form.location || undefined,
        price: form.price ? Number(form.price) : undefined,
        quantity: form.quantity ? Number(form.quantity) : undefined,
        contactInfo: form.contactInfo || undefined,
      });
      navigate('/intel-hub');
    } catch (err) {
      setError(err instanceof ApiError ? extractApiErrorMessage(err) : 'Could not submit lead');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormView title="Share a Procurement Lead" onBack={() => navigate('/intel-hub')}>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 rounded-lg">{error}</div>}

        <div>
          <label className="label">Lead Type</label>
          <select className="input" value={form.postType} onChange={(e) => setForm({ ...form, postType: e.target.value as IntelPostType })}>
            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Cheaper Wooden Legs supplier in Surat" required />

        <div>
          <label className="label">Description</label>
          <textarea
            className="input min-h-24"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What did you find, and why is it worth the team's attention?"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Material Name" value={form.materialName} onChange={(e) => setForm({ ...form, materialName: e.target.value })} required />
          <Input label="Supplier Name" value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} required />
          <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, State" />
          <Input label="Contact Info" value={form.contactInfo} onChange={(e) => setForm({ ...form, contactInfo: e.target.value })} placeholder="Phone / email" />
          <Input label="Price per Unit (optional)" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <Input label="Quantity Available (optional)" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
        </div>

        <p className="text-xs text-muted-foreground">
          Submitted leads go to Pending until an admin verifies them offline — stars are only awarded once a lead is confirmed genuinely useful.
        </p>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate('/intel-hub')}>Cancel</Button>
          <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Lead'}</Button>
        </div>
      </form>
    </FormView>
  );
}
