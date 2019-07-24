# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.0.0-rc.0](https://github.com/twilio-labs/serverless-api/compare/v1.0.0-alpha.19...v1.0.0-rc.0) (2019-07-24)


### Bug Fixes

* **api:** use new uploads API ([#9](https://github.com/twilio-labs/serverless-api/issues/9)) ([b349a1e](https://github.com/twilio-labs/serverless-api/commit/b349a1e))
* **types:** expose friendly_name on environments ([df4cc28](https://github.com/twilio-labs/serverless-api/commit/df4cc28))


### Features

* **environments:** make naming of environments predictable ([68c51eb](https://github.com/twilio-labs/serverless-api/commit/68c51eb)), closes [#6](https://github.com/twilio-labs/serverless-api/issues/6)


### BREAKING CHANGES

* **api:** Removes uploadToAws as a function



## [1.0.0-alpha.19](https://github.com/twilio-labs/serverless-api/compare/v1.0.0-alpha.18...v1.0.0-alpha.19) (2019-07-20)


### Bug Fixes

* **logs:** redact tokens/passwords/env vars from logs ([8ca6e3d](https://github.com/twilio-labs/serverless-api/commit/8ca6e3d))



## [1.0.0-alpha.18](https://github.com/twilio-labs/serverless-api/compare/v1.0.0-alpha.17...v1.0.0-alpha.18) (2019-07-19)


### Features

* **client:** expose domain in activate command ([8283662](https://github.com/twilio-labs/serverless-api/commit/8283662)), closes [twilio-labs/twilio-run#37](https://github.com/twilio-labs/serverless-api/issues/37)



## [1.0.0-alpha.17](https://github.com/twilio-labs/serverless-api/compare/v1.0.0-alpha.16...v1.0.0-alpha.17) (2019-07-19)



## [1.0.0-alpha.16](https://github.com/twilio-labs/serverless-api/compare/v1.0.0-alpha.15...v1.0.0-alpha.16) (2019-07-18)


### Bug Fixes

* **logs:** fix typo in debug logs ([e558e79](https://github.com/twilio-labs/serverless-api/commit/e558e79))


### Features

* expose createFunctionResource - fix [#3](https://github.com/twilio-labs/serverless-api/issues/3) ([#4](https://github.com/twilio-labs/serverless-api/issues/4)) ([5279169](https://github.com/twilio-labs/serverless-api/commit/5279169))



## [1.0.0-alpha.15](https://github.com/twilio-labs/serverless-api/compare/v1.0.0-alpha.14...v1.0.0-alpha.15) (2019-07-10)


### Build System

* **npm:** setup git hooks and linters ([d0e404c](https://github.com/twilio-labs/serverless-api/commit/d0e404c))


### Features

* replace projectName with serviceName for consistency ([c4f955a](https://github.com/twilio-labs/serverless-api/commit/c4f955a)), closes [twilio-labs/twilio-run#17](https://github.com/twilio-labs/serverless-api/issues/17)


### BREAKING CHANGES

* projectName is no longer valid and serviceName has to be used instead
