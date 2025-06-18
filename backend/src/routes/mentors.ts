import express, { Response } from 'express';
import pool from '../config/database';
import {
    MentorQueryParams,
    MentorListResponse,
} from '../types';

const router = express.Router();

// GET /api/mentors - Get all mentors with filtering and pagination
router.get('/', async (req: express.Request<{}, MentorListResponse, {}, MentorQueryParams>, res: Response<MentorListResponse>) => {
    try {
        const {
            page = '1',
            limit = '100',
            major,
            minPrice,
            maxPrice,
            minRating,
            search
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        let whereConditions = ['m.deleted_at IS NULL'];
        let queryParams: any[] = [];
        let paramCount = 0;

        // Add filters
        if (major) {
            paramCount++;
            whereConditions.push(`maj.name ILIKE $${paramCount}`);
            queryParams.push(`%${major}%`);
        }

        if (minPrice) {
            paramCount++;
            whereConditions.push(`m.session_price >= $${paramCount}`);
            queryParams.push(parseFloat(minPrice));
        }

        if (maxPrice) {
            paramCount++;
            whereConditions.push(`m.session_price <= $${paramCount}`);
            queryParams.push(parseFloat(maxPrice));
        }

        if (minRating) {
            paramCount++;
            whereConditions.push(`m.rating >= $${paramCount}`);
            queryParams.push(parseFloat(minRating));
        }

        if (search) {
            paramCount++;
            whereConditions.push(`(m.first_name ILIKE $${paramCount} OR m.last_name ILIKE $${paramCount} OR m.bio ILIKE $${paramCount})`);
            queryParams.push(`%${search}%`);
        }

        // Add pagination parameters
        paramCount++;
        queryParams.push(parseInt(limit));
        const limitParam = paramCount;

        paramCount++;
        queryParams.push(offset);
        const offsetParam = paramCount;

        const query = `
            SELECT 
                m.mentor_id as id,
                m.first_name,
                m.last_name,
                m.email,
                m.image_url,
                m.session_price,
                m.bio,
                m.rating,
                m.mentee_count,
                m.linkedin_url,
                maj.name as major_name,
                r.name as role_name,
                COUNT(rev.review_id) as total_reviews,
                m.created_at
            FROM mentor m
            LEFT JOIN major maj ON m.major_id = maj.major_id
            LEFT JOIN role r ON m.role_id = r.role_id
            LEFT JOIN review rev ON m.mentor_id = rev.mentor_id
            WHERE ${whereConditions.join(' AND ')}
            GROUP BY m.mentor_id, maj.name, r.name
            ORDER BY m.rating DESC, m.mentee_count DESC
            LIMIT $${limitParam} OFFSET $${offsetParam}
        `;

        const result = await pool.query(query, queryParams);

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(DISTINCT m.mentor_id) as total
            FROM mentor m
            LEFT JOIN major maj ON m.major_id = maj.major_id
            WHERE ${whereConditions.join(' AND ')}
        `;

        const countParams = queryParams.slice(0, -2); // Remove limit and offset
        const countResult = await pool.query(countQuery, countParams);
        const totalMentors = parseInt(countResult.rows[0].total);

        res.json({
            mentors: result.rows.map(row => ({
                id: row.id,
                firstName: row.first_name,
                lastName: row.last_name,
                email: row.email,
                phoneNumber: row.phone_number,
                linkedinUrl: row.linkedin_url,
                imageUrl: row.image_url,
                sessionPrice: row.session_price,
                bio: row.bio,
                rating: row.rating,
                menteeCount: row.mentee_count,
                majorName: row.major_name,
                roleName: row.role_name,
                totalReviews: parseInt(row.total_reviews),
                createdAt: row.created_at
            })),
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalMentors / parseInt(limit)),
                totalMentors,
                hasNext: offset + parseInt(limit) < totalMentors,
                hasPrev: parseInt(page) > 1,
            },
        });
    } catch (error) {
        console.error('Get mentors error:', error);
        res.status(500).json({
            mentors: [],
            pagination: {
                currentPage: 1,
                totalPages: 0,
                totalMentors: 0,
                hasNext: false,
                hasPrev: false,
            },
        });
    }
});

// GET /api/mentors/featured/reviews - Get featured reviews for hte home page
router.get('/featured/reviews', async (req: express.Request, res: Response) => {
    try {
        const { limit = '6' } = req.query;

        const query = `
            SELECT 
                r.review_id,
                r.rating,
                r.comment,
                r.likes_count,
                r.replies_count,
                r.created_at,
                m.first_name as mentee_first_name,
                m.last_name as mentee_last_name,
                m.image_url as mentee_image_url,
                mentor.first_name as mentor_first_name,
                mentor.last_name as mentor_last_name
            FROM review r
            LEFT JOIN mentee m ON r.mentee_id = m.mentee_id
            LEFT JOIN mentor mentor ON r.mentor_id = mentor.mentor_id
            WHERE r.rating >= 4 AND r.comment IS NOT NULL AND r.comment != ''
            ORDER BY r.rating DESC, r.likes_count DESC, r.created_at DESC
            LIMIT $1
        `;

        const result = await pool.query(query, [parseInt(limit as string)]);

        res.json({
            reviews: result.rows.map(row => ({
                reviewId: row.review_id,
                rating: row.rating,
                comment: row.comment,
                likesCount: row.likes_count,
                repliesCount: row.replies_count,
                createdAt: row.created_at,
                menteeFirstName: row.mentee_first_name,
                menteeLastName: row.mentee_last_name,
                menteeImageUrl: row.mentee_image_url,
                mentorFirstName: row.mentor_first_name,
                mentorLastName: row.mentor_last_name
            }))
        });
    } catch (error) {
        console.error('Get featured reviews error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/mentors/:id - Get specific mentor profile
router.get('/:id', async (req: express.Request, res: Response) => {
    try {
        const mentorId = parseInt(req.params.id);

        const query = `
            SELECT 
                m.mentor_id as id,
                m.first_name,
                m.last_name,
                m.email,
                m.phone_number,
                m.image_url,
                m.session_price,
                m.bio,
                m.rating,
                m.mentee_count,
                m.linkedin_url,
                maj.name as major_name,
                r.name as role_name,
                m.created_at,
                COUNT(rev.review_id) as total_reviews
            FROM mentor m
            LEFT JOIN major maj ON m.major_id = maj.major_id
            LEFT JOIN role r ON m.role_id = r.role_id
            LEFT JOIN review rev ON m.mentor_id = rev.mentor_id
            WHERE m.mentor_id = $1 AND m.deleted_at IS NULL
            GROUP BY m.mentor_id, maj.name, r.name
        `;

        const result = await pool.query(query, [mentorId]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Mentor not found' });
            return;
        }

        const mentor = result.rows[0];
        res.json({
            id: mentor.id,
            firstName: mentor.first_name,
            lastName: mentor.last_name,
            email: mentor.email,
            phoneNumber: mentor.phone_number,
            linkedinUrl: mentor.linkedin_url,
            imageUrl: mentor.image_url,
            sessionPrice: mentor.session_price,
            bio: mentor.bio,
            rating: mentor.rating,
            menteeCount: mentor.mentee_count,
            majorName: mentor.major_name,
            roleName: mentor.role_name,
            totalReviews: parseInt(mentor.total_reviews),
            createdAt: mentor.created_at
        });
    } catch (error) {
        console.error('Get mentor error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/mentors/:id/reviews - Get mentor reviews
router.get('/:id/reviews', async (req: express.Request, res: Response) => {
    try {
        const mentorId = parseInt(req.params.id);
        const { page = '1', limit = '10' } = req.query;
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        const query = `
            SELECT 
                r.review_id,
                r.rating,
                r.comment,
                r.likes_count,
                r.replies_count,
                r.created_at,
                m.first_name as mentee_first_name,
                m.last_name as mentee_last_name,
                m.image_url as mentee_image_url
            FROM review r
            LEFT JOIN mentee m ON r.mentee_id = m.mentee_id
            WHERE r.mentor_id = $1
            ORDER BY r.created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await pool.query(query, [mentorId, parseInt(limit as string), offset]);

        // Get total count
        const countResult = await pool.query(
            'SELECT COUNT(*) as total FROM review WHERE mentor_id = $1',
            [mentorId]
        );
        const totalReviews = parseInt(countResult.rows[0].total);

        res.json({
            reviews: result.rows,
            pagination: {
                currentPage: parseInt(page as string),
                totalPages: Math.ceil(totalReviews / parseInt(limit as string)),
                totalReviews,
                hasNext: offset + parseInt(limit as string) < totalReviews,
                hasPrev: parseInt(page as string) > 1,
            },
        });
    } catch (error) {
        console.error('Get mentor reviews error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/mentors/:id/availability - Get mentor availability with session booking status
router.get('/:id/availability', async (req: express.Request, res: Response) => {
    try {
        const mentorId = parseInt(req.params.id);
        const { startDate, endDate } = req.query;

        // First trying to get all booked sessions for this mentor in the date range
        let sessionQuery = `
            SELECT 
                scheduled_start,
                scheduled_end,
                status
            FROM session
            WHERE mentor_id = $1 
            AND status IN ('upcoming', 'rescheduled')
        `;

        const sessionParams: any[] = [mentorId];
        let sessionParamCount = 1;

        if (startDate) {
            sessionParamCount++;
            sessionQuery += ` AND scheduled_start >= $${sessionParamCount}`;
            sessionParams.push(startDate);
        }

        if (endDate) {
            sessionParamCount++;
            sessionQuery += ` AND scheduled_end <= $${sessionParamCount}`;
            sessionParams.push(endDate);
        }

        const sessionResult = await pool.query(sessionQuery, sessionParams);
        const bookedSessions = sessionResult.rows;

        // Create the comprehensive availability slots for the date range
        const availabilitySlots = [];

        if (startDate && endDate) {
            // Generate 30-minute slots for the requested date range
            const start = new Date(startDate as string);
            const end = new Date(endDate as string);
            end.setHours(23, 59, 59, 999); // Include the full end date

            let current = new Date(start);
            current.setHours(10, 0, 0, 0); // Start at 10:00 AM

            while (current <= end) {
                // Only generate slots during business hours (10 AM - 3:30 PM)
                if (current.getHours() >= 10 && current.getHours() < 16) {
                    const slotStart = new Date(current);
                    const slotEnd = new Date(current.getTime() + 30 * 60 * 1000); // 30 minutes later

                    // Checking if this slot overlaps with any booked session
                    const isBooked = bookedSessions.some(session => {
                        const sessionStart = new Date(session.scheduled_start);
                        const sessionEnd = new Date(session.scheduled_end);

                        // Check for time overlap in the
                        return (slotStart < sessionEnd && slotEnd > sessionStart);
                    });

                    availabilitySlots.push({
                        slotId: 0, // only virtual
                        startTs: slotStart.toISOString(),
                        endTs: slotEnd.toISOString(),
                        isBooked: isBooked
                    });
                }

                // Move to next 30-minute slot
                current.setTime(current.getTime() + 30 * 60 * 1000);

                // Skip to next day as we are out of the business hours
                if (current.getHours() >= 16) {
                    current.setDate(current.getDate() + 1);
                    current.setHours(10, 0, 0, 0);
                }
            }
        }

        res.json({
            availability: availabilitySlots
        });
    } catch (error) {
        console.error('Get mentor availability error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
