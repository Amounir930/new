'use client';

import { Edit, Package, Plus, Search, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiFetch } from '@/lib/api';

interface Product {
  id: string;
  name: { ar: string; en: string };
  sku: string;
  basePrice: string; // DB returns numeric as string
  isActive: boolean;
  mainImage?: string;
  publishedAt?: string | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const data = await apiFetch<Product[]>('/merchant/products');
      setProducts(data);
    } catch (_error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(product: Product) {
    if (!window.confirm(`Delete "${product.nameEn}"?\n\nThis action cannot be undone.`)) return;

    setDeletingId(product.id);
    const toastId = toast.loading('Deleting product...');
    try {
      await apiFetch(`/merchant/products/${product.id}`, { method: 'DELETE' });
      // Optimistic remove from list
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success('Product deleted', { id: toastId });
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete product', { id: toastId });
    } finally {
      setDeletingId(null);
    }
  }

  function renderProductRow(product: Product) {
    const isDeleting = deletingId === product.id;
    return (
      <TableRow
        key={product.id}
        className={`hover:bg-muted/20 transition-colors ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <TableCell>
          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-white/5 relative">
            {product.mainImage ? (
              <Image
                src={product.mainImage}
                alt={product.nameEn}
                fill
                className="object-cover"
              />
            ) : (
              <Package className="h-6 w-6 opacity-20" />
            )}
          </div>
        </TableCell>
        <TableCell className="font-medium">
          <div>
            <p>{product.name?.en ?? '—'}</p>
            <p className="text-xs text-muted-foreground">{product.name?.ar ?? ''}</p>
          </div>
        </TableCell>
        <TableCell className="font-mono text-xs">{product.sku}</TableCell>
        <TableCell>${parseFloat(product.basePrice || '0').toFixed(2)}</TableCell>
        <TableCell>
          <Badge
            variant={product.publishedAt ? 'secondary' : 'outline'}
            className="rounded-md"
          >
            {product.publishedAt ? 'Live' : 'Draft'}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge
            variant={product.isActive ? 'default' : 'outline'}
            className="rounded-md"
          >
            {product.isActive ? 'Active' : 'Draft'}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              asChild
            >
              <Link href={`/dashboard/products/${product.id}`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => handleDelete(product)}
              disabled={isDeleting}
              aria-label={`Delete ${product.nameEn}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your storefront inventory.
          </p>
        </div>
        <Button asChild className="rounded-xl shadow-lg gap-2">
          <Link href="/dashboard/products/new">
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-10 bg-muted/20 border-white/5 rounded-xl"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-muted/10 overflow-hidden backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[100px]">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-64 text-center text-muted-foreground italic"
                >
                  Loading products...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Package className="h-12 w-12 opacity-20" />
                    <p>No products found yet.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map(renderProductRow)
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
