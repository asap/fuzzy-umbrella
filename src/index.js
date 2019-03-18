const URL_PREFIX = 'https://google-analytics.com/collect';

class FuzzyUmbrella {
  constructor(config) {
    // this.config = config;
    const { apikey, trackingId: tid, clientId: cid } = config;
    this.tid = tid;
    this.cid = cid;
  }

  trackPageView() {
    console.log('tid', this.tid);
    return true;
  }

  trackEvent() {
    // v=1              // Version.
    // &tid=UA-XXXXX-Y  // Tracking ID / Property ID.
    // &cid=555         // Anonymous Client ID.
    //
    // &t=event         // Event hit type
    // &ec=video        // Event Category. Required.
    // &ea=play         // Event Action. Required.
    // &el=holiday      // Event label.
    // &ev=300          // Event value.
    return true;
  }

  // Private methods
  fireTracker(url) {}

  buildUrl(params) {
    const defaults = {
      v: 1,
      tid: this.tid,
      cid: this.cid, // TODO: How do we generate this?
    };


    // TODO: Should have whitelist

    const combinedParams = { ...defaults, ...params };

    const transactionQueryParams = Object.keys(combinedParams).map(
      param => param + '=' + encodeURIComponent(combinedParams[param]),
    );

    return `${URL_PREFIX}?${transactionQueryParams.join('&')}`;
  }
}

module.exports = FuzzyUmbrella;
