import { useOutletContext } from "react-router-dom";
import SuperAdminReportsComponent from "../superadmin/SuperAdminReports";
import { DashboardHeader } from "@/components/shared/DashboardHeader";

interface OutletContext {
  onMenuClick: () => void;
}

const SuperAdminReports = () => {
  const { onMenuClick } = useOutletContext<OutletContext>();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <DashboardHeader 
        title="Super Admin Reports" 
        subtitle="Comprehensive analytics for site visits, manager performance, and site popularity"
        onMenuClick={onMenuClick}
      />
      
      <div className="p-3 md:p-6">
        <SuperAdminReportsComponent />
      </div>
    </div>
  );
};

export default SuperAdminReports;