'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getManagementKey, setManagementKey } from '@/lib/api';

export function TokenInput() {
  const [mKey, setMKey] = useState('');

  useEffect(() => {
    // S1: Forensic retrieval of current management key from storage
    const currentKey = getManagementKey();
    if (currentKey) setMKey(currentKey);
  }, []);

  const handleSave = () => {
    // S7: Sovereign Authorization Bridge
    // Persist the specific Super Admin key (Governance Bypass)
    setManagementKey(mKey);
    alert('Sovereign management key synchronized!');
    window.location.reload();
  };

  return (
    <div className="flex flex-col gap-2">
      <Input
        type="password"
        placeholder="Enter Super Admin Key"
        value={mKey}
        onChange={(e) => setMKey(e.target.value)}
        className="bg-slate-900 border-white/10 text-white placeholder:text-slate-600 focus:ring-indigo-500"
      />
      <Button
        onClick={handleSave}
        variant="outline"
        size="sm"
        className="w-full border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10"
      >
        Sync Sovereign Key
      </Button>
    </div>
  );
}
