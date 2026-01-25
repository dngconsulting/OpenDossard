import { Building2 } from 'lucide-react';

import Layout from '@/components/layout/Layout.tsx';

export default function ClubsPage() {
  return (
    <Layout title="Clubs">
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Building2 className="size-16 mb-4 opacity-20" />
        <p>Page en construction</p>
      </div>
    </Layout>
  );
}
