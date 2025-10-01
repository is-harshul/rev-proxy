export interface ProxyConfig {
  nginxConf: string;
  hostsFile: string;
  nginxBin: string;
  localPort: number;
  backupDir: string;
}

export interface ProxyEntry {
  url: string;
  port: number;
  nginxBlock: string;
  hostsEntry: string;
}

export interface BackupInfo {
  nginxBackup: string;
  hostsBackup: string;
  timestamp: string;
}

export interface CommandOptions {
  url?: string;
  port?: number;
  force?: boolean;
  config?: string;
  verbose?: boolean;
}

export interface SetupAnswers {
  nginxConf: string;
  hostsFile: string;
  nginxBin: string;
  localPort: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface OperationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}
