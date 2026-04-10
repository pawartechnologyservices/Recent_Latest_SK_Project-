// src/superadmin/SuperAdminReports.tsx
import { useOutletContext } from "react-router-dom";
import SuperAdminReportsComponent from "../superadmin/components/SuperAdminReports";
import { DashboardHeader } from "@/components/shared/DashboardHeader";

interface OutletContext {
  onMenuClick: () => void;
}

const SuperAdminReports = () => {
  // Use try-catch or check if context exists
  let onMenuClick = () => {};
  try {
    const context = useOutletContext<OutletContext>();
    onMenuClick = context?.onMenuClick || (() => {});
  } catch (error) {
    console.warn("Outlet context not available");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <DashboardHeader 
        title="Site Visit Reports" 
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