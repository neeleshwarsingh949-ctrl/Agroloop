export type CropType = "mustard" | "paddy" | "wheat";

export type ListingStatus = "AVAILABLE" | "CONFIRMED" | "CLAIMED";

export interface StubbleListing {
  id?: string;
  farmerName: string;
  phone: string;
  location: string;
  cropType: CropType;
  wasteKg: number;
  pricePerKg: number;
  status: ListingStatus;
  createdAt: number;
  utrNumber?: string;
  bookedByUid?: string;
  // Optional: flag for made products created from agricultural waste
  isMadeProduct?: boolean;
  productName?: string;
  // Transporter claim fields
  claimedByPhone?: string;
  claimedByUid?: string;
  claimedAt?: number;
  // Normalized phone and owner uid
  phoneNormalized?: string;
  ownerUid?: string;
}

export type UserRole = 'farmer' | 'transporter' | 'recycler';

export interface UserProfile {
  uid: string;
  name: string;
  phone?: string;
  role: UserRole;
  location?: string;
}