interface ServiceCardProps {
  icon: string;
  title: string;
  description: string;
}

export function ServiceCard({ icon, title, description }: ServiceCardProps) {
  return (
    <div className="group relative bg-card border border-border rounded-xl p-6 shadow-soft transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-floating overflow-hidden">
      <span className="absolute left-0 top-0 h-full w-1 bg-primary -translate-x-full transition-transform duration-300 ease-out group-hover:translate-x-0" />
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-foreground/60">{description}</p>
    </div>
  );
}
