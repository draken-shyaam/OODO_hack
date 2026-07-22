import { http, HttpResponse } from 'msw';
import { seedData } from '../seed/data';

export const handlers = [
  // Auth Handlers
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as any;
    const { loginId, password } = body;
    
    // Simplistic mock login
    if (loginId && password) {
      return HttpResponse.json({
        token: 'mock-jwt-token',
        user: seedData.users[0], // Mahesh Gupta (Admin)
      });
    }
    
    return new HttpResponse('Unauthorized', { status: 401 });
  }),
  
  // Products
  http.get('/api/products', () => {
    return HttpResponse.json(seedData.products);
  }),
  
  // Dashboard Metrics (Mocked)
  http.get('/api/dashboard/metrics', () => {
    return HttpResponse.json({
      sales: { all: 15, my: 5 },
      purchase: { all: 8, my: 2 },
      manufacturing: { all: 12, my: 4 }
    });
  })
];
