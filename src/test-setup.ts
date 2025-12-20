/**
 * Jest setup file to polyfill globals required by cheerio/undici
 */

// Polyfill File for undici (required by cheerio in Node.js < 20 or in jest environment)
if (typeof global.File === 'undefined') {
  (global as any).File = class File {
    constructor(bits: any, name: any, options: any) {
      (this as any).bits = bits;
      (this as any).name = name;
      (this as any).options = options;
    }
  };
}

// Polyfill FormData if needed
if (typeof global.FormData === 'undefined') {
  (global as any).FormData = class FormData {
    private data: Map<string, any>;
    
    constructor() {
      this.data = new Map();
    }
    
    append(name: string, value: any) {
      this.data.set(name, value);
    }
    
    get(name: string) {
      return this.data.get(name);
    }
  };
}

// Polyfill Headers if needed
if (typeof global.Headers === 'undefined') {
  (global as any).Headers = class Headers {
    private headers: Map<string, string>;
    
    constructor(init?: any) {
      this.headers = new Map(Object.entries(init || {}));
    }
    
    get(name: string) {
      return this.headers.get(name);
    }
    
    set(name: string, value: string) {
      this.headers.set(name, value);
    }
  };
}
