// src/pages/manager/ManagerSites.tsx
import ManagerSitesComponent from "@/pages/manager/components/ManagerSites";

const ManagerSites = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Assigned Sites</h1>
        <p className="text-muted-foreground mt-1">
          View and manage sites assigned to you. Take photos, add work queries, and submit visit reports for review.
        </p>
      </div>
      
      <ManagerSitesComponent />
    </div>
  );
};

export default ManagerSites;