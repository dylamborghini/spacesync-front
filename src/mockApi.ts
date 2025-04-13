// src/services/mockApi.ts
export const mockApi = {
  login: async (username: string, password: string) => {
    // Just for testing - in a real app, don't hardcode credentials
    if (username === "test" && password === "password") {
      return { 
        success: true, 
        token: "mock-token-12345"
      };
    }
    return { success: false };
  },
  
  validateToken: async () => {
    return { valid: true };
  },
  
  getStatus: async () => {
    return {
      availablePhones: 5,
      busyPhones: 3,
      averageProcessingTime: 45000 // 45 seconds
    };
  },
  
  getTasks: async () => {
    return [
      {
        id: "task123",
        status: "completed",
        code: "function test() { return 42; }",
        createdAt: new Date().toISOString(),
        result: 42
      },
      {
        id: "task456",
        status: "processing",
        code: "function longTask() { /* complex calculation */ }",
        createdAt: new Date(Date.now() - 300000).toISOString(),
        estimatedCompletionTime: new Date(Date.now() + 600000).toISOString()
      }
    ];
  },
  
  submitTask: async (code: string, file: File | null) => {
    return {
      id: "newtask789",
      status: "pending",
      code: code || (file ? file.name : ""),
      fileName: file?.name,
      createdAt: new Date().toISOString()
    };
  }
};