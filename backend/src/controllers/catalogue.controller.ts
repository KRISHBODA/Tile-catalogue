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
  async uploadPart(req:AuthenticatedRequest,res:Response,next:NextFunction) { try{ await catalogueService.uploadPart(req.user!.id,String(req.params.upload),Number(req.params.index),req.body);ApiResponse.success(res,{uploaded:true}); }catch(e){next(e);} },
  async finishUpload(req:AuthenticatedRequest,res:Response,next:NextFunction) { try{ ApiResponse.success(res,await catalogueService.finishUpload(req.user!.id,String(req.params.upload),req.body.count,req.body.size)); }catch(e){next(e);} },
  async mediaInfo(req:AuthenticatedRequest,res:Response,next:NextFunction) { try{ ApiResponse.success(res,await catalogueService.mediaInfo(req.user!.id,String(req.params.id))); }catch(e){next(e);} },
  async mediaPart(req:AuthenticatedRequest,res:Response,next:NextFunction) { try{
    const id=String(req.params.id),bytes=await catalogueService.mediaPart(req.user!.id,id,Number(req.params.index));
    res.setHeader('Cache-Control','private, max-age=3600');res.setHeader('X-Content-Type-Options','nosniff');res.type(id.split('.').pop()!);res.send(bytes);
  }catch(e){next(e);} },
  async media(req:AuthenticatedRequest,res:Response,next:NextFunction) { try{
    const id=String(req.params.id), bytes=await catalogueService.media(req.user!.id,id);
    res.setHeader('Cache-Control','private, max-age=3600');res.setHeader('X-Content-Type-Options','nosniff');
    res.type(id.split('.').pop()!); res.send(bytes);
  }catch(e){next(e);} },
};
