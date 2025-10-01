import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ValidationResult, BackupInfo } from './types';

const execAsync = promisify(exec);

export class Utils {
  static validateUrl(url: string): ValidationResult {
    try {
      // Basic URL validation
      const urlPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*$/;
      
      if (!url || typeof url !== 'string') {
        return { isValid: false, error: 'URL is required' };
      }

      if (url.length < 3) {
        return { isValid: false, error: 'URL must be at least 3 characters long' };
      }

      if (url.length > 253) {
        return { isValid: false, error: 'URL must be less than 253 characters' };
      }

      if (!urlPattern.test(url)) {
        return { isValid: false, error: 'Invalid URL format' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: `Validation error: ${error}` };
    }
  }

  static validatePort(port: number): ValidationResult {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return { isValid: false, error: 'Port must be a number between 1 and 65535' };
    }
    return { isValid: true };
  }

  static async createBackup(nginxConf: string, hostsFile: string, backupDir: string): Promise<BackupInfo> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    const nginxBackup = path.join(backupDir, `nginx_${timestamp}.conf`);
    const hostsBackup = path.join(backupDir, `hosts_${timestamp}`);

    try {
      await fs.ensureDir(backupDir);
      await fs.copy(nginxConf, nginxBackup);
      await fs.copy(hostsFile, hostsBackup);

      return {
        nginxBackup,
        hostsBackup,
        timestamp
      };
    } catch (error) {
      throw new Error(`Failed to create backup: ${error}`);
    }
  }

  static async testNginxConfig(nginxBin: string): Promise<boolean> {
    try {
      // Check if we're running as root
      const isRoot = process.getuid && process.getuid() === 0;
      
      if (isRoot) {
        // If running as root, test directly
        const { stdout, stderr } = await execAsync(`${nginxBin} -t`);
        return stderr.includes('syntax is ok') && stderr.includes('test is successful');
      } else {
        // If not running as root, try with sudo
        try {
          const { stdout, stderr } = await execAsync(`sudo ${nginxBin} -t`);
          return stderr.includes('syntax is ok') && stderr.includes('test is successful');
        } catch {
          // If sudo fails, try without sudo (might work in some cases)
          const { stdout, stderr } = await execAsync(`${nginxBin} -t`);
          return stderr.includes('syntax is ok') && stderr.includes('test is successful');
        }
      }
    } catch (error) {
      return false;
    }
  }

  static async reloadNginx(nginxBin: string): Promise<boolean> {
    try {
      // Check if we're running as root
      const isRoot = process.getuid && process.getuid() === 0;
      
      if (isRoot) {
        // If running as root, reload directly
        await execAsync(`${nginxBin} -s reload`);
        return true;
      } else {
        // If not running as root, try with sudo
        try {
          await execAsync(`sudo ${nginxBin} -s reload`);
          return true;
        } catch {
          // If sudo fails, try without sudo
          await execAsync(`${nginxBin} -s reload`);
          return true;
        }
      }
    } catch (error) {
      return false;
    }
  }

  static generateNginxBlock(url: string, port: number): string {
    return `    # Reverse proxy entry for ${url}
    server {
        listen 80;
        server_name ${url};

        location / {
            proxy_pass http://127.0.0.1:${port};
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_redirect off;
        }
    }`;
  }

  static generateHostsEntry(url: string): string {
    return `127.0.0.1 ${url}`;
  }

  static async checkFileExists(filePath: string): Promise<boolean> {
    try {
      return await fs.pathExists(filePath);
    } catch {
      return false;
    }
  }

  static async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.ensureDir(dirPath);
    } catch (error) {
      throw new Error(`Failed to create directory ${dirPath}: ${error}`);
    }
  }

  static formatTimestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  }

  static async executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    try {
      return await execAsync(command);
    } catch (error: any) {
      throw new Error(`Command execution failed: ${error.message}`);
    }
  }

  // Improved method to find the correct insertion point in nginx config
  static findNginxInsertionPoint(content: string): { start: number; end: number } | null {
    const lines = content.split('\n');
    let httpBlockEnd = -1;
    let braceCount = 0;
    let inHttpBlock = false;

    // Find the end of the http block
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === 'http {') {
        inHttpBlock = true;
        braceCount = 1;
        continue;
      }
      
      if (inHttpBlock) {
        if (line.includes('{')) braceCount++;
        if (line.includes('}')) braceCount--;
        
        if (braceCount === 0) {
          httpBlockEnd = i;
          break;
        }
      }
    }

    if (httpBlockEnd !== -1) {
      // Insert before the closing brace of the http block
      return { start: httpBlockEnd, end: httpBlockEnd };
    }

    return null;
  }
}
