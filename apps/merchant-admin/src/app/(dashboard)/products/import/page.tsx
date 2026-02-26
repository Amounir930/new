import BulkImportUI from '@/components/products/BulkImportUI';

export default function ImportPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto py-12">
        <header className="mb-8 px-6">
          <h1 className="text-3xl font-black text-slate-900">
            Inventory Management
          </h1>
          <p className="text-slate-500">
            Bulk operations and inventory synchronization.
          </p>
        </header>

        <BulkImportUI />
      </div>
    </main>
  );
}
