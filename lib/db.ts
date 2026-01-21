/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Database utility functions to interact with the external database API
 */

// Allow self-signed certificates for the database API

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


interface DbResponse {
  rows: any[];
  changes: number;
  lastInsertRowid: number;
}

interface ValidationErrorResponse {
  detail: Array<{
    loc: (string | number)[];
    msg: string;
    type: string;
  }>;
}

export async function executeQuery(sql: string, params?: any[]): Promise<DbResponse> {
  const apiUrl = process.env.DATABASE_API_URL;
  const bearerToken = process.env.DATABASE_BEARER_TOKEN;

  if (!apiUrl || !bearerToken) {
    throw new Error("Database configuration missing. Please check your .env file.");
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${bearerToken}`,
    },
    body: JSON.stringify({
      sql,
      ...(params && params.length > 0 && { params }),
    }),
  });

  if (!response.ok) {
    if (response.status === 422) {
      // Handle validation errors
      const errorData: ValidationErrorResponse = await response.json();
      const errorMessages = errorData.detail.map((err) => err.msg).join(", ");
      throw new Error(`Validation error: ${errorMessages}`);
    }
    const errorText = await response.text();
    throw new Error(`Database query failed: ${response.status} ${errorText}`);
  }

  const result: DbResponse = await response.json();
  return result;
}

/**
 * Initialize the users table if it doesn't exist
 */
export async function initializeUsersTable(): Promise<void> {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  try {
    await executeQuery(createTableSQL);
  } catch (error) {
    console.error("Error initializing users table:", error);
    throw error;
  }
}

