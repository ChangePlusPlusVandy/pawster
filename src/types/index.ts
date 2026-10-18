export type Profile = {
  id: string;
  authUserId: string | null;
  shelterluvPersonId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
};

export type Pet = {
  id: string;
  shelterluvAnimalId: string | null;
  name: string;
  species: string;
  breed: string | null;
  photoUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type Placement = {
  id: string;
  petId: string;
  fosterId: string;
  shelterluvPlacementId: string | null;
  startDate: string;
  endDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type WeeklyUpdate = {
  id: string;
  placementId: string;
  submittedBy: string;
  notes: string;
  behaviorConcerns: string | null;
  medicalConcerns: string | null;
  needsSupplies: boolean;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
};

export type WeeklyUpdatePhoto = {
  id: string;
  weeklyUpdateId: string;
  storagePath: string;
  status: string;
  createdAt: string;
};

export type ProfileRole = "foster" | "staff" | "admin";

// Request bodies

export type CreatePetRequest = {
  name: string;
  species: string;
  breed?: string | null;
  photoUrl?: string | null;
  status?: string;
  shelterluvAnimalId?: string | null;
};

export type CreatePlacementRequest = {
  petId: string;
  fosterId: string;
  startDate: string;
  endDate?: string | null;
  status?: string;
  shelterluvPlacementId?: string | null;
};

export type CreateWeeklyUpdateRequest = {
  placementId: string;
  notes: string;
  behaviorConcerns?: string | null;
  medicalConcerns?: string | null;
  needsSupplies?: boolean;
};

// Response bodies

export type ApiSuccessResponse<T> = {
  data: T;
};

export type ApiErrorResponse = {
  error: {
    message: string;
    details?: Record<string, string[]>;
  };
};

export type GetPetsResponse = ApiSuccessResponse<Pet[]>;
export type CreatePetResponse = ApiSuccessResponse<Pet>;
export type GetActivePlacementsResponse = ApiSuccessResponse<Placement[]>;
export type CreatePlacementResponse = ApiSuccessResponse<Placement>;
export type GetWeeklyUpdatesResponse = ApiSuccessResponse<WeeklyUpdate[]>;
export type CreateWeeklyUpdateResponse = ApiSuccessResponse<WeeklyUpdate>;
