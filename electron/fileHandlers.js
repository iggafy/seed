import { ipcMain, app } from 'electron';
import fs from 'fs/promises';
import path from 'path';

// ensure seeds directory exists
async function getSeedsDir() {
    const userDataPath = app.getPath('userData');
    const seedsPath = path.join(userDataPath, 'seeds');
    try {
        await fs.access(seedsPath);
    } catch {
        await fs.mkdir(seedsPath, { recursive: true });
    }
    return seedsPath;
}

export function setupFileHandlers() {
    // Save Seed
    ipcMain.handle('seed:save', async (event, seedFile) => {
        try {
            const dir = await getSeedsDir();
            const filePath = path.join(dir, `${seedFile.id}.json`);
            // Update lastModified
            const toSave = { ...seedFile, lastModified: Date.now() };
            await fs.writeFile(filePath, JSON.stringify(toSave, null, 2));
            return { success: true, lastModified: toSave.lastModified };
        } catch (error) {
            console.error("Failed to save seed:", error);
            return { error: error.message };
        }
    });

    // List Seeds
    ipcMain.handle('seed:list', async () => {
        try {
            const dir = await getSeedsDir();
            const files = await fs.readdir(dir);
            const seeds = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(dir, file);
                    try {
                        const content = await fs.readFile(filePath, 'utf-8');
                        const data = JSON.parse(content);
                        // Return metadata only for the list to be lightweight
                        seeds.push({
                            id: data.id,
                            name: data.name,
                            lastModified: data.lastModified || 0,
                            nodeCount: data.data?.nodes?.length || 0,
                            mode: data.mode
                        });
                    } catch (e) {
                        console.error(`Error parsing seed ${file}`, e);
                    }
                }
            }
            // Sort by new
            return seeds.sort((a, b) => b.lastModified - a.lastModified);
        } catch (error) {
            console.error("Failed to list seeds:", error);
            return [];
        }
    });

    // Load Seed
    ipcMain.handle('seed:load', async (event, id) => {
        try {
            const dir = await getSeedsDir();
            const filePath = path.join(dir, `${id}.json`);
            const content = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            console.error("Failed to load seed:", error);
            return { error: error.message };
        }
    });

    // Delete Seed
    ipcMain.handle('seed:delete', async (event, id) => {
        try {
            const dir = await getSeedsDir();
            const filePath = path.join(dir, `${id}.json`);
            await fs.unlink(filePath);
            return { success: true };
        } catch (error) {
            console.error("Failed to delete seed:", error);
            return { error: error.message };
        }
    });
}
