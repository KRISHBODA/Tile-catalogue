import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { catalogueService } from '../services/catalogue.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
export const catalogueController = {
  async list(req:AuthenticatedRequest,res:Response,next:NextFunction) { try{ ApiResponse.success(res,await catalogueService.list(req.user!.id)); }catch(e){next(e);} },
  async save(req:AuthenticatedRequest,res:Response,next:NextFunction) { try{ ApiResponse.success(res,await catalogueService.save(req.user!.id,req.user!.name,req.body.designs)); }catch(e){next(e);} },
  async options(req:AuthenticatedRequest,res:Response,next:NextFunction) { try{ ApiResponse.success(res,await catalogueService.options(req.user!.id)); }catch(e){next(e);} },
  async option(req:AuthenticatedRequest,res:Response,next:NextFunction) { try{ ApiResponse.success(res,await catalogueService.option(req.user!.id,req.body.option,req.body.remove===true)); }catch(e){next(e);} },
  async upload(req:AuthenticatedRequest,res:Response,next:NextFunction) { try{ ApiResponse.success(res,await catalogueService.upload(req.user!.id,req.body)); }catch(e){next(e);} },
  async media(req:AuthenticatedRequest,res:Response,next:NextFunction) { try{
    const id=String(req.params.id), bytes=await catalogueService.media(req.user!.id,id);
    res.setHeader('Cache-Control','private, max-age=3600');res.setHeader('X-Content-Type-Options','nosniff');
    res.type(id.split('.').pop()!); res.send(bytes);
  }catch(e){next(e);} },
};
