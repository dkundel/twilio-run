# Better Testing Support (Request For Comment/RFC)

## Background
With the Serverless API, the Serverless Toolkit and [function-templates] we've seen increasingly more complex applications being built on top of Twilio and with it an increased need for better test support.

In theory Functions can be tested the same way as any other regular Node.js function using a tool such as `jest`. However, Twilio Functions & Assets have a set of unique behaviors that make testing not quite as simple as it might look initially (more in the [Considerations section](#considerations-problems))

In the past we've pushed this burden onto the customer and asked them to figure it out while we did the same in projects such as [function-templates]. 

This RFC covers both the problems as well as a potential test story.

## Proposal

With the recent introduction and refactor of `@twilio/runtime-handler` we now have all Function execution specific logic in one package that can be versioned with changes in behavior. The `@twilio/runtime-handler` package that we [publish to npm](https://npm.im/@twilio/runtime-handler) exposes logic for local development under `@twilio/runtime-handler/dev`. 

If a customer changes their Runtime Handler version and internal implementations change, they shouldn't have to update their tests in accordance unless they change their Function code. 

Hence, the proposal is to include the test harness functionality directly into the `@twilio/runtime-handler/test`. 

## Considerations / Problems

Twilio Functions and Assets contain a set of behaviors that create hurdles when testing valid Functions. Some of these might be considered "bad practice" but are still valid and used by customers and therefore should be supported by our solution.

### Global Objects

When a Function is loaded a set of global objects are available that a customer can use. Among others:
- `Runtime.getAssets()`
- `Runtime.getFunctions()`
- `Runtime.getSync()`
- `Twilio.Response`
- `Twilio.*` (basically the entire Twilio Node.js library)

All of these are available even outside of the main `handler` function and therefore available when the Function originally gets loaded. For example the following is valid:

```js
const demo = require(Runtime.getAssets()['/demo.js'].path)

exports.handler = function(context, event, callback) {
  callback(null, { demo: demo })
}
```

Global objects are notoriously hard to test properly especially if you want to enable test parallelization. We should provide convenience methods to establish and clean up the global scope. Ideally while preserving the ability to parallelize.

### Local Require
Local require statements in general work in Twilio Functions, **however**, they come with a caveat. When Functions are being deployed, Twilio will rewrite the file names and the folder structure. This means that while `require('anotherFunction.protected.js')` would work locally, the correct way to require this Function would be `require(Runtime.getFunctions()['anotherFunction'].path))`

That means at the bare minimum we need to provide customers with the ability to:
1. Have valid results from `getFunctions()` and `getAssets()`
2. Provide a way for customers to stub those Functions/Assets by inserting fake ones

A bonus would be to make tests fail for requiring local files but that might not be possible for now and might have to be solved through a linter.

### Shared State / "Hot Functions"

In theory Function executions can share state if they are executed within a short time of each other by hoisting the variable that stores the state to the top. Example:

```js
let counter = 0;

exports.handler = function(context, event, callback) {
  counter++;
  callback(null, { counter });
}
```

This will increment the value of `counter` between each execution until there is no execution for a longer time at which point it will reset to 0. This behavior is called "cold" and "hot" Functions. In general it's not really encouraged to rely on it for anything valuable and in local development we disable this by default. However, things such as keeping a database connection established, might be a reason to use shared state. 

In which case we want to provide customers with the option to test both hot and cold Function behaviors.

### Environment Variables

The recommended way to access environment variables is through the `context.` object that is being passed as first argument to every Function execution. However, we've seen customers rely on `process.env` which contains the same values. The problem with this is that other systems including the JavaScript test runners might rely on these values and cause unintended side effects.

A solution should involve handling this situation while limiting the damage of side effects.

### Assets

Assets are generally considered static files but private Assets can be required through any Function at which point they'd have the same behaviors as outlined above. Private Assets can be used by customers to share logic between multiple Functions and therefore might want to be tested. 

## Principals

When designing our testing solution the following principals should be kept in mind:

1. Any valid Function should be testable
2. Basic unit testing functionality should work irrespective of the test runner (or lack there of when using `assert`)
3. Writing tests should feel easy and seamless.

## Design

The following is the proposed design for the test harness. It's inspired by our previous work in [function-templates]. The examples are written using `jest` and focus primarily on usage not implementation. Some references are mentioned but nothing has been actually tried and details might have to be adjusted during the implementation.

Not all of these need to be supported in a V1 release but are primarily there to help evaluate what to tackle first and see the big picture.

### Unit Tests

```js
const { setup, cleanup, getContext, TwilioResponse } = require('@twilio/runtime-handler/test');

// mocking another asset using jest
jest.mock('../assets/utils.private.js', () => {
  return {
    helper: jest.fn();
  }
}, { virtual: true });

// mocking another Node.js dependency
jest.mock('got', () => {
  return jest.fn();
});

const fakeHandler = jest.fn()

beforeEach(() => {
  setup({
    environment: {
      /* variables */
    },
    functions: {
      // specify a direct object that should be required instead of `require(Runtime.getFunctions()['anotherFunction'].path)`
      'anotherFunction': {
        handler: fakeHandler
      }
    },
    // we should have this as a separate flag because runtime-handler might pull the project twilio or the built-in twilio dependency.
    shouldMockTwilio: true
  })
})

afterEach(() => {
  // removes all global values
  // clears the require cache for Functions.
  cleanup();
})

describe('test demo function', () => {
  it('should call the other function', (done) => {
    // require has to be within test call for global objects to be available/updated between test runs
    const { handler } = require('../functions/demo.protected.js');
    const context = getContext();
    const event = { Body: 'Hello' }
    handler(context, event, (err, response) => {
      expect(err).toEqual(null);
      expect(response instanceof TwilioResponse).toBe(true);
      done();
    })
  })
});
```

### "Integration" Tests

The goal of "Integration" tests is to provide a simpler interface where you provide input and largely care about the output. You don't care much about the inner workings or even about whether `callback()` gets called with a `Twilio.Response` instance or a direct object. In this case we'll return a standardized response result that you can evaluate. 

It also provides the ability to keep Functions "hot" to test behavior of shared state.

#### Cold Starts

```js
const { runFunction } = require('@twilio/runtime-handler/test');

describe('testing demo function', () => {
  it('should reply with valid TwiML', () => {
    const result = await runFunction('../functions/demo.protected.js', { 
      environment: {},
      request: {
        query: {/*...*/},
        body: {/*...*/},
        headers: {/*...*/},
        cookies: {/*...*/}
      }
     });
    // have common helpers rather than having to decide yourself if the response is an object or an instance of Twilio.Response
    expect(result.isTwiML).toBe(true);
    expect(result.status).toBe(200);
  });
});
```

#### Hot Functions

```js
const { loadFunction } = require('@twilio/runtime-handler/test');

describe('testing demo function', () => {
  // this will make sure it keeps the state between executions
  let { runFunction, cooldown } = loadFunction('../functions/demo.projected.js', {
    environment: {},
  });

  afterAll(() => {
    // clean up 
    cooldown();
  })

  it('should reply with valid TwiML', () => {
    const result = await runFunction({
      request: {
        query: {/*...*/},
        body: {/*...*/},
        headers: {/*...*/},
        cookies: {/*...*/}
      }
     });
    expect(result.isTwiML).toBe(true);
    expect(result.status).toBe(200);
  });

  it('should remember the previous result', () => {
    const result = await runFunction({
      request: {
        query: {/*...*/},
        body: {/*...*/},
        headers: {/*...*/},
        cookies: {/*...*/}
      }
     });
    expect(result.isTwiML).toBe(true);
    expect(result.body).contains('Not a cold start');
  })
});
```

### End-to-End Tests

This is not truly E2E tests in the sense that nothing gets deployed to the Twilio Functions infrastructure. Instead it runs on the local infrastructure "emulating" the Functions environment. 

While we could deploy Functions to a test environment in the future to handle true E2E tests but we'd have to provide ways for customers to intercept outgoing HTTP traffic for example if they don't really want to write to a database for example or make API requests.

In the meantime this proposal is more the equivalent of running Cypress locally. 

```js
const { createTestServer } = require('@twilio/runtime-handler/test');

let server;
beforeAll(() => {
  server = createTestServer({
    assets: '../assets',
    functions: '../functions',
    environment: {
    },
    // to simulate protected
    fakeCredentials: true,
    // intercept twilio requests
    interceptTwilio: true
  });
});

afterAll(() => {
  server.shutdown();
});

describe('testing demo function', () => {
  test('should be protected', () => {
    const response = await server.fetch('/demo');
    expect(response.status).toBe(401);
  })

  test('should match snapshot', () => {
    const response = await server.fetch('/demo', { sendTestSignature: true });
    expect(response.status).toBe(200);
    expect(response).toMatchSnapshot();
  })
})
```

### Project Setup

When a project is created using `create-twilio-function` or `twilio serverless:init` we should:
1. Add a `tests` folder at the root that contains tests for all basic Functions/Assets using the format `tests/functions/demo.test.js` (omitting the visibility flag in the name).
2. Install `jest` and the necessary dependencies/configuration
3. Add a valid `test` command to the `package.json` `"scripts'` section




[function-templates]: https://github.com/twilio-labs/function-templates
