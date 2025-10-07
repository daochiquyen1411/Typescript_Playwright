import { Env } from "@lib/utils/env";
import { request, expect } from "@playwright/test";

Env.require("API_BASE_URL");

export async function registerUser(email: string, password: string) {
    const apiUrl = Env.getString('API_BASE_URL');
    const requestContext = await request.newContext();
    const response = await requestContext.post(apiUrl + '/users/register', {
        data: {
            first_name: "Quyen",
            last_name: "Dao",
            dob: "1996-11-14",
            phone: "0966834771",
            email: email,
            password: password,
            address: {
                street: "Street",
                city: "HCM",
                state: "HCM",
                country: "VN",
                postal_code: "700000"
            }
        },  
    });
    expect (response.status()).toBe(201);
    return response.status();
}