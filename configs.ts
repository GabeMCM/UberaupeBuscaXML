export function config(database: string): Record<string, string | number> {
    return {
        username: "uberaupe",
        password: "uberaupe",
        db: database, 
        hostname: "192.168.0.50", // IP
        port: 3306,
    }
}