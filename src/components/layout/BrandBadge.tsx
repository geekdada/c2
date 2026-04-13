type BrandBadgeProps = {
  size?: "sm" | "md" | "lg";
};

const sizeClasses: Record<NonNullable<BrandBadgeProps["size"]>, string> = {
  sm: "h-10 w-10 rounded-xl text-sm",
  md: "h-12 w-12 rounded-2xl text-base",
  lg: "h-14 w-14 rounded-[20px] text-lg",
};

export function BrandBadge({ size = "md" }: BrandBadgeProps) {
  return (
    <div
      aria-label="C2"
      className={`flex items-center justify-center border border-[var(--app-border-strong)] bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.03))] font-semibold tracking-[0.16em] text-[var(--app-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${sizeClasses[size]}`}
    >
      C2
    </div>
  );
}
