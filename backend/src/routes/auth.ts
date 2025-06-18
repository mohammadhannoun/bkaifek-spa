import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';
import {
    AuthRequest,
    RegisterRequest,
    AuthResponse,
    AuthenticatedRequest
} from '../types';

const router = express.Router();

// POST /api/auth/register - Register new user
router.post('/register', async (req: express.Request<{}, AuthResponse, RegisterRequest>, res: Response<AuthResponse>) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            phoneNumber,
            role,
            majorId,
            linkedinUrl,
            sessionPrice,
            bio,
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !password || !role || !majorId) {
            console.log("Missing required fields:", { firstName, lastName, email, password, role, majorId });
            res.status(400).json({
                message: 'Missing required fields',
                token: '',
                user: { id: 0, firstName: '', lastName: '', email: '', role: 'mentee' }
            });
            return;
        }

        // Hashing password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Get role_id from role name
        const roleResult = await pool.query('SELECT role_id FROM role WHERE name = $1', [role]);
        const roleId = roleResult.rows[0].role_id;

        let result;
        let userId: number;

        if (role === 'mentor') {
            // Validate mentor-specific required fields
            if (!sessionPrice) {
                res.status(400).json({
                    message: 'Session price is required for mentors',
                    token: '',
                    user: { id: 0, firstName: '', lastName: '', email: '', role: 'mentee' }
                });
                return;
            }

            // Use default values for optional fields
            const useLinkedinUrl = linkedinUrl || '';
            const useBio = bio || 'Experienced mentor ready to help.';

            // Insert mentor
            result = await pool.query(
                `INSERT INTO mentor (role_id, major_id, first_name, last_name, email, phone_number, 
                 password_hash, linkedin_url, session_price, bio) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
                 RETURNING mentor_id, first_name, last_name, email`,
                [roleId, majorId, firstName, lastName, email, phoneNumber || '', hashedPassword,
                    useLinkedinUrl, sessionPrice, useBio]
            );
            userId = result.rows[0].mentor_id;
        } else {
            // Insert mentee
            result = await pool.query(
                `INSERT INTO mentee (role_id, major_id, first_name, last_name, email, phone_number, password_hash) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7) 
                 RETURNING mentee_id, first_name, last_name, email`,
                [roleId, majorId, firstName, lastName, email, phoneNumber || '', hashedPassword]
            );
            userId = result.rows[0].mentee_id;
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined');
        }

        const token = jwt.sign(
            { userId, role, email },
            jwtSecret,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
        );

        // Transform snake_case to camelCase for frontend
        const userData = {
            id: userId,
            firstName: result.rows[0].first_name,
            lastName: result.rows[0].last_name,
            email: result.rows[0].email,
            role,
        };


        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: userData,
        });
    } catch (error: any) {
        console.error('Registration error:', error);

        if (error.code === '23505') {
            if (error.constraint?.includes('email')) {
                res.status(409).json({
                    message: 'Email already exists',
                    token: '',
                    user: { id: 0, firstName: '', lastName: '', email: '', role: 'mentee' }
                });
                return;
            }
        }

        res.status(500).json({
            message: `Registration failed: ${error.message}`,
            token: '',
            user: { id: 0, firstName: '', lastName: '', email: '', role: 'mentee' }
        });
    }
});

