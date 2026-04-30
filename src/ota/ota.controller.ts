import { Controller, Query, Body, All, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import * as fs from 'fs';
import * as path from 'path';

@Controller('ota')
export class OtaController {
    // Newer Capgo versions use POST, while older ones use GET
    @All('check')
    @Public()
    async checkUpdate(
        @Query() query: Record<string, unknown>,
        @Body() body: Record<string, unknown>,
        @Query('id') queryId?: string,
        @Query('version') queryVersion?: string,
        @Headers() headers?: Record<string, string>
    ) {
        try {
            // Capgo sends version and id in various places depending on version/config
            const appId = queryId || (body?.id as string) || (headers?.['x-capacitor-updater-id'] as string) || 'unknown';
            const currentVersion = queryVersion || (body?.version as string) || (headers?.['x-capacitor-updater-version'] as string);
            const fallbackVersion = (query?.current_version as string) || (body?.current_version as string);
            
            const actualCurrentVersion = currentVersion || fallbackVersion || 'unknown';

            const configPath = path.resolve(process.cwd(), 'ota.config.json');

            if (!fs.existsSync(configPath)) {
                return {
                    success: false,
                    error: 'OTA configuration not found'
                };
            }

            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

            console.log(`📡 OTA Request (${appId}): Locally=${actualCurrentVersion}, Latest=${config.latest_version}`);
            
            // If versions match, Capgo expects a 204 No Content or empty
            if (config.latest_version === actualCurrentVersion) {
                console.log(`✅ Version matches (${actualCurrentVersion}). No update needed.`);
                return null;
            }

            console.log(`🚀 Update available: ${actualCurrentVersion} -> ${config.latest_version}`);

            // Return latest info in the format Capgo expects
            return {
                version: config.latest_version,
                url: config.update_url,
                name: config.latest_version,
                notes: config.release_notes,
                min_required: config.min_required_version
            };
        } catch (e) {
            console.error('OTA Check Error:', e);
            return null;
        }
    }

    // Endpoint to securely download the update package via API (for better CORS/Secure support)
    @Get('download')
    @Public()
    async downloadUpdate(@Res() res: Response) {
        try {
            // Check both root and public paths for maximum deployment compatibility
            const paths = [
                path.resolve(process.cwd(), 'public/dist.zip'),
                path.resolve(process.cwd(), 'dist.zip'),
                path.resolve(__dirname, '..', 'public/dist.zip')
            ];

            const zipPath = paths.find(p => fs.existsSync(p));

            if (!zipPath) {
                const debugInfo = {
                    message: 'Update package not found',
                    cwd: process.cwd(),
                    searched_paths: paths,
                    exists: paths.map(p => ({ path: p, exists: fs.existsSync(p) }))
                };
                console.error('❌ OTA Download Error:', debugInfo);
                return res.status(404).json(debugInfo);
            }

            console.log('📦 OTA: Streaming dist.zip to client via API...');
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', 'attachment; filename=dist.zip');

            const fileStream = fs.createReadStream(zipPath);
            fileStream.pipe(res);
        } catch (e) {
            console.error('OTA Download Failure:', e);
            res.status(500).send('Download failed');
        }
    }
}
