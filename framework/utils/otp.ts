import * as OTPAuth from "otpauth";
import { Env } from "../config/env";

export class OTP { 

    private envKey: string;
    private totp?: OTPAuth.TOTP;

    constructor(envKey : string) {
        this.envKey = envKey;
    }

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

    getCode(timestamp?: number): string {
        const totp = this.getTOTP();
        return timestamp ? totp.generate({ timestamp }) : totp.generate();
    }

    verify(code: string, window = 1, timestamp?: number): boolean {
        const totp = this.getTOTP();
        const delta = totp.validate({ token: code, window, timestamp });
        return delta !== null;
    }

    refresh(): void {
        this.totp = undefined;
    }
}
