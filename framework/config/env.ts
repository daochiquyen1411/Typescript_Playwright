import * as dotenv from "dotenv";

dotenv.config();

export class Env { 
  static get(key : string, required = true): string {
    const value = process.env[key];
    if (!value && required) {
      throw new Error(`Missing environment variable: ${key}`);
    }
    return value ?? "";
  }

  static getNumber(key: string, required = true): number {
    const val = this.get(key, required);
    const num = Number(val);
    if (isNaN(num)) {
      throw new Error(`Environment variable ${key} is not a number`);
    }
    return num;
  }

  static getBoolean(key: string, required = true): boolean {
    const val = this.get(key, required).toLowerCase();
    return ["true", "1", "yes"].includes(val);
  }
}

