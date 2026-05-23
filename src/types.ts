export interface UserProfile {
  id: string; // auth uid
  email: string;
  displayName: string;
  photoURL: string;
  isOfficer: boolean;
  canManageNotice?: boolean;
  canManageResource?: boolean;
  canManageCalendar?: boolean;
  canManageExecutive?: boolean;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  createdAt: any; // Firestore Timestamp
  hasPoll: boolean;
  pollQuestion?: string;
  pollOptions?: string[];
}

export interface Comment {
  id: string;
  noticeId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  createdAt: any; // Firestore Timestamp
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  link?: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  createdAt: any; // Firestore Timestamp
}

export interface Schedule {
  id: string;
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  color: string;
  authorId: string;
  createdAt: any; // Firestore Timestamp
}

export interface Executive {
  id: string;
  name: string;
  role: string;
  description: string;
  photoUrl: string;
  userId?: string; // Optional reference to sign up user
  createdAt: any; // Firestore Timestamp
}
