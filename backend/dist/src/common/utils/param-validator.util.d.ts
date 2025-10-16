export declare function parseQueryNumber(value: string | undefined, defaultValue: number, paramName?: string, min?: number, max?: number): number;
export declare function parseQueryBoolean(value: string | undefined, defaultValue: boolean): boolean;
export declare function parseQueryEnum<T extends string>(value: string | undefined, enumValues: T[], defaultValue: T, paramName?: string): T;
export declare function parseQueryDate(value: string | undefined, paramName?: string): Date | undefined;
