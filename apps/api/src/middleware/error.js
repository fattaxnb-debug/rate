import logger from '../utils/logger.js';
import { NodeEnv } from '../constants/common.js';

const errorMiddleware = (err, req, res, next) => {
	console.error('[ERROR MIDDLEWARE] Error caught:', err);
	console.error('[ERROR MIDDLEWARE] Error message:', err.message);
	console.error('[ERROR MIDDLEWARE] Error stack:', err.stack);
	logger.error(err.message, err.stack);

	if (res.headersSent) {
		console.error('[ERROR MIDDLEWARE] Headers already sent');
		return next(err);
	}

	console.error('[ERROR MIDDLEWARE] Sending 500 response');
	res.status(500).json({
		message: 'Something went wrong!',
		...(process.env.NODE_ENV !== NodeEnv.Production && {
			error: {
				name: err.name,
				message: err.message,
				stack: err.stack,
			},
		}),
	});
};

export default errorMiddleware;
export { errorMiddleware };