// POST /api/auth/login - Login user
router.post('/login', async (req: express.Request<{}, AuthResponse, AuthRequest>, res: Response<AuthResponse>) => {
    try {
        const { email, password, role } = req.body;

        // Check in both mentor and mentee tables
        let user = null;
        let userRole: 'mentor' | 'mentee' = 'mentee';

        // Check mentor table first
        const mentorResult = await pool.query(
            'SELECT mentor_id as id, first_name, last_name, email, password_hash FROM mentor WHERE email = $1 AND deleted_at IS NULL',
            [email]
        );

        if (mentorResult.rows.length > 0) {
            user = mentorResult.rows[0];
            userRole = 'mentor';
        } else {
            // Check mentee table
            const menteeResult = await pool.query(
                'SELECT mentee_id as id, first_name, last_name, email, password_hash FROM mentee WHERE email = $1 AND deleted_at IS NULL',
                [email]
            );

            if (menteeResult.rows.length > 0) {
                user = menteeResult.rows[0];
                userRole = 'mentee';
            }
        }

        if (!user) {
            res.status(401).json({
                message: 'Invalid email or password',
                token: '',
                user: { id: 0, firstName: '', lastName: '', email: '', role: 'mentee' }
            });
            return;
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            res.status(401).json({
                message: 'Invalid email or password',
                token: '',
                user: { id: 0, firstName: '', lastName: '', email: '', role: 'mentee' }
            });
            return;
        }

        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined');
        }

        const token = jwt.sign(
            { userId: user.id, role: userRole, email: user.email },
            jwtSecret,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
        );

        const userData = {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            role: userRole,
        };


        res.json({
            message: 'Login successful',
            token,
            user: userData,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            message: 'Internal server error',
            token: '',
            user: { id: 0, firstName: '', lastName: '', email: '', role: 'mentee' }
        });
    }
});

// GET /api/auth/profile - Get current user profile
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        let query: string;

        if (req.user?.role === 'mentor') {
            query = `
                SELECT m.mentor_id as id, m.first_name, m.last_name, m.email, m.phone_number,
                       m.linkedin_url, m.image_url, m.session_price, m.bio, m.rating, m.mentee_count,
                       maj.name as major_name, r.name as role_name, m.created_at
                FROM mentor m
                LEFT JOIN major maj ON m.major_id = maj.major_id
                LEFT JOIN role r ON m.role_id = r.role_id
                WHERE m.mentor_id = $1 AND m.deleted_at IS NULL
            `;
        } else {
            query = `
                SELECT m.mentee_id as id, m.first_name, m.last_name, m.email, m.phone_number,
                       m.image_url, maj.name as major_name, r.name as role_name, m.created_at
                FROM mentee m
                LEFT JOIN major maj ON m.major_id = maj.major_id
                LEFT JOIN role r ON m.role_id = r.role_id
                WHERE m.mentee_id = $1 AND m.deleted_at IS NULL
            `;
        }

        const result = await pool.query(query, [req.user?.id]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // make snake_case to camelCase for frontend
        const userData = {
            id: result.rows[0].id,
            firstName: result.rows[0].first_name,
            lastName: result.rows[0].last_name,
            email: result.rows[0].email,
            phoneNumber: result.rows[0].phone_number,
            imageUrl: result.rows[0].image_url,
            linkedinUrl: result.rows[0].linkedin_url,
            sessionPrice: result.rows[0].session_price,
            bio: result.rows[0].bio,
            rating: result.rows[0].rating,
            menteeCount: result.rows[0].mentee_count,
            majorName: result.rows[0].major_name,
            roleName: result.rows[0].role_name,
            createdAt: result.rows[0].created_at,
            role: req.user?.role
        };

        res.json({
            user: userData,
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/logout - Logout user (client-side token removal)
router.post('/logout', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Logout successful. Please remove token from client.' });
});

// DELETE /api/auth/delete-account - Delete user account
router.delete('/delete-account', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id, role } = req.user;
        let query: string;

        // First, delete any related sessions
        if (role === 'mentor') {
            await pool.query(`
                DELETE FROM session
                WHERE mentor_id = $1
            `, [id]);
        } else {
            await pool.query(`
                DELETE FROM session
                WHERE mentee_id = $1
            `, [id]);
        }

        // Then delete the user
        if (role === 'mentor') {
            query = `
                DELETE FROM mentor
                WHERE mentor_id = $1
                RETURNING mentor_id
            `;
        } else {
            query = `
                DELETE FROM mentee
                WHERE mentee_id = $1
                RETURNING mentee_id
            `;
        }

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        console.log(`User account has been permanently deleted: ${role} with ID ${id}`);
        res.json({ message: 'Account permanently deleted' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
