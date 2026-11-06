export type ContactType = "BUYER" | "INVESTOR" | "SELLER" | "TENANT";

export type ApiContact = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  type: ContactType;
  city: string;
  notes: string;
  createdAt: string;
  property?: string | null;
};

export const CONTACT_TYPES: ContactType[] = ["BUYER", "INVESTOR", "SELLER", "TENANT"];
export const CONTACT_LABEL: Record<ContactType, string> = { BUYER: "Buyer", INVESTOR: "Investor", SELLER: "Seller", TENANT: "Tenant" };