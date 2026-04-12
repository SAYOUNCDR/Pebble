export class HttpError extends Error {
    public readonly statusCode: number;
    public readonly detail: unknown;

    constructor(message: string, statusCode = 500, detail?: unknown) {
        super(message);
        this.name = "HttpError";
        this.statusCode = statusCode;
        this.detail = detail;
    }
}
