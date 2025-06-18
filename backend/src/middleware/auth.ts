import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import pool from '../config/database';
import { AuthenticatedRequest, JWTPayload, UserRole } from '../types';

export const authenticateToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

        let userQuery: string;

        if (decoded.role === 'mentor') {
            userQuery = `
                SELECT mentor_id as id, first_name, last_name, email, role_id 
                FROM mentor 
                WHERE mentor_id = $1 AND deleted_at IS NULL
            `;
        } else {
            userQuery = `
                SELECT mentee_id as id, first_name, last_name, email, role_id 
                FROM mentee 
                WHERE mentee_id = $1 AND deleted_at IS NULL
            `;
        }

        const result = await pool.query(userQuery, [parseInt(decoded.userId.toString())]);

        if (result.rows.length === 0) {
            res.status(401).json({ error: 'User not found' });
            return;
        }

        req.user = {
            id: result.rows[0].id,
            email: result.rows[0].email,
            firstName: result.rows[0].first_name,
            lastName: result.rows[0].last_name,
            role: decoded.role,
            roleId: result.rows[0].role_id,
        };

        next();
    } catch (error) {
        console.error('An Auth middleware error:', error);
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
    }
};

export const requireRole = (role: UserRole) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (req.user?.role !== role) {
            res.status(403).json({ error: `Access denied. ${role} role required.` });
            return;
        }
        next();
    };
};
