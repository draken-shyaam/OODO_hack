import { cn } from '../../lib/utils';

interface AvatarProps {
  name: string;
  className?: string;
}

export function Avatar({ name, className }: AvatarProps) {
  const getInitials = (n: string) => {
    const parts = n.split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getBackgroundColor = (n: string) => {
    let hash = 0;
    for (let i = 0; i < n.length; i++) {
      hash = n.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 85%)`;
  };

  const getTextColor = (n: string) => {
    let hash = 0;
    for (let i = 0; i < n.length; i++) {
      hash = n.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 25%)`;
  };

  const bgColor = getBackgroundColor(name);
  const textColor = getTextColor(name);

  return (
    <div 
      className={cn(
        "flex items-center justify-center rounded-full font-medium shrink-0", 
        className || "w-8 h-8 text-sm"
      )}
      style={{ backgroundColor: bgColor, color: textColor }}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
