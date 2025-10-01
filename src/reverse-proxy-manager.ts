import * as fs from 'fs-extra';
import { ProxyConfig, ProxyEntry, OperationResult } from './types';
import { Utils } from './utils';

export class ReverseProxyManager {
  private config: ProxyConfig;

  constructor(config: ProxyConfig) {
    this.config = config;
  }

  async addProxy(url: string, port?: number): Promise<OperationResult> {
    try {
      const actualPort = port || this.config.localPort;
      
      // Validate inputs
      const urlValidation = Utils.validateUrl(url);
      if (!urlValidation.isValid) {
        return { success: false, message: 'Invalid URL', error: urlValidation.error };
      }

      const portValidation = Utils.validatePort(actualPort);
      if (!portValidation.isValid) {
        return { success: false, message: 'Invalid port', error: portValidation.error };
      }

      // Check if entry already exists
      if (await this.entryExists(url)) {
        return { success: false, message: `Proxy entry for ${url} already exists` };
      }

      // Create backup
      const backup = await Utils.createBackup(
        this.config.nginxConf,
        this.config.hostsFile,
        this.config.backupDir
      );

      // Add nginx entry
      await this.addNginxEntry(url, actualPort);
      
      // Add hosts entry
      await this.addHostsEntry(url);

      // Test nginx configuration
      const nginxTest = await Utils.testNginxConfig(this.config.nginxBin);
      if (!nginxTest) {
        // Restore from backup if nginx test fails
        await this.restoreFromBackup(backup);
        return { success: false, message: 'Nginx configuration test failed. Changes reverted.' };
      }

      // Reload nginx
      const nginxReload = await Utils.reloadNginx(this.config.nginxBin);
      if (!nginxReload) {
        return { success: false, message: 'Failed to reload nginx. Please reload manually.' };
      }

      return {
        success: true,
        message: `Successfully added proxy for ${url}:${actualPort}`,
        data: { url, port: actualPort, backup }
      };
    } catch (error) {
      return { success: false, message: 'Failed to add proxy', error: String(error) };
    }
  }

  async removeProxy(url: string): Promise<OperationResult> {
    try {
      // Check if entry exists
      if (!(await this.entryExists(url))) {
        return { success: false, message: `No proxy entry found for ${url}` };
      }

      // Create backup
      const backup = await Utils.createBackup(
        this.config.nginxConf,
        this.config.hostsFile,
        this.config.backupDir
      );

      // Remove nginx entry
      await this.removeNginxEntry(url);
      
      // Remove hosts entry
      await this.removeHostsEntry(url);

      // Test nginx configuration
      const nginxTest = await Utils.testNginxConfig(this.config.nginxBin);
      if (!nginxTest) {
        // Restore from backup if nginx test fails
        await this.restoreFromBackup(backup);
        return { success: false, message: 'Nginx configuration test failed. Changes reverted.' };
      }

      // Reload nginx
      const nginxReload = await Utils.reloadNginx(this.config.nginxBin);
      if (!nginxReload) {
        return { success: false, message: 'Failed to reload nginx. Please reload manually.' };
      }

      return {
        success: true,
        message: `Successfully removed proxy for ${url}`,
        data: { url, backup }
      };
    } catch (error) {
      return { success: false, message: 'Failed to remove proxy', error: String(error) };
    }
  }

  async listProxies(): Promise<OperationResult> {
    try {
      const nginxEntries = await this.getNginxEntries();
      const hostsEntries = await this.getHostsEntries();

      return {
        success: true,
        message: 'Proxy entries retrieved successfully',
        data: {
          nginx: nginxEntries,
          hosts: hostsEntries
        }
      };
    } catch (error) {
      return { success: false, message: 'Failed to list proxies', error: String(error) };
    }
  }

  private async entryExists(url: string): Promise<boolean> {
    try {
      const nginxContent = await fs.readFile(this.config.nginxConf, 'utf8');
      return nginxContent.includes(`server_name ${url};`);
    } catch {
      return false;
    }
  }

  private async addNginxEntry(url: string, port: number): Promise<void> {
    const nginxBlock = Utils.generateNginxBlock(url, port);
    const nginxContent = await fs.readFile(this.config.nginxConf, 'utf8');
    
    // Use the improved insertion point finder
    const insertionPoint = Utils.findNginxInsertionPoint(nginxContent);
    
    if (!insertionPoint) {
      throw new Error('Could not find suitable insertion point in nginx configuration');
    }

    const lines = nginxContent.split('\n');
    lines.splice(insertionPoint.start, 0, nginxBlock);
    const newContent = lines.join('\n');

    await fs.writeFile(this.config.nginxConf, newContent);
  }

  private async removeNginxEntry(url: string): Promise<void> {
    const nginxContent = await fs.readFile(this.config.nginxConf, 'utf8');
    
    // Remove the entire server block for this URL
    const serverBlockRegex = new RegExp(
      `\\s*# Reverse proxy entry for ${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?\\s*\\}`,
      'g'
    );
    
    const newContent = nginxContent.replace(serverBlockRegex, '');
    await fs.writeFile(this.config.nginxConf, newContent);
  }

  private async addHostsEntry(url: string): Promise<void> {
    const hostsEntry = Utils.generateHostsEntry(url);
    const hostsContent = await fs.readFile(this.config.hostsFile, 'utf8');
    
    // Check if entry already exists
    if (hostsContent.includes(hostsEntry)) {
      return;
    }

    const newContent = `${hostsContent}\n${hostsEntry}\n`;
    await fs.writeFile(this.config.hostsFile, newContent);
  }

  private async removeHostsEntry(url: string): Promise<void> {
    const hostsContent = await fs.readFile(this.config.hostsFile, 'utf8');
    const hostsEntry = Utils.generateHostsEntry(url);
    
    const newContent = hostsContent.replace(new RegExp(`\\n?${hostsEntry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n?`, 'g'), '');
    await fs.writeFile(this.config.hostsFile, newContent);
  }

  private async getNginxEntries(): Promise<string[]> {
    try {
      const nginxContent = await fs.readFile(this.config.nginxConf, 'utf8');
      const serverNameRegex = /server_name\s+([^;]+);/g;
      const entries: string[] = [];
      let match;

      while ((match = serverNameRegex.exec(nginxContent)) !== null) {
        entries.push(match[1].trim());
      }

      return entries;
    } catch {
      return [];
    }
  }

  private async getHostsEntries(): Promise<string[]> {
    try {
      const hostsContent = await fs.readFile(this.config.hostsFile, 'utf8');
      const lines = hostsContent.split('\n');
      const entries: string[] = [];

      for (const line of lines) {
        if (line.includes('127.0.0.1') && line.trim() && !line.startsWith('#')) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 2) {
            entries.push(parts[1]);
          }
        }
      }

      return entries;
    } catch {
      return [];
    }
  }

  private async restoreFromBackup(backup: any): Promise<void> {
    try {
      await fs.copy(backup.nginxBackup, this.config.nginxConf);
      await fs.copy(backup.hostsBackup, this.config.hostsFile);
    } catch (error) {
      throw new Error(`Failed to restore from backup: ${error}`);
    }
  }
}
