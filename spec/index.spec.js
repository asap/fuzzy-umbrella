const FuzzyUmbrella = require('../src');
const config = {
  apikey: 'APIKEY',
  clientId: '1234',
  trackingId: '1111',
};

describe('FuzzyUmbrella', () => {
  let fuz;
  beforeEach(() => {
    fuz = new FuzzyUmbrella(config);
  });
  describe('#trackPageViews', () => {
    it('should track pageviews', () => {
      expect(fuz.trackPageView()).toBeTruthy();
    });
  });

  describe('#trackEvents', () => {
    it('should track events', () => {
      expect(fuz.trackEvent('my category', 'my action')).toBeTruthy();
    });
    it('requires category', () => {});
    it('requires action', () => {});
    it('should handle optional params', () => {});
  });

  describe('#buildUrl', () => {
    it('should build a pageView url', () => {
      const params = {
        t: 'TEST EVENT',
        ec: 'TEST CATEGORY',
        ea: 'TEST ACTION',
        el: 'TEST LABEL',
        ev: 'TEST VALUE',
      };

      const pageViewUrl = [
        'https://google-analytics.com/collect?v=1',
        'tid=' + config.trackingId,
        'cid=' + config.clientId,
        't=TEST%20EVENT',
        'ec=TEST%20CATEGORY',
        'ea=TEST%20ACTION',
        'el=TEST%20LABEL',
        'ev=TEST%20VALUE',
      ].join('&');
      expect(fuz.buildUrl(params)).toBe(pageViewUrl);
    });
    it('should build an event url', () => {});
    it('should NOT return undefined if no params', () => {
      const invalidParams = {};
      expect(fuz.buildUrl(invalidParams)).not.toContain('undefined');
    });

    it('should ignores unknown params', () => {
      const invalidParams = {
        bacon: 'tasty'
      };
      expect(fuz.buildUrl(invalidParams)).not.toContain('tasty');
    });

    it('should NOT return undefined if no params', () => {
      const invalidParams = {
        t: null,
      };
      expect(fuz.buildUrl(invalidParams)).not.toContain('undefined');
      expect(fuz.buildUrl(invalidParams)).not.toContain('null');
    });
  });
});
