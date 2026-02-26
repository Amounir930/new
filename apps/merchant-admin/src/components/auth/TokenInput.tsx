'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAuthToken, setAuthToken } from '@/lib/api';

export function TokenInput() {
  const [token, setToken] = useState('');

  useEffect(() => {
    const t = getAuthToken();
    if (t) setToken(t);
  }, []);

  const handleSave = () => {
    setAuthToken(token);
    alert('Token saved!');
    window.location.reload();
  };

  return (
    <div className="flex gap-2 items-center">
      <Input
        type="password"
        placeholder="Enter auth code"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        className="max-w-xs"
      />
      <Button onClick={handleSave} variant="outline" size="sm">
        Save Token
      </Button>
    </div>
  );
}
