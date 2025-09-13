import { User } from './user.entity';
export declare class SearchHistory {
    id: number;
    userId: number;
    keyword: string;
    resultCount: number;
    filters?: {
        types?: string[];
        genres?: string[];
        quality?: string[];
        minRating?: number;
        maxRating?: number;
        yearRange?: [number, number];
    };
    searchTime: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    user: User;
}
