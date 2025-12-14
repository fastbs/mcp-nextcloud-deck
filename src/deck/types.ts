/**
 * Nextcloud Deck API Types
 * Based on Deck v1.14.7 API
 */

// ===== Entity Types =====

export type DeckEntity =
  | 'board' | 'boards'
  | 'stack' | 'stacks'
  | 'card' | 'cards'
  | 'label' | 'labels'
  | 'comment' | 'comments'
  | 'attachment' | 'attachments';

export type DeckAction =
  | 'move'
  | 'assign'
  | 'unassign'
  | 'add_label'
  | 'remove_label'
  | 'archive'
  | 'unarchive'
  | 'reorder'
  | 'mark_done'
  | 'mark_undone';

// ===== Board =====

export interface DeckBoard {
  id: number;
  title: string;
  owner: DeckUser;
  color: string;
  archived: boolean;
  labels: DeckLabel[];
  acl: DeckAcl[];
  permissions: DeckPermissions;
  users: DeckUser[];
  deletedAt: number;
  lastModified: number;
}

export interface CreateBoardData {
  title: string;
  color?: string;
}

export interface UpdateBoardData {
  title?: string;
  color?: string;
  archived?: boolean;
}

// ===== Stack =====

export interface DeckStack {
  id: number;
  title: string;
  boardId: number;
  deletedAt: number;
  lastModified: number;
  cards: DeckCard[];
  order: number;
  ETag: string;
}

export interface CreateStackData {
  title: string;
  boardId: number;
  order?: number;
}

export interface UpdateStackData {
  title?: string;
  order?: number;
}

// ===== Card =====

export interface DeckCard {
  id: number;
  title: string;
  description: string;
  stackId: number;
  type: string;
  lastModified: number;
  createdAt: number;
  labels: DeckLabel[];
  assignedUsers: DeckUser[];
  attachments: DeckAttachment[];
  attachmentCount: number;
  owner: DeckUser;
  order: number;
  archived: boolean;
  done: boolean | null;
  duedate: string | null;
  deletedAt: number;
  commentsUnread: number;
  commentsCount: number;
  ETag: string;
}

export interface CreateCardData {
  title: string;
  stackId: number;
  boardId?: number; // Optional: will be auto-detected if not provided
  type?: string;
  order?: number;
  description?: string;
  duedate?: string;
}

export interface UpdateCardData {
  cardId: number;
  boardId?: number; // Optional: will be auto-detected if not provided
  stackId?: number;
  title?: string;
  type?: string;
  owner?: string;
  description?: string;
  order?: number;
  duedate?: string;
  done?: boolean;
  archived?: boolean;
}

// ===== Label =====

export interface DeckLabel {
  id: number;
  title: string;
  color: string;
  boardId: number;
  cardId?: number;
  lastModified: number;
  ETag: string;
}

export interface CreateLabelData {
  title: string;
  color: string;
  boardId: number;
}

export interface UpdateLabelData {
  title?: string;
  color?: string;
}

// ===== Comment =====

export interface DeckComment {
  id: number;
  objectId: number;
  message: string;
  actorId: string;
  actorType: string;
  actorDisplayName: string;
  creationDateTime: string;
  mentions: any[];
  reactionsSummary: any[];
}

export interface CreateCommentData {
  cardId: number;
  message: string;
}

// ===== Attachment =====

export interface DeckAttachment {
  id: number;
  cardId: number;
  type: string;
  data: string;
  lastModified: number;
  createdAt: number;
  createdBy: string;
  deletedAt: number;
  extendedData: any;
}

export interface CreateAttachmentData {
  cardId: number;
  type: 'deck_file' | 'file';
  data: string;
}

// ===== User & Permissions =====

export interface DeckUser {
  primaryKey: string;
  uid: string;
  displayname: string;
  type: number;
}

export interface DeckAcl {
  id: number;
  participant: DeckUser;
  type: number;
  boardId: number;
  permissionEdit: boolean;
  permissionShare: boolean;
  permissionManage: boolean;
  owner: boolean;
}

export interface DeckPermissions {
  PERMISSION_READ: boolean;
  PERMISSION_EDIT: boolean;
  PERMISSION_MANAGE: boolean;
  PERMISSION_SHARE: boolean;
}

// ===== Actions =====

export interface MoveCardParams {
  stackId: number;
  order?: number;
}

export interface AssignUserParams {
  userId: string;
}

export interface LabelActionParams {
  labelId: number;
}

export interface ReorderParams {
  order: number;
  stackId?: number;
}

export type ActionParams =
  | MoveCardParams
  | AssignUserParams
  | LabelActionParams
  | ReorderParams
  | Record<string, never>;

// ===== API Response =====

export interface DeckApiResponse<T> {
  data: T;
  status: number;
}

export interface DeckErrorResponse {
  error: string;
  message: string;
  status: number;
}

// ===== Filter/Query Params =====

export interface ReadBoardsParams {
  archived?: boolean;
}

export interface ReadStacksParams {
  boardId: number;
}

export interface ReadCardsParams {
  stackId?: number;
  boardId?: number;
  search?: string;
  archived?: boolean;
  done?: boolean;
}

export interface ReadCommentsParams {
  cardId: number;
}

export interface ReadAttachmentsParams {
  cardId: number;
}

export type ReadParams =
  | { id: number }
  | ReadBoardsParams
  | ReadStacksParams
  | ReadCardsParams
  | ReadCommentsParams
  | ReadAttachmentsParams
  | Record<string, never>;
