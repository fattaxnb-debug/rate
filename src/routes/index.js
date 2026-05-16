import { Router } from 'express';
import healthCheck from './health-check.js';
import authRouter from './auth.js';
import clientsRouter from './clients.js';
import equipmentsRouter from './equipments.js';
import schedulesRouter from './schedules.js';
import reportsRouter from './reports.js';
import settingsRouter from './settings.js';
import reportPhotosRouter from './report-photos.js';
import statsRouter from './stats.js';
import migrateRouter from './migrate.js';
import pushSubscriptionsRouter from './push-subscriptions.js';
import db from '../config/database.js';

const router = Router();

export default () => {
    router.get('/health', healthCheck);
    console.log('Registering /auth route...');
    router.use('/auth', authRouter);
    
    // GET /users - Listar usuários com filtro opcional por role
    router.get('/users', async (req, res) => {
        try {
            const { role } = req.query;
            let query = 'SELECT id, email, name, role FROM users';
            const params = [];
            
            if (role) {
                query += ' WHERE role = ?';
                params.push(role);
            }
            
            query += ' ORDER BY name ASC';
            
            const [users] = await db.query(query, params);
            res.json({ data: users });
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ error: 'Erro ao buscar usuários' });
        }
    });
    
    console.log('Registering /clients route...');
    router.use('/clients', clientsRouter);
    console.log('Registering /equipments route...');
    router.use('/equipments', equipmentsRouter);
    console.log('Registering /schedules route...');
    router.use('/schedules', schedulesRouter);
    console.log('Registering /reports route...');
    router.use('/reports', reportsRouter);
    console.log('Registering /settings route...');
    router.use('/settings', settingsRouter);
    console.log('Registering /report-photos route...');
    router.use('/report-photos', reportPhotosRouter);
    console.log('Registering /stats route...');
    router.use('/stats', statsRouter);
    console.log('Registering /migrate route...');
    router.use('/migrate', migrateRouter);
    console.log('Registering /push-subscriptions route...');
    router.use('/push-subscriptions', pushSubscriptionsRouter);
    console.log('All routes registered');

    return router;
};