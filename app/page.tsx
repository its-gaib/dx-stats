import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardData } from "@/lib/data/metrics-service";

export default async function HomePage() {
  const data = await getDashboardData();
  return <DashboardView data={data} />;
}
