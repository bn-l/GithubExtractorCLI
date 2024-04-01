
export class FileConflictError extends Error {
    public conflicts: string[] | undefined;

    constructor(message: string, { conflicts }: { conflicts?: string[] }) {
        super(message);

        this.conflicts = conflicts;
        this.name = this.constructor.name;

        Error.captureStackTrace(this, this.constructor);
        
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class MissingInJSONError extends Error {

    constructor(message: string) {
        super(message);
        
        this.name = this.constructor.name;

        Error.captureStackTrace(this, this.constructor);
        
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class APIFetchError extends Error {

    constructor(message: string) {
        super(message);
        
        this.name = this.constructor.name;

        Error.captureStackTrace(this, this.constructor);
        
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

