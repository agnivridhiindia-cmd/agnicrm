import React from "react";
import ManagerRequests from "./ManagerRequests";

export default function ManagerRequestsPage({
  branchTeamNames = [],
  managedRegion = "East Zone",
  branchTeam = [],
  clients = [],
}) {
  return (
    <section style={{ animation: "fadeIn 0.25s ease-out" }}>
      <ManagerRequests
        branchTeamNames={branchTeamNames}
        managedRegion={managedRegion}
        branchTeam={branchTeam}
        clients={clients}
      />
    </section>
  );
}
