export type ErrorCategory = 'server' | 'client' | 'network' | 'auth' | 'runtime' | 'unknown';

export interface ErrorDetails {
  category: ErrorCategory;
  userMessage: string;
  technicalDetails: string;
  timestamp: Date;
  status?: number;
  endpoint?: string;
}

const DEFAULT_USER_MESSAGES: Record<ErrorCategory, string> = {
  server: 'Une erreur technique est survenue sur le serveur',
  client: 'Une erreur technique est survenue',
  network: 'Impossible de contacter le serveur',
  auth: 'Session expir\u00e9e',
  runtime: 'Une erreur inattendue est survenue',
  unknown: 'Une erreur inattendue est survenue',
};

function categorizeByStatus(status: number): ErrorCategory {
  if (status === 0) return 'network';
  if (status === 401) return 'auth';
  if (status >= 500) return 'server';
  if (status >= 400) return 'client';
  return 'unknown';
}

function formatTechnicalDetails(params: {
  type: string;
  category: ErrorCategory;
  status?: number;
  endpoint?: string;
  serverMessage?: string;
  stack?: string;
  timestamp: Date;
}): string {
  const lines = [
    '═══════════════════════════════════════',
    `ERREUR OPENDOSSARD - ${params.timestamp.toLocaleString('fr-FR')}`,
    '═══════════════════════════════════════',
    `Type: ${params.type} (${params.category})`,
  ];

  if (params.status !== undefined) {
    lines.push(`Status: ${params.status}`);
  }

  if (params.endpoint) {
    lines.push(`Endpoint: ${params.endpoint}`);
  }

  if (params.serverMessage) {
    lines.push(`Message serveur: ${params.serverMessage}`);
  }

  if (params.stack) {
    lines.push('');
    lines.push('Stack trace:');
    lines.push(params.stack);
  }

  lines.push('═══════════════════════════════════════');

  return lines.join('\n');
}

export interface ApiErrorParams {
  status: number;
  endpoint?: string;
  serverMessage?: unknown; // Can be string, array (NestJS validation), or object
  stack?: string;
}

/**
 * Formats the server message for display to the user
 * Handles arrays (NestJS validation errors) and strings
 */
function formatServerMessage(message: unknown): string | undefined {
  if (!message) return undefined;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (typeof message === 'string') {
    return message;
  }

  return String(message);
}

export class ApiError extends Error implements ErrorDetails {
  category: ErrorCategory;
  userMessage: string;
  technicalDetails: string;
  timestamp: Date;
  status: number;
  endpoint?: string;

  constructor(params: ApiErrorParams) {
    const category = categorizeByStatus(params.status);
    const formattedServerMessage = formatServerMessage(params.serverMessage);

    // For client errors (400-499), show the actual server message if available
    // For other errors, use the default generic message
    const userMessage =
      category === 'client' && formattedServerMessage
        ? formattedServerMessage
        : DEFAULT_USER_MESSAGES[category];

    super(userMessage);
    this.name = 'ApiError';
    this.category = category;
    this.userMessage = userMessage;
    this.status = params.status;
    this.endpoint = params.endpoint;
    this.timestamp = new Date();

    this.technicalDetails = formatTechnicalDetails({
      type: 'ApiError',
      category: this.category,
      status: params.status,
      endpoint: params.endpoint,
      serverMessage: formattedServerMessage,
      stack: params.stack || this.stack,
      timestamp: this.timestamp,
    });
  }
}

export interface RuntimeErrorParams {
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
}

export class RuntimeError extends Error implements ErrorDetails {
  category: ErrorCategory;
  userMessage: string;
  technicalDetails: string;
  timestamp: Date;
  filename?: string;
  lineno?: number;
  colno?: number;

  constructor(params: RuntimeErrorParams) {
    super(params.message);
    this.name = 'RuntimeError';
    this.category = 'runtime';
    this.userMessage = DEFAULT_USER_MESSAGES.runtime;
    this.filename = params.filename;
    this.lineno = params.lineno;
    this.colno = params.colno;
    this.timestamp = new Date();

    const location = params.filename
      ? `${params.filename}:${params.lineno}:${params.colno}`
      : undefined;

    this.technicalDetails = formatTechnicalDetails({
      type: 'RuntimeError',
      category: this.category,
      serverMessage: location ? `Location: ${location}` : undefined,
      stack: params.stack || this.stack,
      timestamp: this.timestamp,
    });
  }
}
