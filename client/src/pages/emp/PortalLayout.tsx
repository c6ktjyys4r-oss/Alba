import ERPLayout from "@/components/ERPLayout";

interface PortalLayoutProps {
  children: React.ReactNode;
}

// The employee self-service pages now render inside the single unified
// application shell. This thin wrapper keeps the existing per-page imports
// working while routing them through the one role-aware ERPLayout.
export default function PortalLayout({ children }: PortalLayoutProps) {
  return <ERPLayout>{children}</ERPLayout>;
}
