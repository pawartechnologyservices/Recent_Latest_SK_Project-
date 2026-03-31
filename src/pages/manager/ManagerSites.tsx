import { useOutletContext } from "react-router-dom";
import ManagerSitesComponent from "@/pages/manager/components/ManagerSites";
import { DashboardHeader } from "@/components/shared/DashboardHeader";

interface OutletContext {
  onMenuClick: () => void;
}

const ManagerSites = () => {
  const { onMenuClick } = useOutletContext<OutletContext>();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <DashboardHeader 
        title="My Assigned Sites" 
        subtitle="View and manage sites assigned to you. Take photos, add work queries, and submit visit reports for review."
        onMenuClick={onMenuClick}
      />
      
      <div className="p-4 sm:p-6">
        <ManagerSitesComponent />
      </div>
    </div>
  );
};

export default ManagerSites;