import {AdminEventDetailClient} from "@/components/admin/admin-event-detail-client";

export default async function AdminEventDetailPage({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  return <AdminEventDetailClient id={id} />;
}
