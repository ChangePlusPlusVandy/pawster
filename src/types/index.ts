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

export type CreatePlacementInput = {
  petId: string;
  fosterId: string;
  shelterluvPlacementId?: string | null;
  startDate: string;
  endDate?: string | null;
  status: string;
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

export type SupplyItem = {
  id: string;
  name: string;
  category: string;
  unitLabel: string;
  createdAt: string;
};

export type SupplyRequestStatus = "pending" | "fulfilled" | "cancelled";

export type FulfillmentMethod = "pickup" | "delivery";

export type SupplyRequestItem = {
  id: string;
  requestId: string;
  supplyItemId: string | null;
  customName: string | null;
  quantity: number;
  supplyItem?: Pick<SupplyItem, "id" | "name" | "category" | "unitLabel"> | null;
};

export type SupplyRequest = {
  id: string;
  checkInId: string;
  fosterId: string | null;
  placementId: string | null;
  status: SupplyRequestStatus;
  fulfillmentMethod: FulfillmentMethod;
  notesToStaff: string | null;
  fulfilledAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: SupplyRequestItem[];
};

export type WeeklyCheckIn = {
  id: string;
  fosterId: string | null;
  needsSupplies: boolean;
  comments: string | null;
  weekOf: string;
  createdAt: string;
};

export type CreatePetRequest = {
  shelterluvAnimalId?: string | null;
  name: string;
  species: string;
  breed?: string | null;
  photoUrl?: string | null;
  status: string;
};

export type GetPetsResponse = {
  data: Pet[];
};

export type CreatePetResponse = {
  data: Pet;
};
