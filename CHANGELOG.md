## [0.2.3](https://github.com/royli/c2-app/compare/v0.2.2...v0.2.3) (2026-04-15)

## [0.2.2](https://github.com/royli/c2-app/compare/v0.2.1...v0.2.2) (2026-04-15)


### Bug Fixes

* **electron:** inline squirrel startup handling ([15d1aef](https://github.com/royli/c2-app/commit/15d1aefc1f34ad3bf86a526f7d7c8d364d34aeda))

## [0.2.1](https://github.com/royli/c2-app/compare/v0.2.0...v0.2.1) (2026-04-15)

# [0.2.0](https://github.com/royli/c2-app/compare/v0.1.0...v0.2.0) (2026-04-15)


### Bug Fixes

* default theme to system ([da863f4](https://github.com/royli/c2-app/commit/da863f4138c7deca20860c6fef1ca8770995095e))
* sort profiles by creation date ([e28fc9a](https://github.com/royli/c2-app/commit/e28fc9a40096f208b3bbc8488ee3c71f1a8c36e2))


### Features

* Add duplicate profile button ([235757a](https://github.com/royli/c2-app/commit/235757ade16e65636ed98e8740f5cd3bfd09d2b8))
* **updater:** Add GitHub release checker service ([81bcee9](https://github.com/royli/c2-app/commit/81bcee94edd89d8ba71bf247e27497889cdb3d9a))
* **updater:** Add state management for update notifications ([de574ff](https://github.com/royli/c2-app/commit/de574ffde65d91004555ca711b273ad9a570e618))
* **updater:** Integrate updater UI into settings page ([857de5b](https://github.com/royli/c2-app/commit/857de5be5499bdb0dd00a47ff8b0d4a92f5c4610))
* **updater:** Wire IPC handlers and expose desktop API ([c0ba9c1](https://github.com/royli/c2-app/commit/c0ba9c1f2e8b1dfd4a3eb02f9f57773ac796cb79))

# [0.1.0](https://github.com/royli/c2-app/compare/384372fbf9949caafdc279adb934b737c2bfebf9...v0.1.0) (2026-04-15)


### Bug Fixes

* cap backup retention to five snapshots ([df66821](https://github.com/royli/c2-app/commit/df668212a025755f1cf4cd72e1f591969520faa7))
* clear editor dirty state on navigation ([8ab32a8](https://github.com/royli/c2-app/commit/8ab32a85a3c9ebc15074981ceb51fa441bcecfc1))
* **electron:** always quit app when all windows close ([c0583f1](https://github.com/royli/c2-app/commit/c0583f18225f2a46f47cb8fb1386fa939b5c8919))
* **profiles:** refresh Claude settings after saving active profile ([2ef8a5a](https://github.com/royli/c2-app/commit/2ef8a5aed746f0fb0c2b2f04c4cb28098c19fed7))
* **test:** repair e2e tests with vite build and self-contained mock ([e3c2207](https://github.com/royli/c2-app/commit/e3c220792df29f050719aff15b1ce09c912fc2fe))


### Features

* add HeroUI v3 components and documentation ([e98dbcd](https://github.com/royli/c2-app/commit/e98dbcd962525474c780b86f63fddcc8b8df2f11))
* add preferences system for persistent theme settings ([38c462a](https://github.com/royli/c2-app/commit/38c462a9527a91b4ebfa36e4cdc52ec3c09306e5))
* add user theme preferences (dark/light/system modes) ([16d4715](https://github.com/royli/c2-app/commit/16d471574116c86de9776b71ab18238865ee0210))
* **components:** improve model override visibility and profile display ([7747ae3](https://github.com/royli/c2-app/commit/7747ae3ef8fe77342ab5d1336567b559bbac44ae))
* **config:** add advanced Claude configuration options ([d9e7c2e](https://github.com/royli/c2-app/commit/d9e7c2e7955ede63eeaf4d5d2f36beda658e6d60))
* **form:** add advanced settings accordion to profile form ([0e3e9d3](https://github.com/royli/c2-app/commit/0e3e9d3d6d64c119b9050e09130415f705349258))
* **icons:** add application icons and update main window icon ([c0f8dc2](https://github.com/royli/c2-app/commit/c0f8dc21376b3e2088d9b49dec8802503f9133b5))
* implement Electron main process with profile management ([384372f](https://github.com/royli/c2-app/commit/384372fbf9949caafdc279adb934b737c2bfebf9))
* implement React renderer with profile management UI ([d577325](https://github.com/royli/c2-app/commit/d577325dc9bc19ff716f5ed32afa8eebf968135f))
* **onboarding:** add toggle and improve credential import flow ([fc1fc64](https://github.com/royli/c2-app/commit/fc1fc64ed5110b2dc64a0493d13d7f0b6725cd68))
* **profiles:** add Claude disable flags ([e89160a](https://github.com/royli/c2-app/commit/e89160a34f1f9757c60a87f831dac2f342c559f1))
* **settings:** track and clear model override when switching profiles ([dcec332](https://github.com/royli/c2-app/commit/dcec332e0acccf7896b858a5503bff189037acb6))
