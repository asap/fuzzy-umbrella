const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const mock = new MockAdapter(axios);

const FuzzyUmbrella = require('../src');

// Create a window spy
const window = {
  onfocus: jasmine.createSpy().and.callThrough(),
};

const config = {
  clientId: '1234',
  trackingId: 'UA-8179813-3',
  window,
};

describe('FuzzyUmbrella', () => {
  let fuz;
  beforeEach(() => {
    fuz = FuzzyUmbrella(config);

    const mockURL = /^https:\/\/google-analytics.com\//;

    mock.onPost(mockURL).reply(200);
  });
  describe('#trackPageViews', () => {
    it('should add an event to the batch', () => {
      expect(fuz.batch.length).toBe(0);
      fuz.trackPageView('mysite.com', '/somepage', 'Some Random Page'),
        expect(fuz.batch.length).toBe(1);
    });

    it('should require params', () => {
      expect(() => {
        fuz.trackPageView();
      }).toThrow(new Error('Missing Pageview Parameters'));
    });
  });

  describe('#trackEvents', () => {
    it('should add an event to the batch', () => {
      expect(fuz.batch.length).toBe(0);
      fuz.trackEvent('Button', 'Click', 'Interaction', '124');
      expect(fuz.batch.length).toBe(1);
    });

    it('should require params', () => {
      expect(() => {
        fuz.trackEvent();
      }).toThrow(new Error('Missing Event Parameters'));
    });
  });

  describe('#combineParams', () => {
    it('should build a pageView url', () => {
      fuz.trackPageView('helloworld.localhost', '/hello-world', 'Hello World');
      const params = {
        t: 'pageview',
        dh: 'helloworld.localhost',
        dp: '/hello-world',
        dt: 'Hello World',
      };

      const pageViewQueryParams = [
        'v=1',
        'tid=' + config.trackingId,
        'cid=' + config.clientId,
        't=pageview',
        'dh=helloworld.localhost',
        'dp=%2Fhello-world',
        'dt=Hello%20World',
      ].join('&');
      expect(fuz.combineParams(params)).toBe(pageViewQueryParams);
    });
    it('should build an event url', () => {
      const params = {
        t: 'TEST EVENT',
        ec: 'TEST CATEGORY',
        ea: 'TEST ACTION',
        el: 'TEST LABEL',
        ev: 'TEST VALUE',
      };

      const eventQueryParams = [
        'v=1',
        'tid=' + config.trackingId,
        'cid=' + config.clientId,
        't=TEST%20EVENT',
        'ec=TEST%20CATEGORY',
        'ea=TEST%20ACTION',
        'el=TEST%20LABEL',
        'ev=TEST%20VALUE',
      ].join('&');
      expect(fuz.combineParams(params)).toBe(eventQueryParams);
    });
  });

  describe('#flushBatch', () => {
    it('should empty the batch after 20 requests', () => {
      spyOn(fuz, 'flushBatch');

      expect(fuz.activeBatch.length).toBe(0);
      expect(fuz.batch.length).toBe(0);

      for (var i = 0; i < 19; i++) {
        fuz.trackPageView(
          'helloworld.localhost',
          '/hello-world',
          'Hello World',
        );
      }

      expect(fuz.activeBatch.length).toBe(0);
      expect(fuz.batch.length).toBe(19);
      expect(fuz.flushBatch).not.toHaveBeenCalled();

      fuz.trackPageView('helloworld.localhost', '/hello-world', 'Hello World');

      expect(fuz.activeBatch.length).toBe(20);
      expect(fuz.batch.length).toBe(0);
      expect(fuz.flushBatch).toHaveBeenCalled();
    });

    it('should group batches to no more than 20 requests', () => {
      spyOn(fuz, 'flushBatch');

      expect(fuz.activeBatch.length).toBe(0);
      expect(fuz.batch.length).toBe(0);

      for (var i = 0; i < 30; i++) {
        fuz.trackPageView(
          'helloworld.localhost',
          '/hello-world',
          'Hello World',
        );
      }

      expect(fuz.activeBatch.length).toBe(20);
      expect(fuz.batch.length).toBe(10);

      for (var i = 0; i < 9; i++) {
        fuz.trackPageView(
          'helloworld.localhost',
          '/hello-world',
          'Hello World',
        );
      }

      expect(fuz.activeBatch.length).toBe(20);
      expect(fuz.batch.length).toBe(19);
    });

    it('should trigger a GA batch request', () => {
      spyOn(fuz, 'fireTracker');
      for (var i = 0; i < 19; i++) {
        fuz.trackPageView(
          'helloworld.localhost',
          '/hello-world',
          'Hello World',
        );
      }
      expect(fuz.fireTracker).toHaveBeenCalledTimes(0);
      fuz.trackPageView('helloworld.localhost', '/hello-world', 'Hello World');
      expect(fuz.fireTracker).toHaveBeenCalledTimes(1);
    });
    it("should retry sending if 'offline'", async () => {
      const mockURL = /^https:\/\/google-analytics.com\//;

      mock.onPost(mockURL).networkError();

      spyOn(fuz, 'retryFlushBatch');
      for (var i = 0; i < 30; i++) {
        await fuz.trackPageView(
          'helloworld.localhost',
          '/hello-world',
          'Hello World',
        );
      }
      expect(fuz.activeBatch.length).toBe(20);
      expect(fuz.batch.length).toBe(10);
      expect(fuz.retryFlushBatch).toHaveBeenCalledTimes(1);
    });
  });
});
