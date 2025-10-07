import * as dotenv from "dotenv";

dotenv.config();

/**
 * Common options for environment variable retrieval.
 */
type BaseOpts = {
   /**
   * Whether the variable must exist.
   * - `true` (default) → throw error if missing or empty.
   * - `false` → allow missing and return `default` instead.
   */
  required?: boolean;   
  /**
   * Default value to return if the variable is missing and not required.
   * Can be any type, the parser (if provided) will refine it.
   */
  default?: unknown;   
  /**
   * Whether to trim whitespace around the raw string.
   * Defaults to `true`.
   */ 
  trim?: boolean;       
};

/**
 * Options for when you want to parse the raw string into another type `T`.
 * Extends {@link BaseOpts}.
 */
type ParsedOpts<T> = BaseOpts & {
  /**
   * Function to transform the raw environment string into type `T`.
   * Should throw if the string is invalid.
   */
   parser: (raw: string) => T 
};
/**
 * Options for when you only need the raw string.
 * Equivalent to {@link BaseOpts}.
 */
type StringOpts = BaseOpts;

export class Env { 

  /**
   * Snapshot of environment variables at application startup.
   *
   * Copies all keys from `process.env` into a plain object.
   * This avoids surprises if `process.env` is mutated later on,
   * ensuring that lookups are consistent throughout the app.
   *
   * - Keys: environment variable names
   * - Values: string values or `undefined` if not set
   */
  private static readonly cache: Record<string, string | undefined> = { ...process.env };

  /**
   * Get the raw value of an environment variable as a string.
   *
   * @param key - Name of the environment variable.
   * @param opts - Options for retrieval (see {@link StringOpts}).
   *   - `required` (default: true): whether the variable must exist.
   *   - `default`: value returned if missing and not required.
   *   - `trim` (default: true): whether to trim whitespace.
   *
   * @returns The environment variable as a string.
   * @throws If `required = true` and the variable is missing/empty.
   */
  static get(key: string, opts?: StringOpts): string;

  /**
   * Get an environment variable and parse it into another type.
   *
   * @typeParam T - The return type after parsing.
   * @param key - Name of the environment variable.
   * @param opts - Options including a `parser` function (see {@link ParsedOpts}).
   *   - `parser`: function to transform the raw string into type `T`.
   *   - `required` (default: true): whether the variable must exist.
   *   - `default`: value returned if missing and not required.
   *   - `trim` (default: true): whether to trim whitespace.
   *
   * @returns The environment variable parsed into type `T`.
   * @throws If `required = true` and missing, or if `parser` throws.
   */
  static get<T>(key: string, opts: ParsedOpts<T>): T;

  /**
   * Implementation of environment variable retrieval.
   *
   * Depending on the options, this method either:
   * - Returns the raw string value from {@link StringOpts}, or
   * - Applies a parser function to convert the raw string into type `T` (see {@link ParsedOpts}).
   *
   * @typeParam T - The parsed return type (if using a parser).
   * @param key - Name of the environment variable.
   * @param opts - Retrieval options:
   *   - `required` (default: true): if `true`, throw when missing or empty.
   *   - `default`: fallback value when not required and missing.
   *   - `trim` (default: true): whether to trim whitespace from the raw string.
   *   - `parser`: function to transform the raw string into type `T`.
   *
   * @returns
   * - The raw string if no parser is provided.
   * - A value of type `T` if a parser is provided.
   *
   * @throws
   * - If the variable is required but missing/empty.
   * - If a parser is provided and throws (e.g., invalid format).
   */
  static get<T>(key: string, opts: StringOpts | ParsedOpts<T> = {}): any {
    /**
     * Extracts option values from the `opts` object with defaults
    */
    const { required = true, default: defVal, trim = true } = opts;

    /**
     * Retrieve the raw value of the requested environment variable
     * from the internal cache (a snapshot of `process.env` taken at startup).
     *
     * - `key` is the name of the environment variable.
     * - The result may be a string (if set) or `undefined` (if not set).
     */
    let raw = this.cache[key];

    /**
     * If the environment variable is missing (`undefined`) or an empty string:
     * - And the variable is **not required** (`required === false`),
     *   then return the provided default value (`defVal`).
     *
     * This allows optional environment variables to safely fall back
     * to a default instead of throwing an error.
     */
    if ((raw === undefined || raw === "") && !required) {
      return defVal;
    }

    /**
     * If the environment variable is missing (`undefined`) or set to an
     * empty string AND it is marked as required (`required === true`),
     * throw an error immediately.
     *
     * This enforces "fail fast" behavior so the application does not
     * run with incomplete configuration.
     */
    if (raw === undefined || raw === "") {
      throw new Error(`Missing environment variable: ${key}`);
    }

    /**
     * If trimming is enabled (`trim === true`), remove leading and
     * trailing whitespace from the raw environment variable value.
     *
     * This helps prevent issues when variables in `.env` or the host
     * environment accidentally contain extra spaces.
     */
    if (trim) raw = raw.trim();

    /**
     * If a custom `parser` function is provided in `opts`:
     * - Treat this as a `ParsedOpts<T>` case.
     * - Call the parser with the raw environment variable string.
     * - Return the parser's result as type `T`.
     *
     * This allows callers to transform the raw string into another type
     * (e.g., number, boolean, JSON object) with validation logic.
     */
    if ("parser" in opts && typeof (opts as ParsedOpts<T>).parser === "function") {
      return (opts as ParsedOpts<T>).parser(raw);
    }

    return raw; 
  }

