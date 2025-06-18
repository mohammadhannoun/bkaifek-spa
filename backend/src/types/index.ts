import { Request } from 'express';

// Database entity types
export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    imageUrl?: string;
    roleId: number;
    majorId: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

export interface Mentor extends User {
    linkedinUrl?: string;
    sessionPrice: number;
    bio?: string;
    rating: number;
    menteeCount: number;
}

export interface Mentee extends User { }

export interface Role {
    roleId: number;
    name: string;
    description?: string;
}

export interface Major {
    majorId: number;
    name: string;
    description?: string;
}

export interface AvailabilitySlot {
    slotId: number;
    mentorId: number;
    startTs: Date;
    endTs: Date;
    isBooked: boolean;
}

export interface Session {
    sessionId: number;
    mentorId: number;
    menteeId: number;
    slotId?: number;
    status: SessionStatus;
    price: number;
    zoomUrl?: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Payment {
    paymentId: number;
    sessionId: number;
    menteeId: number;
    amount: number;
    currency: string;
    status: PaymentStatus;
    paypalTxnId?: string;
    createdAt: Date;
}

export interface Review {
    reviewId: number;
    sessionId: number;
    mentorId: number;
    menteeId: number;
    rating: number;
    comment?: string;
    likesCount: number;
    repliesCount: number;
    createdAt: Date;
}

// Enums
export type SessionStatus = 'upcoming' | 'past' | 'completed' | 'cancelled' | 'rescheduled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type UserRole = 'mentor' | 'mentee';

// API Request/Response types
export interface AuthRequest {
    email: string;
    password: string;
    role?: UserRole;
}

export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    role: UserRole;
    majorId: number;
    linkedinUrl?: string;
    sessionPrice?: number;
    bio?: string;
}

export interface AuthResponse {
    message: string;
    token: string;
    user: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        role: UserRole;
    };
}

export interface MentorProfile {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    linkedinUrl?: string;
    imageUrl?: string;
    sessionPrice: number;
    bio?: string;
    rating: number;
    menteeCount: number;
    majorName: string;
    roleName: string;
    totalReviews: number;
    createdAt: Date;
}

export interface MentorListResponse {
    mentors: MentorProfile[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalMentors: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface SessionWithDetails extends Session {
    mentorFirstName: string;
    mentorLastName: string;
    mentorImageUrl?: string;
    menteeFirstName: string;
    menteeLastName: string;
    menteeImageUrl?: string;
}

export interface BookingRequest {
    mentorId: number;
    slotId: number;
    scheduledStart: string;
    scheduledEnd: string;
}

export interface AvailabilityRequest {
    startDate: string;
    endDate: string;
    slots: {
        startTime: string;
        endTime: string;
    }[];
}

export interface ReviewRequest {
    sessionId: number;
    rating: number;
    comment?: string;
}

// JWT Payload
export interface JWTPayload {
    userId: number;
    role: UserRole;
    email: string;
    iat?: number;
    exp?: number;
}

// Express Request with user
export interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
        role: UserRole;
        roleId: number;
    };
}

// API Error Response
export interface ErrorResponse {
    error: string;
    details?: any;
}

// Query parameters for filtering
export interface MentorQueryParams {
    page?: string;
    limit?: string;
    major?: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: string;
    search?: string;
}

export interface SessionQueryParams {
    status?: SessionStatus;
    page?: string;
    limit?: string;
    startDate?: string;
    endDate?: string;
}
