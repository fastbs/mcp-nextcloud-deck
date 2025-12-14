#!/usr/bin/env node

/**
 * MCP Nextcloud Deck Server
 *
 * Kanban board management via Model Context Protocol
 * Provides CRUD operations for Nextcloud Deck entities
 *
 * Port: 3261
 * Protocol: StreamableHTTP (MCP 2025-06-18) - Stateless per-request transport
 */

import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express, { Request, Response } from 'express';
import { Logger } from './utils/logger.js';
import {
  deckCreateTool,
  deckReadTool,
  deckUpdateTool,
  deckDeleteTool,
  deckActionTool,
} from './deck/deck-tools.js';
import {
  handleDeckCreate,
  handleDeckRead,
  handleDeckUpdate,
  handleDeckDelete,
  handleDeckAction,
} from './deck/deck-handlers.js';

const logger = new Logger('MCPServer');

// Environment variables
const PORT = parseInt(process.env.PORT || '3261', 10);
const NEXTCLOUD_URL = process.env.NEXTCLOUD_URL || '';
const NEXTCLOUD_USERNAME = process.env.NEXTCLOUD_USERNAME || '';

logger.info('Starting MCP Nextcloud Deck Server...');
logger.info(`Port: ${PORT}`);

// Check Nextcloud credentials
const hasNextcloudCreds = !!(NEXTCLOUD_URL && NEXTCLOUD_USERNAME && process.env.NEXTCLOUD_PASSWORD);

if (!hasNextcloudCreds) {
  logger.error('Missing Nextcloud credentials!');
  logger.info('Set environment variables:');
  logger.info('  NEXTCLOUD_URL - Nextcloud server URL');
  logger.info('  NEXTCLOUD_USERNAME - Nextcloud username');
  logger.info('  NEXTCLOUD_PASSWORD - Nextcloud password');
  process.exit(1);
}

logger.success(`Nextcloud URL: ${NEXTCLOUD_URL}`);
logger.success(`Username: ${NEXTCLOUD_USERNAME}`);

/**
 * Register all Deck tools with the MCP server
 */
function registerDeckTools(server: McpServer) {
  // ===== deck_create =====
  server.tool(
    deckCreateTool.name,
    deckCreateTool.description,
    deckCreateTool.inputSchema,
    async (args) => {
      const endTimer = logger.time('deck_create');
      logger.info(`Creating ${args.entity}`);

      try {
        const result = await handleDeckCreate(args as any);

        logger.success(`Created ${args.entity}: ${result.id || result.title || 'success'}`);
        endTimer();

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
          }],
        };
      } catch (error: any) {
        logger.error(`Failed to create ${args.entity}`, error);
        endTimer();
        throw error;
      }
    }
  );

  // ===== deck_read =====
  server.tool(
    deckReadTool.name,
    deckReadTool.description,
    deckReadTool.inputSchema,
    async (args) => {
      const endTimer = logger.time('deck_read');
      logger.data('read', `${args.entity}`);

      try {
        const result = await handleDeckRead(args as any);

        const count = Array.isArray(result) ? result.length : 1;
        logger.success(`Read ${count} ${args.entity}`);
        endTimer();

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
          }],
        };
      } catch (error: any) {
        logger.error(`Failed to read ${args.entity}`, error);
        endTimer();
        throw error;
      }
    }
  );

  // ===== deck_update =====
  server.tool(
    deckUpdateTool.name,
    deckUpdateTool.description,
    deckUpdateTool.inputSchema,
    async (args) => {
      const endTimer = logger.time('deck_update');
      logger.data('write', `${args.entity}:${args.id}`);

      try {
        const result = await handleDeckUpdate(args as any);

        logger.success(`Updated ${args.entity}:${args.id}`);
        endTimer();

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
          }],
        };
      } catch (error: any) {
        logger.error(`Failed to update ${args.entity}:${args.id}`, error);
        endTimer();
        throw error;
      }
    }
  );

  // ===== deck_delete =====
  server.tool(
    deckDeleteTool.name,
    deckDeleteTool.description,
    deckDeleteTool.inputSchema,
    async (args) => {
      const endTimer = logger.time('deck_delete');
      logger.data('delete', `${args.entity}:${args.id}`);

      try {
        const result = await handleDeckDelete(args as any);

        logger.success(`Deleted ${args.entity}:${args.id}`);
        endTimer();

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
          }],
        };
      } catch (error: any) {
        logger.error(`Failed to delete ${args.entity}:${args.id}`, error);
        endTimer();
        throw error;
      }
    }
  );

  // ===== deck_action =====
  server.tool(
    deckActionTool.name,
    deckActionTool.description,
    deckActionTool.inputSchema,
    async (args) => {
      const endTimer = logger.time('deck_action');
      logger.info(`Performing ${args.action} on ${args.entity}:${args.id}`);

      try {
        const result = await handleDeckAction(args as any);

        logger.success(`Performed ${args.action} on ${args.entity}:${args.id}`);
        endTimer();

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
          }],
        };
      } catch (error: any) {
        logger.error(`Failed to perform ${args.action} on ${args.entity}:${args.id}`, error);
        endTimer();
        throw error;
      }
    }
  );

  logger.success('Registered all Deck tools');
}

/**
 * Create a new MCP server instance for each request (stateless architecture)
 */
const getServer = (): McpServer => {
  const server = new McpServer(
    {
      name: 'mcp-nextcloud-deck',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register Deck tools
  registerDeckTools(server);

  return server;
};

// Create Express app
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'mcp-nextcloud-deck',
    version: '1.0.0',
    nextcloud_url: NEXTCLOUD_URL,
    tools: ['deck_create', 'deck_read', 'deck_update', 'deck_delete', 'deck_action'],
  });
});

// MCP endpoint - Stateless per-request architecture
app.post('/mcp', async (req: Request, res: Response) => {
  const server = getServer();

  try {
    logger.info(`Incoming MCP request: ${req.body?.method || 'unknown'}`);

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);

    res.on('close', () => {
      logger.info('Connection closed, cleaning up');
      transport.close();
      server.close();
    });
  } catch (error: any) {
    logger.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error'
        },
        id: null
      });
    }
  }
});

// GET /mcp - Method Not Allowed
app.get('/mcp', async (req: Request, res: Response) => {
  logger.info('Received GET MCP request - returning 405');
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Method not allowed.'
      },
      id: null
    })
  );
});

// DELETE /mcp - Method Not Allowed
app.delete('/mcp', async (req: Request, res: Response) => {
  logger.info('Received DELETE MCP request - returning 405');
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Method not allowed.'
      },
      id: null
    })
  );
});

// Start HTTP server
app.listen(PORT, () => {
  logger.success(`MCP Nextcloud Deck Server started`);
  logger.info(`Listening on http://0.0.0.0:${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`MCP endpoint: http://localhost:${PORT}/mcp`);
  logger.info(`Protocol: Stateless Streamable HTTP (MCP 2025-06-18)`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down MCP Nextcloud Deck Server...');
  process.exit(0);
});

// Handle errors
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});
