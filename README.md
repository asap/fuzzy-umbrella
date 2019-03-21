# Fuzzy Umbrella

Google Analytics API SDK

## Getting Started

* [Install Node](https://nodejs.org/en/download/)
* [Install NVM](https://github.com/creationix/nvm)
* Clone Repo and `cd fuzzy-umbrella`
* run `nvm install` (notice the V) to use the proper node version
* run `npm install` to install packages
* run `npm run dev` (for dev mode)
* run `npm test` for tests ( or `npm run watch` for tests in watch mode)

### Using the SDK

* run `npm run build` will create/update sdk in `/build` folder
* copy `/build/fuzzy-umbrella.sdk.js` to your project
* include the following snippet in your html body:

```
  // HMTL HEAD
  <script src="/path/to/fuzzy-umbrella.sdk.js"></script>
  
  // HTML Footer
    <script>
      (function(trackingId) {
        window.fuz = FuzzyUmbrella({
          trackingId: trackingId,
          debug: true,
          window: window
        });
      })('ENTER GOOGLE ANALYTICS TRACKING ID');
    </script>

```

### Tracking

#### Pageviews
```
 fuz.trackPageView('hostname', '/page', 'Page Title');
```

* `hostname` **(required)**: hostname of your page. i.e. `github.com`
* `/page` **(required)**: should be the current page. i.e. `/asap/fuzzy-umbrella`
* `title` **(required)**: should be the current page title. i.e. `Fuzzy Umbrella`

#### Events

```
  fuz.trackEvent('Button', 'Click', 'Interaction', '124');
```

* `category` **(required)** : classification of the event. i.e. `video`
* `action` **(required)** : describes what kind of action. i.e. `play` or `click`
* `label`: optional subclassification. i.e. `Github Repo`
* `value`: optional point or monetary value for this interaction. i.e. `300`

## Considerations and Improvements

This library acts as a wrapper of Google Analytic's batch functionality. It's designed to store a set number (20 based on Google's spec) of interactions of a page and then dispatch through the Google Analytics Measurement Protocol.

Part of the design is to store the queries when the client goes "offline" and retry the messages once a connection comes back.

### Future Considerations

Potentially, these interactions could either be stored locally (i.e. LocalStorage) once a client browser session is terminated, so that they can be resent once the client starts up again.

Another option could be to have a timer that regularly purgest the batches when a client is idle.

Lastly, for optimization, the build process could minify or uglify the JS to reduce the download size.