import { BlueprintList } from '@/components/blueprint/BlueprintList';

export default function BlueprintsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Blueprints</h2>
          <p className="text-muted-foreground">
            Manage onboarding templates for new tenants.
          </p>
        </div>
      </div>
      <BlueprintList />
    </div>
  );
}
