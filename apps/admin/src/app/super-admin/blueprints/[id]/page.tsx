import { BlueprintEditor } from '@/components/blueprint/BlueprintEditor';

export default async function EditBlueprintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BlueprintEditor id={id} />;
}
