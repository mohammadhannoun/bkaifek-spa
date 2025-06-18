import express, { Response } from 'express';
import pool from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
    SessionQueryParams,
    BookingRequest,
    AuthenticatedRequest
} from '../types';

const router = express.Router();

// GET /api/sessions - Get user's sessions mentor or mentee
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { status, page = '1', limit = '10', startDate, endDate } = req.query as SessionQueryParams;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereConditions = [];
        let queryParams: any[] = [];
        let paramCount = 0;

        if (req.user?.role === 'mentor') {
            paramCount++;
            whereConditions.push(`s.mentor_id = $${paramCount}`);
            queryParams.push(req.user.id);
        } else if (req.user?.role === 'mentee') {
            paramCount++;
            whereConditions.push(`s.mentee_id = $${paramCount}`);
            queryParams.push(req.user.id);
        } else {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        if (status) {
            paramCount++;
            whereConditions.push(`s.status = $${paramCount}`);
            queryParams.push(status);
        }

        if (startDate) {
            paramCount++;
            whereConditions.push(`s.scheduled_start >= $${paramCount}`);
            queryParams.push(startDate);
        }

        if (endDate) {
            paramCount++;
            whereConditions.push(`s.scheduled_end <= $${paramCount}`);
            queryParams.push(endDate);
        }

        paramCount++;
        queryParams.push(parseInt(limit));
        const limitParam = paramCount;

        paramCount++;
        queryParams.push(offset);
        const offsetParam = paramCount;

        const query = `
            SELECT 
                s.session_id,
                s.mentor_id,
                s.mentee_id,
                s.status,
                s.price,
                s.zoom_url,
                s.scheduled_start,
                s.scheduled_end,
                s.created_at,
                s.updated_at,
                mentor.first_name as mentor_first_name,
                mentor.last_name as mentor_last_name,
                mentor.image_url as mentor_image_url,
                mentee.first_name as mentee_first_name,
                mentee.last_name as mentee_last_name,
                mentee.image_url as mentee_image_url
            FROM session s
            LEFT JOIN mentor ON s.mentor_id = mentor.mentor_id
            LEFT JOIN mentee ON s.mentee_id = mentee.mentee_id
            WHERE ${whereConditions.join(' AND ')}
            ORDER BY s.scheduled_start DESC
            LIMIT $${limitParam} OFFSET $${offsetParam}
        `;

        const result = await pool.query(query, queryParams);

        const countQuery = `
            SELECT COUNT(*) as total
            FROM session s
            WHERE ${whereConditions.join(' AND ')}
        `;
        const countParams = queryParams.slice(0, -2);
        const countResult = await pool.query(countQuery, countParams);
        const totalSessions = parseInt(countResult.rows[0].total);

        res.json({
            sessions: result.rows.map(row => ({
                sessionId: row.session_id,
                mentorId: row.mentor_id,
                menteeId: row.mentee_id,
                status: row.status,
                price: row.price,
                zoomUrl: row.zoom_url,
                scheduledStart: row.scheduled_start,
                scheduledEnd: row.scheduled_end,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                mentorFirstName: row.mentor_first_name,
                mentorLastName: row.mentor_last_name,
                mentorImageUrl: row.mentor_image_url,
                menteeFirstName: row.mentee_first_name,
                menteeLastName: row.mentee_last_name,
                menteeImageUrl: row.mentee_image_url
            })),
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalSessions / parseInt(limit)),
                totalSessions,
                hasNext: offset + parseInt(limit) < totalSessions,
                hasPrev: parseInt(page) > 1,
            },
        });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/sessions/:id - Get specific session details
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const sessionId = parseInt(req.params.id);

        const query = `
            SELECT 
                s.session_id,
                s.mentor_id,
                s.mentee_id,
                s.status,
                s.price,
                s.zoom_url,
                s.scheduled_start,
                s.scheduled_end,
                s.created_at,
                s.updated_at,
                mentor.first_name as mentor_first_name,
                mentor.last_name as mentor_last_name,
                mentor.image_url as mentor_image_url,
                mentor.bio as mentor_bio,
                mentor.linkedin_url as mentor_linkedin_url,
                mentee.first_name as mentee_first_name,
                mentee.last_name as mentee_last_name,
                mentee.image_url as mentee_image_url
            FROM session s
            LEFT JOIN mentor ON s.mentor_id = mentor.mentor_id
            LEFT JOIN mentee ON s.mentee_id = mentee.mentee_id
            WHERE s.session_id = $1
        `;

        const result = await pool.query(query, [sessionId]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        const session = result.rows[0];

        // Check if user has access to this session
        if (req.user?.role === 'mentor' && session.mentor_id !== req.user.id) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        if (req.user?.role === 'mentee' && session.mentee_id !== req.user.id) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        res.json({
            session: {
                sessionId: session.session_id,
                mentorId: session.mentor_id,
                menteeId: session.mentee_id,
                status: session.status,
                price: session.price,
                zoomUrl: session.zoom_url,
                scheduledStart: session.scheduled_start,
                scheduledEnd: session.scheduled_end,
                createdAt: session.created_at,
                updatedAt: session.updated_at,
                mentorFirstName: session.mentor_first_name,
                mentorLastName: session.mentor_last_name,
                mentorImageUrl: session.mentor_image_url,
                mentorBio: session.mentor_bio,
                mentorLinkedinUrl: session.mentor_linkedin_url,
                menteeFirstName: session.mentee_first_name,
                menteeLastName: session.mentee_last_name,
                menteeImageUrl: session.mentee_image_url
            }
        });
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/sessions - Book a new session (mentee only)
router.post('/', authenticateToken, requireRole('mentee'), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { mentorId, slotId, scheduledStart, scheduledEnd }: BookingRequest = req.body;

        if (!mentorId || !scheduledStart || !scheduledEnd) {
            res.status(400).json({ error: 'Missing required fields: mentorId, scheduledStart, scheduledEnd' });
            return;
        }

        // Get mentor's session price
        const mentorResult = await pool.query(
            'SELECT session_price FROM mentor WHERE mentor_id = $1 AND deleted_at IS NULL',
            [mentorId]
        );

        if (mentorResult.rows.length === 0) {
            res.status(404).json({ error: 'Mentor not found' });
            return;
        }

        const sessionPrice = mentorResult.rows[0].session_price;

        let actualSlotId = slotId;

        // First, check for any existing sessions that conflict with the requested time
        const conflictingSessionResult = await pool.query(
            `SELECT session_id FROM session 
             WHERE mentor_id = $1 AND status IN ('upcoming', 'past') 
             AND ((scheduled_start <= $2 AND scheduled_end > $2) 
                  OR (scheduled_start < $3 AND scheduled_end >= $3)
                  OR (scheduled_start >= $2 AND scheduled_end <= $3))`,
            [mentorId, scheduledStart, scheduledEnd]
        );

        if (conflictingSessionResult.rows.length > 0) {
            res.status(409).json({ error: 'Time slot is already booked' });
            return;
        }

        // If no slotId provided or slotId is 0, check if there's an existing slot or create one
        if (!slotId || slotId === 0) {
            // Check if there's already an available slot for this time period
            const existingSlotResult = await pool.query(
                `SELECT slot_id, is_booked FROM availability_slot 
                 WHERE mentor_id = $1 AND start_ts = $2 AND end_ts = $3 AND is_booked = false
                 LIMIT 1`,
                [mentorId, scheduledStart, scheduledEnd]
            );

            if (existingSlotResult.rows.length > 0) {
                actualSlotId = existingSlotResult.rows[0].slot_id;
                await pool.query(
                    'UPDATE availability_slot SET is_booked = true WHERE slot_id = $1',
                    [actualSlotId]
                );
            } else {
                // Create a new slot
                const newSlotResult = await pool.query(
                    `INSERT INTO availability_slot (mentor_id, start_ts, end_ts, is_booked)
                     VALUES ($1, $2, $3, true)
                     RETURNING slot_id`,
                    [mentorId, scheduledStart, scheduledEnd]
                );
                actualSlotId = newSlotResult.rows[0].slot_id;
            }
        } else {
            // Check if provided slot is available
            const slotResult = await pool.query(
                'SELECT is_booked FROM availability_slot WHERE slot_id = $1 AND mentor_id = $2',
                [slotId, mentorId]
            );

            if (slotResult.rows.length === 0) {
                res.status(404).json({ error: 'Availability slot not found' });
                return;
            }

            if (slotResult.rows[0].is_booked) {
                res.status(409).json({ error: 'Time slot is already booked' });
                return;
            }

            // Mark slot as booked
            await pool.query(
                'UPDATE availability_slot SET is_booked = true WHERE slot_id = $1',
                [slotId]
            );
            actualSlotId = slotId;
        }

        // Used the date to ensure unqieness, I am using my own meeting id
        const zoomUrl = `https://zoom.us/j/3223823137?pwd=${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

        const sessionResult = await pool.query(
            `INSERT INTO session (mentor_id, mentee_id, slot_id, status, price, zoom_url, scheduled_start, scheduled_end)
             VALUES ($1, $2, $3, 'upcoming', $4, $5, $6, $7)
             RETURNING session_id, mentor_id, mentee_id, status, price, zoom_url, scheduled_start, scheduled_end, created_at`,
            [mentorId, req.user?.id, actualSlotId, sessionPrice, zoomUrl, scheduledStart, scheduledEnd]
        );

        // Create payment record (assuming payment is always successful for now)
        await pool.query(
            `INSERT INTO payment (session_id, mentee_id, amount, currency, status)
             VALUES ($1, $2, $3, 'USD', 'completed')`,
            [sessionResult.rows[0].session_id, req.user?.id, sessionPrice]
        );

        res.status(201).json({
            message: 'Session booked successfully',
            session: {
                sessionId: sessionResult.rows[0].session_id,
                mentorId: sessionResult.rows[0].mentor_id,
                menteeId: sessionResult.rows[0].mentee_id,
                status: sessionResult.rows[0].status,
                price: sessionResult.rows[0].price,
                zoomUrl: sessionResult.rows[0].zoom_url,
                scheduledStart: sessionResult.rows[0].scheduled_start,
                scheduledEnd: sessionResult.rows[0].scheduled_end,
                createdAt: sessionResult.rows[0].created_at
            }
        });
    } catch (error: any) {
        console.error('Book session error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            stack: error.stack
        });
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// PUT /api/sessions/:id/reschedule - Reschedule a session (mentee only)
router.put('/:id/reschedule', authenticateToken, requireRole('mentee'), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const sessionId = parseInt(req.params.id);
        const { scheduledStart, scheduledEnd } = req.body;

        if (!scheduledStart || !scheduledEnd) {
            res.status(400).json({ error: 'Missing required fields: scheduledStart, scheduledEnd' });
            return;
        }

        const sessionResult = await pool.query(
            'SELECT mentor_id, mentee_id, slot_id, status FROM session WHERE session_id = $1',
            [sessionId]
        );

        if (sessionResult.rows.length === 0) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        const session = sessionResult.rows[0];

        if (session.mentee_id !== req.user?.id) {
            res.status(403).json({ error: 'Only the mentee can reschedule this session' });
            return;
        }

        if (session.status !== 'upcoming') {
            res.status(400).json({ error: 'Only upcoming sessions can be rescheduled' });
            return;
        }

        const conflictResult = await pool.query(
            `SELECT session_id FROM session 
             WHERE mentor_id = $1 
             AND session_id != $2
             AND status IN ('upcoming', 'rescheduled')
             AND ((scheduled_start <= $3 AND scheduled_end > $3) 
                  OR (scheduled_start < $4 AND scheduled_end >= $4)
                  OR (scheduled_start >= $3 AND scheduled_end <= $4))`,
            [session.mentor_id, sessionId, scheduledStart, scheduledEnd]
        );

        if (conflictResult.rows.length > 0) {
            res.status(409).json({ error: 'The selected time slot conflicts with another session' });
            return;
        }

        // make the old slot available
        if (session.slot_id) {
            await pool.query(
                'UPDATE availability_slot SET is_booked = false WHERE slot_id = $1',
                [session.slot_id]
            );
        }

        let newSlotId;
        const existingSlotResult = await pool.query(
            `SELECT slot_id FROM availability_slot 
             WHERE mentor_id = $1 AND start_ts = $2 AND end_ts = $3`,
            [session.mentor_id, scheduledStart, scheduledEnd]
        );

        if (existingSlotResult.rows.length > 0) {
            newSlotId = existingSlotResult.rows[0].slot_id;
            await pool.query(
                'UPDATE availability_slot SET is_booked = true WHERE slot_id = $1',
                [newSlotId]
            );
        } else {
            const newSlotResult = await pool.query(
                `INSERT INTO availability_slot (mentor_id, start_ts, end_ts, is_booked)
                 VALUES ($1, $2, $3, true)
                 RETURNING slot_id`,
                [session.mentor_id, scheduledStart, scheduledEnd]
            );
            newSlotId = newSlotResult.rows[0].slot_id;
        }

        const updatedSessionResult = await pool.query(
            `UPDATE session 
             SET slot_id = $1, scheduled_start = $2, scheduled_end = $3, status = 'upcoming', updated_at = CURRENT_TIMESTAMP
             WHERE session_id = $4
             RETURNING *`,
            [newSlotId, scheduledStart, scheduledEnd, sessionId]
        );

        res.json({
            message: 'Session rescheduled successfully',
            session: {
                sessionId: updatedSessionResult.rows[0].session_id,
                mentorId: updatedSessionResult.rows[0].mentor_id,
                menteeId: updatedSessionResult.rows[0].mentee_id,
                status: updatedSessionResult.rows[0].status,
                price: updatedSessionResult.rows[0].price,
                zoomUrl: updatedSessionResult.rows[0].zoom_url,
                scheduledStart: updatedSessionResult.rows[0].scheduled_start,
                scheduledEnd: updatedSessionResult.rows[0].scheduled_end,
                createdAt: updatedSessionResult.rows[0].created_at,
                updatedAt: updatedSessionResult.rows[0].updated_at
            }
        });
    } catch (error) {
        console.error('Reschedule session error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/sessions/update-expired - Update expired sessions to past status
router.put('/update-expired', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const result = await pool.query(
            `UPDATE session 
             SET status = 'past', updated_at = CURRENT_TIMESTAMP
             WHERE status = 'upcoming' AND scheduled_end < NOW()
             RETURNING session_id, scheduled_end`,
        );

        res.json({
            message: 'Expired sessions updated successfully',
            updatedSessions: result.rows.length,
            sessions: result.rows
        });
    } catch (error) {
        console.error('Update expired sessions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/sessions/:id/status - Update session status
router.put('/:id/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const sessionId = parseInt(req.params.id);
        const { status } = req.body;

        if (!status) {
            res.status(400).json({ error: 'Status is required' });
            return;
        }

        const sessionResult = await pool.query(
            'SELECT mentor_id, mentee_id FROM session WHERE session_id = $1',
            [sessionId]
        );

        if (sessionResult.rows.length === 0) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        const session = sessionResult.rows[0];
        if (req.user?.role === 'mentor' && session.mentor_id !== req.user.id) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        if (req.user?.role === 'mentee' && session.mentee_id !== req.user.id) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // If cancelling a session, free up the availability slot and clear slot_id
        if (status === 'cancelled') {
            // Get the slot_id for this session
            const slotResult = await pool.query(
                'SELECT slot_id FROM session WHERE session_id = $1',
                [sessionId]
            );

            if (slotResult.rows.length > 0 && slotResult.rows[0].slot_id) {
                // Free up the slot
                await pool.query(
                    'UPDATE availability_slot SET is_booked = false WHERE slot_id = $1',
                    [slotResult.rows[0].slot_id]
                );
            }
        }

        // Update session status and clear slot_id if cancelled
        const updateQuery = status === 'cancelled'
            ? 'UPDATE session SET status = $1, slot_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE session_id = $2 RETURNING *'
            : 'UPDATE session SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE session_id = $2 RETURNING *';

        const result = await pool.query(updateQuery, [status, sessionId]);

        res.json({
            message: 'Session status updated successfully',
            session: {
                sessionId: result.rows[0].session_id,
                mentorId: result.rows[0].mentor_id,
                menteeId: result.rows[0].mentee_id,
                status: result.rows[0].status,
                price: result.rows[0].price,
                zoomUrl: result.rows[0].zoom_url,
                scheduledStart: result.rows[0].scheduled_start,
                scheduledEnd: result.rows[0].scheduled_end,
                createdAt: result.rows[0].created_at,
                updatedAt: result.rows[0].updated_at
            }
        });
    } catch (error) {
        console.error('Update session status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
