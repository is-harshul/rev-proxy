import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { ProxyConfig, SetupAnswers } from './types';

export class ConfigManager {
  private configPath: string;
  private defaultConfig: ProxyConfig;

  constructor() {
    this.configPath = path.join(os.homedir(), '.reverse-proxy-manager-config');
    this.defaultConfig = {
      nginxConf: '/opt/homebrew/etc/nginx/nginx.conf',
      hostsFile: '/private/etc/hosts',
      nginxBin: '/opt/homebrew/bin/nginx',
      localPort: 8004,
      backupDir: path.join(os.homedir(), '.proxy-backups')
    };
  }

  async loadConfig(): Promise<ProxyConfig> {
    try {
      if (await fs.pathExists(this.configPath)) {
        const configData = await fs.readJson(this.configPath);
        return { ...this.defaultConfig, ...configData };
      }
      return this.defaultConfig;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error}`);
    }
  }

  async saveConfig(answers: SetupAnswers): Promise<void> {
    try {
      const config: ProxyConfig = {
        nginxConf: answers.nginxConf,
        hostsFile: answers.hostsFile,
        nginxBin: answers.nginxBin,
        localPort: answers.localPort,
        backupDir: path.join(os.homedir(), '.proxy-backups')
      };

      await fs.ensureDir(path.dirname(this.configPath));
      await fs.writeJson(this.configPath, config, { spaces: 2 });
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error}`);
    }
  }

  async validateConfig(config: ProxyConfig): Promise<boolean> {
    try {
      // Check if nginx config file exists
      if (!(await fs.pathExists(config.nginxConf))) {
        throw new Error(`Nginx config file not found: ${config.nginxConf}`);
      }

      // Check if hosts file exists
      if (!(await fs.pathExists(config.hostsFile))) {
        throw new Error(`Hosts file not found: ${config.hostsFile}`);
      }

      // Check if nginx binary exists
      if (!(await fs.pathExists(config.nginxBin))) {
        throw new Error(`Nginx binary not found: ${config.nginxBin}`);
      }

      // Ensure backup directory exists
      await fs.ensureDir(config.backupDir);

      return true;
    } catch (error) {
      throw new Error(`Configuration validation failed: ${error}`);
    }
  }

  getConfigPath(): string {
    return this.configPath;
  }

  getDefaultConfig(): ProxyConfig {
    return { ...this.defaultConfig };
  }
}
