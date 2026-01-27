import type { JSX } from "solid-js";
import "./DashboardShell.css";

interface DashboardShellProps {
  children: JSX.Element;
}

export function DashboardShell(props: DashboardShellProps) {
  return (
    <div class="dashboard-shell">
      <div class="dashboard-content">
        {props.children}
      </div>
    </div>
  );
}
