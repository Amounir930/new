import Link from "next/link";

interface Blueprint {
    id: string;
    name: string;
    plan: string;
    isDefault: string; // Stored as string 'true'/'false' in DB based on Schema
    createdAt: string;
}

async function getBlueprints(): Promise<Blueprint[]> {
    // In a real app, use fetch with proper auth headers or server actions
    // For now, mocking or assuming internal API access
    // This is a server component, so we can fetch directly if we had the service, 
    // but better to go through API for consistency with RBAC
    return [];
}

export default async function BlueprintsPage() {
    const blueprints = await getBlueprints();

    return (
        <div className="p-8">
            <div className="flex justifying-between items-center mb-6">
                <h1 className="text-3xl font-bold">Onboarding Blueprints</h1>
                <Link
                    href="/super-admin/blueprints/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Create New
                </Link>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {blueprints.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                    No blueprints found. Create one to get started.
                                </td>
                            </tr>
                        ) : (
                            blueprints.map((bp) => (
                                <tr key={bp.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{bp.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap uppercase text-sm">{bp.plan}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {bp.isDefault === 'true' ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Default
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(bp.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link href={`/super-admin/blueprints/${bp.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
