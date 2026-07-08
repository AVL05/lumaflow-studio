export function Button({ variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-stone-100 text-stone-950 hover:bg-white",
    secondary:
      "border border-white/10 bg-white/[0.04] text-stone-100 hover:bg-white/[0.08]",
    ghost: "text-stone-400 hover:bg-white/[0.06] hover:text-stone-100",
    danger:
      "border border-red-400/20 bg-red-500/10 text-red-100 hover:bg-red-500/20",
  };

  return (
    <button
      className={`rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
