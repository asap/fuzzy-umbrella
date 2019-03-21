const axios = require('axios');
const uuidv4 = require('uuid/v4');

const URL_PREFIX = 'https://google-analytics.com/batch';
const BATCH_LENGTH = 20;
const BATCH_RETRY = 3 * 1000; // seconds

class FuzzyUmbrella {
  constructor(config) {
    const { debug, trackingId: tid, clientId: cid, window: _window } = config;

    this.activeBatch = [];
    this.batch = [];
    this.isRetrying = false;
    this.tid = tid;
    this.cid = cid || uuidv4();
    this.debug = debug || false;
    this.timeout;
    this.window = _window || window;

    this.window.onfocus = () => {
      this.flushBatch();
    };

    this.log('Initialized Fuzzy Umbrella', this);
  }

  trackPageView(hostname, page, title) {
    if (!hostname || !page || !title) {
      throw new Error('Missing Pageview Parameters');
    }

    // v=1              // Version.
    // &tid=UA-XXXXX-Y  // Tracking ID / Property ID.
    // &cid=555         // Anonymous Client ID.
    //
    // &t=pageview      // Pageview hit type.
    // &dh=mydemo.com   // Document hostname.
    // &dp=/home        // Page.
    // &dt=homepage     // Title.

    const params = {
      t: 'pageview',
      dh: hostname,
      dp: page,
      dt: title,
    };

    return this.addToBatch(params);
  }

  trackEvent(category, action, label, value) {
    if (!category || !action) {
      throw new Error('Missing Event Parameters');
    }
    // v=1              // Version.
    // &tid=UA-XXXXX-Y  // Tracking ID / Property ID.
    // &cid=555         // Anonymous Client ID.
    //
    // &t=event         // Event hit type
    // &ec=video        // Event Category. Required.
    // &ea=play         // Event Action. Required.
    // &el=holiday      // Event label.
    // &ev=300          // Event value.

    const params = {
      t: 'event',
      ec: category,
      ea: action,
      el: label,
      ev: value,
    };

    return this.addToBatch(params);
  }

  // Private methods
  addToBatch(params) {
    const query = this.combineParams(params);
    this.batch.push(query);
    this.log('batch updated', this.batch);
    if (this.batch.length > BATCH_LENGTH - 1 && !this.isRetrying) {
      // Break up requests to be under BATCH_LENGTH
      // in case we've been offline for a bit
      this.activeBatch = this.batch.splice(0, BATCH_LENGTH);
      this.flushBatch();
    }
  }

  clearRetry() {
    this.isRetrying = false;
    clearTimeout(this.timeout);
  }

  clearBatch() {
    this.activeBatch = [];
    this.log('active batch cleared', this.activeBatch);
  }

  flushBatch() {
    if (this.activeBatch.length === 0 && this.batch.length === 0) {
      this.log('batch are empty. skipping');
      return;
    }

    if (this.activeBatch.length === 0 && this.batch.length !== 0) {
      // Maybe start purging backlog
      this.log('active batch empty. clearing backlog');
      this.activeBatch = this.batch.splice(0, BATCH_LENGTH);
    }

    const batchQueryParams = this.activeBatch.join('\r\n');
    this.fireTracker(batchQueryParams);
    this.log('active', this.activeBatch);
    this.log('full', this.batch);
  }

  fireTracker(params) {
    this.log('queryParams', params);
    this.log('fire', URL_PREFIX);
    this.log('isRetrying?', this.isRetrying);

    return (
      axios
        .post(URL_PREFIX, params, {
          headers: { 'Content-Type': 'text/plain' },
        })
        .then(data => {
          this.log('response', data);

          // Clearout retry in case we're back online
          this.clearRetry();
          this.clearBatch();

          return data;
        })
        .catch(error => {
          this.log('Network Error', error);

          // Retry batch if we're offline
          this.retryFlushBatch();
        })
    );
  }

  retryFlushBatch() {
    this.clearRetry();
    this.isRetrying = true;
    this.timeout = setTimeout(() => {
      this.log('possibly offline. retrying batch');
      this.flushBatch();
    }, BATCH_RETRY);
  }

  combineParams(params) {
    const defaults = {
      v: 1,
      tid: this.tid,
      cid: this.cid,
    };

    const combinedParams = { ...defaults, ...params };

    const transactionQueryParams = Object.keys(combinedParams)
      .filter(param => combinedParams[param])
      .map(param => param + '=' + encodeURIComponent(combinedParams[param]));

    return transactionQueryParams.join('&');
  }

  buildUrl(params) {
    return `${URL_PREFIX}`;
  }

  log(message, object = null) {
    if (this.debug) {
      console.info(message, object);
    }
  }
}

module.exports = config => new FuzzyUmbrella(config);
