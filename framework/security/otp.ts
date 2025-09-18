import * as OTPAuth from "otpauth";
import { Env } from "../env/env";

/**
 * Wrapper around `otpauth` to manage OTP (Time-based One-Time Passwords).
 *
 * The class loads and parses an `otpauth://` URI from an environment variable,
 * then provides methods to generate and validate one-time passwords.
 *
 * @example
 * ```ts
 * const otp = new OTP("HEROKU_OTP_URI");
 * const code = otp.getCode();          // Generate current OTP
 * const valid = otp.verify(code, 1);   // Verify with ±1 step window
 * ```
 */
export class OTP { 
    /**
     * Name of the environment variable that stores the otpauth URI.
     * Example: `"OTP_URI"`.
     */
    private envKey: string;

    /**
     * Cached `OTPAuth.TOTP` instance, parsed from the otpauth URI.
     * Initialized lazily on first call to `getTOTP()`.
     */
    private totp?: OTPAuth.TOTP;

    /**
     * Create a new OTP helper.
     * @param envKey - The name of the environment variable that stores the otpauth:// URI.
     */
    constructor(envKey : string) {
        this.envKey = envKey;
    }

    /**
     * Get a TOTP instance parsed from the otpauth URI in the environment variable.
     * - Caches the instance after the first call for performance.
     * - Throws if the URI is missing or invalid.
     * @returns OTPAuth.TOTP instance
     */
    getTOTP(): OTPAuth.TOTP {   
        if (this.totp) return this.totp;

        const uri = Env.get(this.envKey); 
        const parsed = OTPAuth.URI.parse(uri);

        if (!(parsed instanceof OTPAuth.TOTP)) {
            throw new Error(`Biến ${this.envKey} không phải otpauth TOTP hợp lệ.`);
        }
        this.totp = parsed;
        return this.totp;
    }

    /**
     * Generate a TOTP code.
     * @param timestamp - Optional UNIX timestamp (ms). 
     *                    If provided, generates the code for that time. 
     *                    If omitted, generates the current valid code.
     * @returns OTP code as a string
     */
    getCode(timestamp?: number): string {
        const totp = this.getTOTP();
        return timestamp ? totp.generate({ timestamp }) : totp.generate();
    }

    /**
     * Verify a user-provided OTP code against the expected TOTP.
     * @param code - The OTP code to validate
     * @param window - Allowed step drift (default = 1).
     *                 Example: with 30s period, window=1 allows ±30s tolerance.
     * @param timestamp - Optional UNIX timestamp (ms) for validation context
     * @returns True if the code is valid, false otherwise
     */
    verify(code: string, window = 1, timestamp?: number): boolean {
        const totp = this.getTOTP();
        const delta = totp.validate({ token: code, window, timestamp });
        return delta !== null;
    }

    /**
     * Clear the cached TOTP instance.
     * Use this if the environment variable changes during runtime 
     * and you want to re-parse a fresh TOTP.
     */
    refresh(): void {
        this.totp = undefined;
    }
}
