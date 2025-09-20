import * as OTPAuth from "otpauth";
import { Env } from "../env/env";

/**
 * Utility wrapper for managing OTP (One-Time Password) using `otpauth`.
 *
 * Supports:
 * - Loading configuration from an environment variable or direct `otpauth://` URI.
 * - Lazy parsing and caching of the underlying `OTPAuth.TOTP` instance.
 * - Generating current or time-shifted OTP codes.
 * - Normalizing user-supplied tokens (trimming, digit conversion, uppercasing).
 * - Verifying codes with detailed results (boolean, delta, and reason).
 * - Refreshing the cached configuration if the env/URI changes at runtime.
 *
 * @example
 * ```ts
 * // From environment variable
 * const otp = OTP.fromEnv("HEROKU_OTP_URI");
 *
 * // Generate the current OTP code
 * const code = otp.getCode();
 *
 * // Verify a user-provided code with ±1 step tolerance
 * const result = otp.verify(userInput, 1);
 * if (result.ok) {
 *   console.log("OTP valid, step delta:", result.delta);
 * } else {
 *   console.error("OTP invalid:", result.reason);
 * }
 *
 * // Simple boolean check
 * if (otp.verifyBool(userInput)) {
 *   console.log("Code is valid");
 * }
 *
 * // Refresh if the env variable changed
 * otp.refresh();
 * ```
 */
export class OTP { 
    /** Stores either a direct otpauth URI or an env key to load from. */
    private readonly uri?: string;
    private readonly envKey?: string;

    /** Cached TOTP instance after the first parse. */
    private totp?: OTPAuth.TOTP;

    private constructor(opts: { uri?: string; envKey?: string }) {
        this.uri = opts.uri;
        this.envKey = opts.envKey;
    }

    /**
     * Create an OTP instance from an environment variable
     * (e.g. "OTP_URI" or "HEROKU_OTP_URI").
     */
    static fromEnv(envKey: string): OTP {
        return new OTP({ envKey });
    }

    /**
     * Create an OTP instance from a direct otpauth:// URI string.
     */
    static fromUri(uri: string): OTP {
        return new OTP({ uri });
    }

    
    /**
     * Resolve the otpauth URI.
     * - Uses the direct `uri` if provided.
     * - Otherwise loads from the given env variable.
     * @throws If no URI source is provided.
     */
    private getUri(): string {
        if (this.uri && this.uri.trim()) return this.uri.trim();
        if (this.envKey) return Env.getString(this.envKey);
        throw new Error("OTP: No URI or envKey provided.");
    }

    /**
     * Get (and cache) a parsed TOTP instance from the otpauth URI.
     * @throws If the URI is invalid or not a TOTP configuration.
     */
    getTOTP(): OTPAuth.TOTP {
        if (this.totp) return this.totp;
        const uri = this.getUri();
        let parsed: OTPAuth.URI;
        try {
            parsed = OTPAuth.URI.parse(uri);
        } catch (e) {
            throw new Error(
                `OTP: Invalid otpauth URI (${this.envKey ?? "direct"}): ${(e as Error).message}`
            );
        }

        if (!(parsed instanceof OTPAuth.TOTP)) {
            throw new Error(
                `OTP: The provided URI (${this.envKey ?? "direct"}) is not a TOTP configuration.`
            );
        }

        this.totp = parsed;
        return this.totp;
    }

    /**
     * Generate a TOTP code at the given timestamp (ms) or for the current time.
     */
    getCode(timestamp?: number): string {
        const totp = this.getTOTP();
        return timestamp ? totp.generate({ timestamp }) : totp.generate();
    }

    /**
     * Normalize a user-supplied token:
     * - Trim whitespace
     * - Convert full-width digits (０-９) to ASCII digits (0-9)
     * - Uppercase any letters (for base32 alphabets)
     */
    private normalizeToken(input: string): string {
        const toAsciiDigits = (s: string) =>
        s.replace(/[０-９]/g, d => String.fromCharCode(d.charCodeAt(0) - 0xFF10 + 0x30));
        return toAsciiDigits(input).replace(/\s+/g, "").toUpperCase();
    }

    /**
     * Verify a user-provided OTP code against the expected TOTP.
     *
     * @param code - The OTP code to validate
     * @param window - Allowed step drift (±window). Default = 1.
     * @param timestamp - Optional timestamp (ms) to validate against
     *
     * @returns An object with:
     *   - ok: true/false
     *   - delta: number of steps offset if valid, null if invalid
     *   - reason: optional string reason when invalid
     */
    verify(
        code: string,
        window = 1,
        timestamp?: number
    ): { ok: boolean; delta: number | null; reason?: string } {
        const totp = this.getTOTP();

        if (!code || typeof code !== "string") {
        return { ok: false, delta: null, reason: "Empty or non-string code" };
        }

        const token = this.normalizeToken(code);
        const delta = totp.validate({ token, window, timestamp });

        return {
        ok: delta !== null,
        delta,
        reason: delta === null ? "Invalid or out-of-window token" : undefined,
        };
    }

    
    /**
     * Convenience wrapper: verify and return a simple boolean.
     */
    verifyBool(code: string, window = 1, timestamp?: number): boolean {
        return this.verify(code, window, timestamp).ok;
    }

    /**
     * Clear the cached TOTP instance.
     * Use this if the environment variable or URI changes at runtime.
     */
    refresh(): void {
        this.totp = undefined;
    }
}
