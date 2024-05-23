declare module '#auth-utils' {
    interface User {
        id: number,
        email: string,
        name: string,
        vendor: string,
        profile: string,
        created_at: Date,
        updated_at: Date
    }
}

export {}