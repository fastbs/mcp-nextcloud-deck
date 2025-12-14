/**
 * Nextcloud Deck API Client
 * Implements CRUD operations for Deck entities
 */

import type {
  DeckBoard,
  DeckStack,
  DeckCard,
  DeckLabel,
  DeckComment,
  DeckAttachment,
  CreateBoardData,
  CreateStackData,
  CreateCardData,
  CreateLabelData,
  CreateCommentData,
  CreateAttachmentData,
  UpdateBoardData,
  UpdateStackData,
  UpdateCardData,
  UpdateLabelData,
  DeckAction,
  ActionParams,
} from './types.js';

export interface DeckClientConfig {
  baseUrl: string;
  username: string;
  password: string;
}

export class DeckClient {
  private baseUrl: string;
  private auth: string;

  constructor(config: DeckClientConfig) {
    // Remove trailing slash from baseUrl
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    // Create Basic Auth header
    this.auth = 'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64');
  }

  /**
   * Generic HTTP request method
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}/index.php/apps/deck/api/v1.0${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        'Authorization': this.auth,
        'Content-Type': 'application/json',
        'OCS-APIRequest': 'true',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Deck API Error (${response.status}): ${error}`);
    }

    return await response.json() as T;
  }

  // ===== BOARD OPERATIONS =====

  async getBoards(): Promise<DeckBoard[]> {
    return this.request<DeckBoard[]>('GET', '/boards');
  }

  async getBoard(id: number): Promise<DeckBoard> {
    return this.request<DeckBoard>('GET', `/boards/${id}`);
  }

  async createBoard(data: CreateBoardData): Promise<DeckBoard> {
    return this.request<DeckBoard>('POST', '/boards', data);
  }

  async updateBoard(id: number, data: UpdateBoardData): Promise<DeckBoard> {
    return this.request<DeckBoard>('PUT', `/boards/${id}`, data);
  }

  async deleteBoard(id: number): Promise<void> {
    await this.request<void>('DELETE', `/boards/${id}`);
  }

  // ===== STACK OPERATIONS =====

  async getStacks(boardId: number): Promise<DeckStack[]> {
    return this.request<DeckStack[]>('GET', `/boards/${boardId}/stacks`);
  }

  async getStack(boardId: number, stackId: number): Promise<DeckStack> {
    const stacks = await this.getStacks(boardId);
    const stack = stacks.find(s => s.id === stackId);
    if (!stack) {
      throw new Error(`Stack ${stackId} not found in board ${boardId}`);
    }
    return stack;
  }

  async createStack(data: CreateStackData): Promise<DeckStack> {
    return this.request<DeckStack>('POST', `/boards/${data.boardId}/stacks`, {
      title: data.title,
      order: data.order ?? 999,
    });
  }

  async updateStack(boardId: number, stackId: number, data: UpdateStackData): Promise<DeckStack> {
    return this.request<DeckStack>('PUT', `/boards/${boardId}/stacks/${stackId}`, data);
  }

  async deleteStack(boardId: number, stackId: number): Promise<void> {
    await this.request<void>('DELETE', `/boards/${boardId}/stacks/${stackId}`);
  }

  // ===== CARD OPERATIONS =====

  async getCards(stackId: number): Promise<DeckCard[]> {
    // Note: Deck API returns cards within stack
    const response = await this.request<DeckStack>('GET', `/stacks/${stackId}`);
    return response.cards || [];
  }

  async getCard(cardId: number): Promise<DeckCard> {
    return this.request<DeckCard>('GET', `/cards/${cardId}`);
  }

  async createCard(data: CreateCardData): Promise<DeckCard> {
    // Deck API requires boardId for card creation
    // POST /boards/{boardId}/stacks/{stackId}/cards

    let boardId = data.boardId;

    // If boardId not provided, find it by iterating through boards
    if (!boardId) {
      const boards = await this.getBoards();
      for (const board of boards) {
        const stacks = await this.getStacks(board.id);
        const stack = stacks.find(s => s.id === data.stackId);
        if (stack) {
          boardId = board.id;
          break;
        }
      }

      if (!boardId) {
        throw new Error(`Stack ${data.stackId} not found in any board`);
      }
    }

    return this.request<DeckCard>('POST', `/boards/${boardId}/stacks/${data.stackId}/cards`, {
      title: data.title,
      type: data.type ?? 'plain',
      order: data.order ?? 999,
      description: data.description ?? '',
      duedate: data.duedate ?? null,
    });
  }

  async updateCard(data: UpdateCardData): Promise<DeckCard> {
    // Get current card to determine boardId and stackId if not provided
    let boardId = data.boardId;
    let stackId = data.stackId;

    if (!boardId || !stackId) {
      // Need to find card first
      const boards = await this.getBoards();
      for (const board of boards) {
        const stacks = await this.getStacks(board.id);
        for (const stack of stacks) {
          if (stack.cards) {
            const card = stack.cards.find(c => c.id === data.cardId);
            if (card) {
              boardId = board.id;
              stackId = stack.id;
              break;
            }
          }
        }
        if (boardId && stackId) break;
      }

      if (!boardId || !stackId) {
        throw new Error(`Card ${data.cardId} not found in any board`);
      }
    }

    // Remove cardId, boardId from request body (they're in URL)
    const { cardId, boardId: _, ...updateData } = data;

    return this.request<DeckCard>('PUT', `/boards/${boardId}/stacks/${stackId}/cards/${cardId}`, updateData);
  }

  async deleteCard(cardId: number, boardId?: number, stackId?: number): Promise<void> {
    // Auto-detect boardId and stackId if not provided
    if (!boardId || !stackId) {
      const boards = await this.getBoards();
      for (const board of boards) {
        const stacks = await this.getStacks(board.id);
        for (const stack of stacks) {
          if (stack.cards) {
            const card = stack.cards.find(c => c.id === cardId);
            if (card) {
              boardId = board.id;
              stackId = stack.id;
              break;
            }
          }
        }
        if (boardId && stackId) break;
      }

      if (!boardId || !stackId) {
        throw new Error(`Card ${cardId} not found in any board`);
      }
    }

    await this.request<void>('DELETE', `/boards/${boardId}/stacks/${stackId}/cards/${cardId}`);
  }

  // ===== LABEL OPERATIONS =====

  async getLabels(boardId: number): Promise<DeckLabel[]> {
    const board = await this.getBoard(boardId);
    return board.labels || [];
  }

  async createLabel(data: CreateLabelData): Promise<DeckLabel> {
    return this.request<DeckLabel>('POST', `/boards/${data.boardId}/labels`, {
      title: data.title,
      color: data.color,
    });
  }

  async updateLabel(boardId: number, labelId: number, data: UpdateLabelData): Promise<DeckLabel> {
    return this.request<DeckLabel>('PUT', `/boards/${boardId}/labels/${labelId}`, data);
  }

  async deleteLabel(boardId: number, labelId: number): Promise<void> {
    await this.request<void>('DELETE', `/boards/${boardId}/labels/${labelId}`);
  }

  // ===== COMMENT OPERATIONS =====

  async getComments(cardId: number): Promise<DeckComment[]> {
    // Nextcloud uses Comments API (not Deck-specific)
    const url = `${this.baseUrl}/index.php/apps/deck/cards/${cardId}/comments`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': this.auth,
        'OCS-APIRequest': 'true',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get comments: ${response.status}`);
    }

    const data: any = await response.json();
    return data.ocs?.data || [];
  }

  async createComment(data: CreateCommentData): Promise<DeckComment> {
    const url = `${this.baseUrl}/index.php/apps/deck/cards/${data.cardId}/comments`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': this.auth,
        'Content-Type': 'application/json',
        'OCS-APIRequest': 'true',
      },
      body: JSON.stringify({ message: data.message }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create comment: ${response.status}`);
    }

    const result: any = await response.json();
    return result.ocs?.data;
  }

  async deleteComment(cardId: number, commentId: number): Promise<void> {
    const url = `${this.baseUrl}/index.php/apps/deck/cards/${cardId}/comments/${commentId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': this.auth,
        'OCS-APIRequest': 'true',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete comment: ${response.status}`);
    }
  }

  // ===== ATTACHMENT OPERATIONS =====

  async getAttachments(cardId: number): Promise<DeckAttachment[]> {
    return this.request<DeckAttachment[]>('GET', `/cards/${cardId}/attachments`);
  }

  async createAttachment(data: CreateAttachmentData): Promise<DeckAttachment> {
    return this.request<DeckAttachment>('POST', `/cards/${data.cardId}/attachments`, {
      type: data.type,
      data: data.data,
    });
  }

  async deleteAttachment(cardId: number, attachmentId: number): Promise<void> {
    await this.request<void>('DELETE', `/cards/${cardId}/attachments/${attachmentId}`);
  }

  // ===== CARD ACTIONS =====

  async moveCard(cardId: number, stackId: number, order?: number): Promise<DeckCard> {
    return this.request<DeckCard>('PUT', `/cards/${cardId}/reorder`, {
      stackId,
      order: order ?? 999,
    });
  }

  async assignUser(cardId: number, userId: string): Promise<void> {
    await this.request<void>('PUT', `/cards/${cardId}/assignUser`, {
      userId,
    });
  }

  async unassignUser(cardId: number, userId: string): Promise<void> {
    await this.request<void>('PUT', `/cards/${cardId}/unassignUser`, {
      userId,
    });
  }

  async assignLabel(cardId: number, labelId: number): Promise<void> {
    await this.request<void>('PUT', `/cards/${cardId}/labels/${labelId}`);
  }

  async removeLabel(cardId: number, labelId: number): Promise<void> {
    await this.request<void>('DELETE', `/cards/${cardId}/labels/${labelId}`);
  }

  async archiveCard(cardId: number): Promise<DeckCard> {
    return this.updateCard({ cardId, archived: true });
  }

  async unarchiveCard(cardId: number): Promise<DeckCard> {
    return this.updateCard({ cardId, archived: false });
  }

  async markCardDone(cardId: number): Promise<DeckCard> {
    return this.updateCard({ cardId, done: true });
  }

  async markCardUndone(cardId: number): Promise<DeckCard> {
    return this.updateCard({ cardId, done: false });
  }

  async reorderCard(cardId: number, stackId: number, order: number): Promise<DeckCard> {
    return this.moveCard(cardId, stackId, order);
  }

  // ===== ACTION DISPATCHER =====

  async performAction(
    entity: 'card' | 'stack',
    id: number,
    action: DeckAction,
    params: ActionParams
  ): Promise<any> {
    if (entity === 'card') {
      switch (action) {
        case 'move':
          return this.moveCard(id, (params as any).stackId, (params as any).order);
        case 'assign':
          return this.assignUser(id, (params as any).userId);
        case 'unassign':
          return this.unassignUser(id, (params as any).userId);
        case 'add_label':
          return this.assignLabel(id, (params as any).labelId);
        case 'remove_label':
          return this.removeLabel(id, (params as any).labelId);
        case 'archive':
          return this.archiveCard(id);
        case 'unarchive':
          return this.unarchiveCard(id);
        case 'mark_done':
          return this.markCardDone(id);
        case 'mark_undone':
          return this.markCardUndone(id);
        case 'reorder':
          return this.reorderCard(id, (params as any).stackId, (params as any).order);
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    }

    throw new Error(`Actions for entity "${entity}" are not implemented`);
  }
}
