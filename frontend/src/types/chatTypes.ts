export interface ChatUser {
  id: string;
  username: string;
  avatar: string | null;
  is_online: boolean;
}

export interface Reaction {
  user: ChatUser;
  emoji: string;
}

export interface ReadReceipt {
  user: ChatUser;
  read_at: string;
}

export interface Message {
  id: string;
  room: string;
  sender: ChatUser;
  content: string;
  message_type: 'text' | 'image' | 'file';
  attachment: string | null;
  is_edited: boolean;
  created_at: string;
  reads: ReadReceipt[];
  reactions: Reaction[];
}

export interface Room {
  id: string;
  name: string | null;
  is_group: boolean;
  members: ChatUser[];
  last_message: Message | null;
  created_at: string;
  is_saved_messages: boolean,
  avatar_url: string,
}