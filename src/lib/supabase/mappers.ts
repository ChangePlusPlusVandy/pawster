import type { Pet, Placement, Profile, WeeklyUpdate } from "@/types";

// Row shapes as returned by Supabase (snake_case columns).

export type ProfileRow = {
  id: string;
  auth_user_id: string | null;
  shelterluv_person_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

export type PetRow = {
  id: string;
  shelterluv_animal_id: string | null;
  name: string;
  species: string;
  breed: string | null;
  photo_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type PlacementRow = {
  id: string;
  pet_id: string;
  foster_id: string;
  shelterluv_placement_id: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type WeeklyUpdateRow = {
  id: string;
  placement_id: string;
  submitted_by: string;
  notes: string;
  behavior_concerns: string | null;
  medical_concerns: string | null;
  needs_supplies: boolean;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

export function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    shelterluvPersonId: row.shelterluv_person_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPet(row: PetRow): Pet {
  return {
    id: row.id,
    shelterluvAnimalId: row.shelterluv_animal_id,
    name: row.name,
    species: row.species,
    breed: row.breed,
    photoUrl: row.photo_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPlacement(row: PlacementRow): Placement {
  return {
    id: row.id,
    petId: row.pet_id,
    fosterId: row.foster_id,
    shelterluvPlacementId: row.shelterluv_placement_id,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapWeeklyUpdate(row: WeeklyUpdateRow): WeeklyUpdate {
  return {
    id: row.id,
    placementId: row.placement_id,
    submittedBy: row.submitted_by,
    notes: row.notes,
    behaviorConcerns: row.behavior_concerns,
    medicalConcerns: row.medical_concerns,
    needsSupplies: row.needs_supplies,
    status: row.status,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
  };
}
