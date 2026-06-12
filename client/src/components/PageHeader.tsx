import { cn } from "@/lib/utils";
import { AlbaMark } from "@/components/AlbaLogo";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#E6DEE0] bg-gradient-to-l from-[#EEF2F0] to-white px-5 py-4 mb-6",
        className
      )}
    >
      {/* Subtle brand watermark */}
      <AlbaMark className="pointer-events-none absolute -top-4 end-4 h-24 w-auto text-primary/[0.06]" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
