import { startMocking, stopMocking, setRequestSourceCallback, setCurrentScenario } from '../../mocks/native';
import { server } from '../../mocks/native';

describe('Request Log Source Logic', () => {
  let capturedRequests: Array<{ requestId: string; source: 'msw' | 'real'; handler?: string }> = [];

  beforeEach(() => {
    capturedRequests = [];
    setRequestSourceCallback((requestId, source, handler) => {
      capturedRequests.push({ requestId, source, handler });
    });
  });

  afterEach(async () => {
    stopMocking();
    setRequestSourceCallback(null);
    capturedRequests = [];
  });

  describe('MSW-stamped source', () => {
    it('should stamp source as "msw" when request is mocked', async () => {
      await startMocking();
      setCurrentScenario('happy-path');

      // Simulate a mocked request
      const mockRequest = new Request('http://localhost:3000/tasks', {
        headers: { 'x-devx-req-id': 'test-req-1' },
      });

      // Manually trigger MSW events
      server.events.emit('request:start', { request: mockRequest, requestId: 'test-req-1' });
      server.events.emit('response:mocked', { request: mockRequest });

      expect(capturedRequests).toHaveLength(1);
      expect(capturedRequests[0].requestId).toBe('test-req-1');
      expect(capturedRequests[0].source).toBe('msw');
    });

    it('should stamp source as "real" when request bypasses MSW', async () => {
      await startMocking();

      const mockRequest = new Request('http://localhost:3000/unhandled', {
        headers: { 'x-devx-req-id': 'test-req-2' },
      });

      server.events.emit('request:start', { request: mockRequest, requestId: 'test-req-2' });
      server.events.emit('request:unhandled', { request: mockRequest });

      expect(capturedRequests).toHaveLength(1);
      expect(capturedRequests[0].requestId).toBe('test-req-2');
      expect(capturedRequests[0].source).toBe('real');
    });

    it('should stamp source as "real" when response bypasses MSW', async () => {
      await startMocking();

      const mockRequest = new Request('http://localhost:3000/bypass', {
        headers: { 'x-devx-req-id': 'test-req-3' },
      });

      server.events.emit('request:start', { request: mockRequest, requestId: 'test-req-3' });
      server.events.emit('response:bypass', { request: mockRequest });

      expect(capturedRequests).toHaveLength(1);
      expect(capturedRequests[0].requestId).toBe('test-req-3');
      expect(capturedRequests[0].source).toBe('real');
    });
  });

  describe('Fallback when there is no stamp', () => {
    it('should handle requests without x-devx-req-id header', async () => {
      await startMocking();

      const mockRequest = new Request('http://localhost:3000/tasks', {
        headers: {},
      });

      // Events should not fire without request ID
      server.events.emit('request:start', { request: mockRequest, requestId: '' });
      server.events.emit('response:mocked', { request: mockRequest });

      // Should not capture requests without ID
      expect(capturedRequests).toHaveLength(0);
    });
  });

  describe('Scenario and source switches', () => {
    it('should track scenario changes', async () => {
      await startMocking();
      
      setCurrentScenario('happy-path');
      const request1 = new Request('http://localhost:3000/tasks', {
        headers: { 'x-devx-req-id': 'req-1' },
      });
      server.events.emit('request:start', { request: request1, requestId: 'req-1' });
      server.events.emit('response:mocked', { request: request1 });

      setCurrentScenario('slow-loading');
      const request2 = new Request('http://localhost:3000/tasks', {
        headers: { 'x-devx-req-id': 'req-2' },
      });
      server.events.emit('request:start', { request: request2, requestId: 'req-2' });
      server.events.emit('response:mocked', { request: request2 });

      expect(capturedRequests).toHaveLength(2);
      expect(capturedRequests[0].handler).toBe('happy-path');
      expect(capturedRequests[1].handler).toBe('slow-loading');
    });
  });

  describe('No listener leak', () => {
    it('should not accumulate listeners after repeated toggles', async () => {
      // Start and stop multiple times
      await startMocking();
      stopMocking();
      
      await startMocking();
      stopMocking();
      
      await startMocking();

      // Fire an event once
      const mockRequest = new Request('http://localhost:3000/tasks', {
        headers: { 'x-devx-req-id': 'test-req-leak' },
      });

      server.events.emit('request:start', { request: mockRequest, requestId: 'test-req-leak' });
      server.events.emit('response:mocked', { request: mockRequest });

      // Should only capture once, not multiple times (no leak)
      expect(capturedRequests).toHaveLength(1);
      expect(capturedRequests[0].requestId).toBe('test-req-leak');
    });

    it('should remove all listeners on stopMocking', async () => {
      await startMocking();
      
      const request1 = new Request('http://localhost:3000/tasks', {
        headers: { 'x-devx-req-id': 'before-stop' },
      });
      server.events.emit('request:start', { request: request1, requestId: 'before-stop' });
      server.events.emit('response:mocked', { request: request1 });

      expect(capturedRequests).toHaveLength(1);
      
      stopMocking();
      capturedRequests = []; // Clear for next assertion

      // Events after stopMocking should not trigger callbacks
      const request2 = new Request('http://localhost:3000/tasks', {
        headers: { 'x-devx-req-id': 'after-stop' },
      });
      server.events.emit('request:start', { request: request2, requestId: 'after-stop' });
      server.events.emit('response:mocked', { request: request2 });

      expect(capturedRequests).toHaveLength(0);
    });

    it('should handle multiple start/stop cycles without leaking', async () => {
      const iterations = 5;
      
      for (let i = 0; i < iterations; i++) {
        await startMocking();
        
        const mockRequest = new Request('http://localhost:3000/tasks', {
          headers: { 'x-devx-req-id': `req-${i}` },
        });
        
        server.events.emit('request:start', { request: mockRequest, requestId: `req-${i}` });
        server.events.emit('response:mocked', { request: mockRequest });
        
        stopMocking();
      }

      // Each iteration should have captured exactly one request
      expect(capturedRequests).toHaveLength(iterations);
      
      // Verify each request was captured once
      for (let i = 0; i < iterations; i++) {
        expect(capturedRequests[i].requestId).toBe(`req-${i}`);
      }
    });
  });
});
