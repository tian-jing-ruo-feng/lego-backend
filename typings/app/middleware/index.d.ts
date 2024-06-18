// This file is created by egg-ts-helper@1.35.1
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportCustomError from '../../../app/middleware/customError';
import ExportJwtCustom from '../../../app/middleware/jwtCustom';
import ExportMyLogger from '../../../app/middleware/myLogger';

declare module 'egg' {
  interface IMiddleware {
    customError: typeof ExportCustomError;
    jwtCustom: typeof ExportJwtCustom;
    myLogger: typeof ExportMyLogger;
  }
}
