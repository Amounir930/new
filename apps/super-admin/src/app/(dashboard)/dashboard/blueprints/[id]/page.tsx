'use client';

import { use } from 'react';
import { BlueprintEditor } from '@/components/blueprint/BlueprintEditor';

export default function EditBlueprintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <div className="animate-in fade-in duration-500">
      <BlueprintEditor id={id} />
    </div>
  );
}
