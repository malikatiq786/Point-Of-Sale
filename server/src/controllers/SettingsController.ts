import { Request, Response } from 'express';
import { storage } from '../../storage';

// HTTP Status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

export class SettingsController {
  /**
   * Get a specific system setting by key
   */
  getSetting = async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      
      const setting = await storage.getSetting(key);
      
      if (setting) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: setting
        });
      } else {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Setting not found'
        });
      }
    } catch (error) {
      console.error('SettingsController: Error getting setting:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to get setting'
      });
    }
  };

  /**
   * Update or create a system setting
   */
  updateSetting = async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      if (!value && value !== '0') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Setting value is required'
        });
      }
      
      const setting = await storage.updateSetting(key, value);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: setting
      });
    } catch (error) {
      console.error('SettingsController: Error updating setting:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to update setting'
      });
    }
  };
}