  /**
   * Ensure that one or more environment variables are present.
   *
   * @param keys - A list of environment variable names to check.
   *
   * @throws {Error} If any of the specified variables are missing
   *         (i.e., not defined or empty).
   *
   * @example
   * ```ts
   * // Will throw if either DATABASE_URL or PORT is not set
   * Env.require("DATABASE_URL", "PORT");
   * ```
   *
   * Use this at application startup to fail fast when critical
   * configuration is missing.
   */
  static require(...keys: string[]): void {
    const missing = keys.filter(k => !this.has(k));
    if (missing.length) {
      throw new Error(`Missing required env var(s): ${missing.join(", ")}`);
    }
  }

  /**
   * Check whether a given environment variable exists and is non-empty.
   *
   * @param key - The name of the environment variable to look up.
   * @returns `true` if the variable is defined in the cache and not an empty string,
   *          otherwise `false`.
   *
   * @example
   * ```ts
   * if (Env.has("REDIS_URL")) {
   *   // Safe to use REDIS_URL
   * }
   * ```
   */
  static has(key: string): boolean {
    const v = this.cache[key];
    return v !== undefined && v !== "";
  }

  /**
   * Get an environment variable as a string.
   *
   * @param key - The name of the environment variable.
   * @param required - Whether the variable must exist.
   *   Defaults to `true`. If `false`, the method will return `def` when the
   *   variable is missing or empty.
   * @param def - Default value to return if the variable is not required and missing.
   *
   * @returns The environment variable as a string, or the default value if provided.
   *
   * @throws {Error} If `required = true` and the variable is missing or empty.
   *
   * @example
   * ```ts
   * // Will throw if DATABASE_URL is missing
   * const dbUrl = Env.getString("DATABASE_URL");
   *
   * // Returns "info" if LOG_LEVEL is not set
   * const logLevel = Env.getString("LOG_LEVEL", false, "info");
   * ```
   */
  static getString(key: string, required = true, def?: string): string {
    return this.get(key, { required, default: def });
  }

  /**
   * Get an environment variable as a number.
   *
   * @param key - The name of the environment variable.
   * @param required - Whether the variable must exist.
   *   Defaults to `true`. If `false`, the method will return `def` when the
   *   variable is missing or empty.
   * @param def - Default number to return if the variable is not required and missing.
   *
   * @returns The environment variable parsed as a number.
   *
   * @throws {Error}
   * - If `required = true` and the variable is missing or empty.
   * - If the variable exists but cannot be converted to a valid number.
   *
   * @example
   * ```ts
   * // Will throw if PORT is missing or not numeric
   * const port = Env.getNumber("PORT");
   *
   * // Returns 3000 if CACHE_TTL is not set
   * const ttl = Env.getNumber("CACHE_TTL", false, 3000);
   * ```
   */
  static getNumber(key: string, required = true, def?: number): number {
    return this.get<number>(key, {
      required,
      default: def,
      parser: (raw) => {
        const n = Number(raw);
        if (Number.isNaN(n)) throw new Error(`Environment variable ${key} is not a valid number: "${raw}"`);
        return n;
      },
    });
  }

  /**
   * Get an environment variable as a boolean.
   *
   * Accepted truthy values (case-insensitive): `"true"`, `"1"`, `"yes"`, `"on"`.
   * Accepted falsy values (case-insensitive): `"false"`, `"0"`, `"no"`, `"off"`.
   *
   * @param key - The name of the environment variable.
   * @param required - Whether the variable must exist.
   *   Defaults to `true`. If `false`, the method will return `def` when the
   *   variable is missing or empty.
   * @param def - Default boolean value to return if the variable is not required and missing.
   *
   * @returns The environment variable parsed as a boolean.
   *
   * @throws {Error}
   * - If `required = true` and the variable is missing or empty.
   * - If the variable exists but does not match any recognized truthy/falsy string.
   *
   * @example
   * ```ts
   * // In .env: FEATURE_FLAG=true
   * const enabled = Env.getBoolean("FEATURE_FLAG"); // true
   *
   * // Returns false if DEBUG_MODE is not set
   * const debug = Env.getBoolean("DEBUG_MODE", false, false);
   *
   * // Will throw if MODE="maybe"
   * Env.getBoolean("MODE");
   * ```
   */
  static getBoolean(key: string, required = true, def?: boolean): boolean {
    return this.get<boolean>(key, {
      required,
      default: def,
      parser: (raw) => {
        const v = raw.toLowerCase();
        if (["true", "1", "yes", "on"].includes(v)) return true;
        if (["false", "0", "no", "off"].includes(v)) return false;
        throw new Error(`Environment variable ${key} is not a valid boolean: "${raw}"`);
      },
    });
  }

