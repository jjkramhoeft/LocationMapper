import {
  Anchor, Baby, Beer, Bike, BookOpen, Briefcase, Building, Building2, Camera, Car, Castle, Church,
  Coffee, Compass, Dog, Dumbbell, Flag, Gem, GraduationCap, Heart, Hospital, Hotel, House, Landmark,
  MapPin, Mountain, MountainSnow, Music, Plane, Sailboat, School, Ship, ShoppingBag, Star, Sun, Tent,
  Ticket, TrainFront, TreePalm, TreePine, Trophy, Umbrella, User, Users, Utensils, Waves, Wine,
  type LucideIcon,
} from 'lucide-react'
import type { IconName } from '../domain/icons'

export const ICON_COMPONENTS: Record<IconName, LucideIcon> = {
  'map-pin': MapPin, house: House, building: Building, 'building-2': Building2, hotel: Hotel, tent: Tent,
  plane: Plane, 'train-front': TrainFront, car: Car, ship: Ship, sailboat: Sailboat, bike: Bike,
  mountain: Mountain, 'mountain-snow': MountainSnow, 'tree-pine': TreePine, 'tree-palm': TreePalm,
  waves: Waves, sun: Sun, umbrella: Umbrella,
  briefcase: Briefcase, 'graduation-cap': GraduationCap, school: School, landmark: Landmark,
  church: Church, castle: Castle, hospital: Hospital,
  users: Users, user: User, heart: Heart, baby: Baby, dog: Dog,
  star: Star, flag: Flag, camera: Camera, compass: Compass, anchor: Anchor, gem: Gem, trophy: Trophy,
  utensils: Utensils, coffee: Coffee, wine: Wine, beer: Beer, music: Music, ticket: Ticket,
  'shopping-bag': ShoppingBag, dumbbell: Dumbbell, 'book-open': BookOpen,
}
