import { cn } from "@/utils";

interface ComponentCardProps {
  title: string;
  children: React.ReactNode;
  className?: string; // Additional custom classes for styling
  desc?: string; // Description text
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className,
  desc = "",
}) => {
  return (
    <div className={cn("rounded-2xl border border-line bg-surface", className)}>
      {/* Card Header */}
      <div className="px-6 py-5">
        <h3 className="text-base font-medium text-fg">{title}</h3>
        {desc && <p className="mt-1 text-sm text-fg-muted">{desc}</p>}
      </div>

      {/* Card Body */}
      <div className="border-t border-line-subtle p-4 sm:p-6">
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
};

export default ComponentCard;
