export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  imageAlt: string;
  joinedAt: string;
  specialty: string;
  order: number;
};

export type TeamMemberDraft = Omit<TeamMember, "id"> & { id?: string };
