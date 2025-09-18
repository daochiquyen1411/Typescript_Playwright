import * as dotenv from "dotenv";

dotenv.config();

/**
 * Utility class for safely accessing environment variables.
 * 
 * Loads environment variables using `dotenv` and provides strongly-typed
 * getters for string, number, and boolean values. Each getter can enforce
 * whether a variable is required, and throws an error if validation fails.
 *
 * @example
 * ```ts
 * const dbUrl = Env.get("DATABASE_URL");
 * const port = Env.getNumber("PORT", false); // optional, defaults to NaN if missing
 * const isDev = Env.getBoolean("IS_DEV");
 * ```
 */
export class Env { 

   /**
   * Get an environment variable as a string.
   * @param key - The name of the environment variable.
   * @param required - Whether the variable must exist (default = true).
   * @returns The value of the variable as a string (empty string if missing and not required).
   * @throws If the variable is required but missing.
   */
  static get(key : string, required = true): string {
    const value = process.env[key];
    if (!value && required) {
      throw new Error(`Missing environment variable: ${key}`);
    }
    return value ?? "";
  }

  /**
   * Get an environment variable as a number.
   * @param key - The name of the environment variable.
   * @param required - Whether the variable must exist (default = true).
   * @returns The value of the variable as a number.
   * @throws If the variable is required but missing, or if the value cannot be converted to a number.
   */
  static getNumber(key: string, required = true): number {
    const val = this.get(key, required);
    const num = Number(val);
    if (isNaN(num)) {
      throw new Error(`Environment variable ${key} is not a number`);
    }
    return num;
  }

  /**
   * Get an environment variable as a boolean.
   * - Recognizes `"true"`, `"1"`, `"yes"` (case-insensitive) as true.
   * - Any other value is treated as false.
   * 
   * @param key - The name of the environment variable.
   * @param required - Whether the variable must exist (default = true).
   * @returns True if the variable is set to a truthy string, otherwise false.
   * @throws If the variable is required but missing.
   */
  static getBoolean(key: string, required = true): boolean {
    const val = this.get(key, required).toLowerCase();
    return ["true", "1", "yes"].includes(val);
  }
}

