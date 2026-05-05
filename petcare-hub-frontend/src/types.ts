import { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  activeIcon?: LucideIcon;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Vet' | 'Rescuer' | 'Admin';
  status: 'Active' | 'Suspended';
  avatar: string;
  joinedDate: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  type?: 'text' | 'image' | 'profile' | 'location';
  metadata?: any;
}

export interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
    role?: string;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timeAgo: string;
  type: 'story' | 'tip' | 'alert' | 'update';
  category?: string;
}

export interface SafetyReport {
  id: string;
  type: 'Lost' | 'Found' | 'Sighting';
  status: 'Open' | 'Resolved' | 'In-Progress';
  title: string;
  location: string;
  image: string;
  urgent?: boolean;
  timeAgo: string;
}
