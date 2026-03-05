
import { Request, Response, NextFunction } from 'express';
import { InstrumentService } from '../services/service.instrument';
import { sendSuccess } from '../utils/ApiResponse';

export const InstrumentController = {
    async syncInstruments(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await InstrumentService.syncInstruments();
            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    },

    async getInstruments(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await InstrumentService.getInstruments(req.query);
            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    }
};