  /**
   * Get an environment variable constrained to a fixed set of string values (enum).
   *
   * @typeParam T - The union of allowed string values.
   *
   * @param key - The name of the environment variable.
   * @param allowed - Array of allowed string values. The variable must match one of these.
   * @param required - Whether the variable must exist.
   *   Defaults to `true`. If `false`, the method will return `def` when the
   *   variable is missing or empty.
   * @param def - Default value to return if the variable is not required and missing.
   *
   * @returns The environment variable value, validated as one of the allowed values.
   *
   * @throws {Error}
   * - If `required = true` and the variable is missing or empty.
   * - If the variable exists but its value is not in the `allowed` list.
   *
   * @example
   * ```ts
   * // Accept only "development", "test", or "production"
   * const nodeEnv = Env.getEnum("NODE_ENV", ["development", "test", "production"] as const);
   *
   * // Returns "development" if not set
   * const env = Env.getEnum("NODE_ENV", ["development", "test", "production"] as const, false, "development");
   *
   * // Will throw if NODE_ENV="staging"
   * ```
   */
  static getEnum<T extends string>(
    key: string,
    allowed: readonly T[],
    required = true,
    def?: T
  ): T {
    return this.get<T>(key, {
      required,
      default: def,
      parser: (raw) => {
        const val = raw as T;
        if (!allowed.includes(val)) {
          throw new Error(`Environment variable ${key} must be one of [${allowed.join(", ")}], got "${raw}"`);
        }
        return val;
      },
    });
  }

  /**
   * Get an environment variable as a list of values.
   *
   * The variable is expected to be a string with items separated by a delimiter
   * (default: comma `,`). The string is split, trimmed, and optionally mapped
   * to another type.
   *
   * @typeParam T - The element type of the resulting array. Defaults to `string`.
   *
   * @param key - The name of the environment variable.
   * @param sep - Separator used to split the string into parts. Defaults to `","`.
   * @param required - Whether the variable must exist.
   *   Defaults to `true`. If `false`, the method will return `def` when the
   *   variable is missing or empty.
   * @param map - Optional mapping function to transform each item from string
   *   into another type (e.g., `Number`, custom parser).
   * @param def - Default array to return if the variable is not required and missing.
   *
   * @returns An array of values, either strings or transformed with `map`.
   *
   * @throws {Error}
   * - If `required = true` and the variable is missing or empty.
   *
   * @example
   * ```ts
   * // In .env: CORS_ORIGINS=http://a.com, http://b.com
   * const origins = Env.getList("CORS_ORIGINS");
   * // => ["http://a.com", "http://b.com"]
   *
   * // In .env: RETRY_CODES=500,502,504
   * const codes = Env.getList("RETRY_CODES", ",", true, Number);
   * // => [500, 502, 504]
   *
   * // Optional with default fallback
   * const features = Env.getList("FEATURE_FLAGS", ",", false, undefined, ["default-feature"]);
   * // => ["default-feature"] if FEATURE_FLAGS is not set
   * ```
   */
  static getList<T = string>(
    key: string,
    sep = ",",
    required = true,
    map?: (s: string) => T,
    def?: T[]
  ): T[] {
    return this.get<T[]>(key, {
      required,
      default: def,
      parser: (raw) => {
        const parts = raw.split(sep).map(s => s.trim()).filter(Boolean);
        return map ? parts.map(map) : (parts as unknown as T[]);
      },
    });
  }

  /**
   * Get an environment variable parsed as JSON.
   *
   * The variable is expected to contain a valid JSON string. It will be parsed
   * and returned as type `T`. This is useful for structured configuration
   * values like objects or arrays.
   *
   * @typeParam T - The type of the parsed JSON object (e.g., a config interface).
   *
   * @param key - The name of the environment variable.
   * @param required - Whether the variable must exist.
   *   Defaults to `true`. If `false`, the method will return `def` when the
   *   variable is missing or empty.
   * @param def - Default value to return if the variable is not required and missing.
   *
   * @returns The parsed JSON object as type `T`.
   *
   * @throws {Error}
   * - If `required = true` and the variable is missing or empty.
   * - If the variable exists but does not contain valid JSON.
   *
   * @example
   * ```ts
   * // In .env: SENTRY_CONFIG={"dsn":"abc123","tracesSampleRate":0.2}
   * type SentryConfig = { dsn: string; tracesSampleRate: number };
   *
   * const sentry = Env.getJson<SentryConfig>("SENTRY_CONFIG");
   * // => { dsn: "abc123", tracesSampleRate: 0.2 }
   *
   * // Optional with default
   * const features = Env.getJson("FEATURE_FLAGS", false, { beta: false });
   * // => { beta: false } if FEATURE_FLAGS is not set
   * ```
   */
  static getJson<T>(key: string, required = true, def?: T): T {
    return this.get<T>(key, {
      required,
      default: def,
      parser: (raw) => {
        try {
          return JSON.parse(raw) as T;
        } catch (e) {
          throw new Error(`Environment variable ${key} is not valid JSON: ${(e as Error).message}`);
        }
      },
    });
  }
}