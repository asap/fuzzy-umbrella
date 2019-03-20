const axios = require('axios');
const uuidv4 = require('uuid/v4');

const URL_PREFIX = 'https://google-analytics.com/batch';
const BATCH_LENGTH = 20;
const BATCH_RETRY = 3 * 1000; // seconds

class FuzzyUmbrella {
  constructor(config) {
    const { debug, trackingId: tid, clientId: cid } = config;

    this.batch = [];
    this.tid = tid;
    this.cid = cid || uuidv4();
    this.debug = debug || false;
    this.timeout;

    window.onfocus = () => {
      this.flushBatch();
    }

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

    // console.log('tid', this.tid);

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
      throw new Error('Missing Pageview Parameters');
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
    if (this.batch.length > BATCH_LENGTH - 1) {
      this.flushBatch();
    }
  }

  clearRetry() {
    clearTimeout(this.timeout);
    // clearTimeout(window.fuzzyTimer);
  }

  clearBatch() {
    this.batch = [];
    this.log('batch cleared', this.batch);
  }

  flushBatch() {
    const batchQueryParams = this.batch.join('\r\n');
    this.fireTracker(batchQueryParams);
  }

  fireTracker(params) {
    const url = this.buildUrl(params);
    this.log('queryParams', params);
    this.log('fire', url);

    return axios
      .post(url)
      .then(data => {
        this.log('response', data);

        // Clearout retry in case we're back online
        this.clearRetry();
        this.clearBatch();

        return data;
      })
      .catch(error => {
        console.error(error);

        // Retry batch if we're offline
        this.retryFlushBatch();
      });
  }

  retryFlushBatch() {
    this.clearRetry();
    this.timeout = setTimeout(()=> {
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
    return `${URL_PREFIX}?${params}`;
  }

  log(message, object = null) {
    if (this.debug) {
      console.info(message, object);
    }
  }
}

module.exports = config => new FuzzyUmbrella(config);
