import * as OTPAuth from "otpauth";
import { Env } from "../config/env";

export class OTP { 

    otp_uri : string = "";

    constructor (init?: Partial<OTP>) {
        Object.assign(this, init);
    }

    getTOTP(): OTPAuth.TOTP {   
        const otpUri = Env.get(this.otp_uri);
        return OTPAuth.URI.parse(otpUri) as OTPAuth.TOTP;
    }
    
    getTOTPCode(timestamp?: number): string {
        const totp = this.getTOTP();
        return timestamp
            ? totp.generate({ timestamp }) 
            : totp.generate();             
    }
}
