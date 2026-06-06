export interface BodyMeasurement {
  id: number;
  measured_at: string;
  weight: number | null;
  bicep_left: number | null;
  bicep_right: number | null;
  shoulders: number | null;
  chest: number | null;
  waist: number | null;
  glutes: number | null;
  hips_left: number | null;
  hips_right: number | null;
  calves_left: number | null;
  calves_right: number | null;
  notes: string | null;
}

export interface MeasurementIn {
  measured_at: string;
  weight?: number | null;
  bicep_left?: number | null;
  bicep_right?: number | null;
  shoulders?: number | null;
  chest?: number | null;
  waist?: number | null;
  glutes?: number | null;
  hips_left?: number | null;
  hips_right?: number | null;
  calves_left?: number | null;
  calves_right?: number | null;
  notes?: string | null;
}
