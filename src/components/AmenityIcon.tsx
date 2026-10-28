import {
  Car,
  ChefHat,
  Coffee,
  Dumbbell,
  Flame,
  Laptop,
  PawPrint,
  Shirt,
  Sun,
  Trees,
  Tv,
  Utensils,
  Waves,
  Wifi,
  Wind,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  wifi: Wifi,
  kitchen: ChefHat,
  pool: Waves,
  parking: Car,
  ac: Wind,
  heating: Flame,
  washer: Shirt,
  tv: Tv,
  workspace: Laptop,
  fireplace: Flame,
  pets: PawPrint,
  breakfast: Coffee,
  gym: Dumbbell,
  seaview: Sun,
  garden: Trees,
  bbq: Utensils,
  hottub: Waves,
};

export function AmenityIcon({
  name,
  size = 20,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Wifi;
  return <Icon size={size} strokeWidth={1.6} className={className} aria-hidden="true" />;
}
