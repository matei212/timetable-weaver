/**
 * Type definitions for html-pdf
 */
declare module 'html-pdf' {
  export interface PdfOptions {
    format?: string;
    orientation?: 'portrait' | 'landscape';
    border?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
    [key: string]: any;
  }

  export interface PdfResult {
    filename: string;
  }

  export function create(html: string, options?: PdfOptions): {
    toFile(filename: string, callback: (err: Error | null, res: PdfResult) => void): void;
  };
} 