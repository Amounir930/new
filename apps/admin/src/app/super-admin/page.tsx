import { redirect } from 'next/navigation';

export default function SuperAdminPage() {
    // Redirect to blueprints list
    redirect('/super-admin/blueprints');
}
