import { getActivity, getDashboard } from "@/features/dashboard";
import DashboardView from "./DashboardView";
import { getServerPageData, serverApi } from "@/shared/api/server";

export default async function DashboardPage() {
  const [dashboard, activity] = await Promise.all([
    getServerPageData(getDashboard(serverApi)),
    getServerPageData(getActivity(serverApi)),
  ]);
  return (
    <DashboardView
      initialDashboard={dashboard}
      initialActivity={activity}
    />
  );
}
