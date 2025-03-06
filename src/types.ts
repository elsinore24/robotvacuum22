export interface RobotVacuum {
  id: string;
  // Basic Information
  brand: string;
  model_number: string;
  title: string;
  description?: string;
  price: number;
  reviews: number;
  image_url?: string;
  deal_url: string;
  
  // Technical Specifications
  suction_power?: number;
  battery_minutes?: number;
  navigation_type?: string;
  noise_level?: number;
  
  // Core Features
  self_empty: boolean;
  mopping: boolean;
  hepa_filter: boolean;
  edge_cleaning: boolean;
  side_brush: boolean;
  dual_brush: boolean;
  tangle_free: boolean;
  
  // Smart Features
  wifi: boolean;
  app_control: boolean;
  voice_control: boolean;
  scheduling: boolean;
  zone_cleaning: boolean;
  spot_cleaning: boolean;
  no_go_zones: boolean;
  auto_boost: boolean;
  
  // Advanced Features
  object_recognition: boolean;
  furniture_recognition: boolean;
  pet_recognition: boolean;
  three_d_mapping: boolean;
  obstacle_avoidance: boolean;
  uv_sterilization: boolean;
  
  // Maintenance Features
  maintenance_reminder: boolean;
  filter_replacement_indicator: boolean;
  brush_cleaning_indicator: boolean;
  large_dustbin: boolean;
  auto_empty_base: boolean;
  washable_dustbin: boolean;
  washable_filter: boolean;
  easy_brush_removal: boolean;
  self_cleaning_brushroll: boolean;
  dustbin_full_indicator: boolean;
  
  // Scores
  cleaning_score?: number;
  navigation_score?: number;
  smart_score?: number;
  maintenance_score?: number;
  battery_score?: number;
  pet_family_score?: number;
  review_score?: number;
  cleaniq_score?: number;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
}

export interface CSVRow {
  brand: string;
  model_number: string;
  title: string;
  description?: string;
  price: string;
  reviews: string;
  imageUrl: string;
  dealUrl: string;
  suction_power?: string;
  battery_minutes?: string;
  navigation_type?: string;
  noise_level?: string;
  self_empty?: string;
  mopping?: string;
  hepa_filter?: string;
  edge_cleaning?: string;
  side_brush?: string;
  dual_brush?: string;
  tangle_free?: string;
  wifi?: string;
  app_control?: string;
  voice_control?: string;
  scheduling?: string;
  zone_cleaning?: string;
  spot_cleaning?: string;
  no_go_zones?: string;
  auto_boost?: string;
  object_recognition?: string;
  furniture_recognition?: string;
  pet_recognition?: string;
  three_d_mapping?: string;
  obstacle_avoidance?: string;
  uv_sterilization?: string;
  maintenance_reminder?: string;
  filter_replacement_indicator?: string;
  brush_cleaning_indicator?: string;
  large_dustbin?: string;
  auto_empty_base?: string;
  washable_dustbin?: string;
  washable_filter?: string;
  easy_brush_removal?: string;
  self_cleaning_brushroll?: string;
  dustbin_full_indicator?: string;
  cleaning_score?: string;
  navigation_score?: string;
  smart_score?: string;
  maintenance_score?: string;
  battery_score?: string;
  pet_family_score?: string;
  review_score?: string;
  cleaniq_score?: string;
}

export interface RobotVacuumUpload {
  brand: string;
  model_number: string;
  title: string;
  description?: string;
  price: number;
  reviews: number;
  image_url?: string;
  deal_url: string;
  suction_power?: number;
  battery_minutes?: number;
  navigation_type?: string;
  noise_level?: number;
  self_empty: boolean;
  mopping: boolean;
  hepa_filter: boolean;
  edge_cleaning: boolean;
  side_brush: boolean;
  dual_brush: boolean;
  tangle_free: boolean;
  wifi: boolean;
  app_control: boolean;
  voice_control: boolean;
  scheduling: boolean;
  zone_cleaning: boolean;
  spot_cleaning: boolean;
  no_go_zones: boolean;
  auto_boost: boolean;
  object_recognition: boolean;
  furniture_recognition: boolean;
  pet_recognition: boolean;
  three_d_mapping: boolean;
  obstacle_avoidance: boolean;
  uv_sterilization: boolean;
  maintenance_reminder: boolean;
  filter_replacement_indicator: boolean;
  brush_cleaning_indicator: boolean;
  large_dustbin: boolean;
  auto_empty_base: boolean;
  washable_dustbin: boolean;
  washable_filter: boolean;
  easy_brush_removal: boolean;
  self_cleaning_brushroll: boolean;
  dustbin_full_indicator: boolean;
  cleaning_score?: number;
  navigation_score?: number;
  smart_score?: number;
  maintenance_score?: number;
  battery_score?: number;
  pet_family_score?: number;
  review_score?: number;
  cleaniq_score?: number;
}

export type SortOption = 'price' | 'cleaniq_score' | 'review_score' | 'suction_power';
export type SortDirection = 'asc' | 'desc';

declare global {
  interface Window {
    gtag_report_conversion?: (url?: string) => boolean | void;
  }
}
