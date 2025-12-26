# Changelog
Source: https://superwall.com/docs/expo/changelog

Release notes for the Superwall Expo SDK

## 1.0.0

### Major Changes

* 197c0c8: Add missing SDK configuration options from native iOS and Android SDKs:

  * `shouldObservePurchases` (iOS & Android): Observe purchases made outside of Superwall
  * `shouldBypassAppTransactionCheck` (iOS only): Disables app transaction check on SDK launch
  * `maxConfigRetryCount` (iOS only): Number of retry attempts for config fetch (default: 6)
  * `useMockReviews` (Android only): Enable mock review functionality

  Also fixes `enableExperimentalDeviceVariables` not being passed to the Android native SDK.

  **Breaking change**: Removed deprecated `collectAdServicesAttribution` option (AdServices attribution is now collected automatically by the native iOS SDK).

## 0.8.1

### Patch Changes

* ec326e8: bump ios to 4.10.6

## 0.8.0

### Minor Changes

* 0fcbf57: hotfix web2app redemption by disabling shouldShowWebPurchaseConfirmationAlert per default

### Patch Changes

* 5768d51: expose shouldShowWebPurchaseConfirmationAlert option

## 0.7.2

### Patch Changes

* 5e2491a: improve event listens to always subscribe no matter what

## 0.7.1

### Patch Changes

* bab902d: fix compat android serialziaiton

## 0.7.0

### Minor Changes

* 183a7d2: feat: comprehensive error handling for SDK configuration failures

  Added robust error handling to prevent apps from hanging indefinitely when SDK configuration fails (e.g., during offline scenarios). This introduces three new ways for developers to handle configuration errors:

  **New Features:**

  * Added `configurationError` state to store for programmatic error access
  * Added `onConfigurationError` callback prop to `SuperwallProvider` for error tracking/analytics
  * Added `SuperwallError` component for declarative error UI rendering
  * Listen to native `configFail` events to capture configuration failures
  * Improved `SuperwallLoading` and `SuperwallLoaded` to respect error states

  **Breaking Changes:** None - all changes are backward compatible

  **Fixes:**

  * Fixed app hanging in loading state when offline or configuration fails
  * Fixed unhandled promise rejections in deep link initialization
  * Fixed loading state not resetting on configuration failure

  Developers can now gracefully handle offline scenarios and provide better UX when SDK initialization fails.

### Patch Changes

* 4e246c9: fix: resolve Android handleDeepLink promise consistently with iOS

  Fixed Android crash on app launch caused by "Not a superwall link" error. The Android implementation now resolves the handleDeepLink promise with a boolean value (matching iOS behavior) instead of rejecting it for non-Superwall links. This prevents unhandled promise rejections that were causing production app crashes.

  Additionally added error handling in TypeScript as a safety net for any future edge cases.

* 4e246c9: fix: filter our expo specific deeplinks

## 0.6.11

### Patch Changes

* ed77ab7: fix: filter our expo specific deeplinks

## 0.6.10

### Patch Changes

* 2e2fc96: fix: compat products when empty crashing

## 0.6.9

### Patch Changes

* 7f28aa0: bump kotlin to 2.6.4
* ec246be: Added integration attributes support for third-party platforms

## 0.6.8

### Patch Changes

* f70ebe4: Fix undefined being returned for PaywallResult

## 0.6.7

### Patch Changes

* 02a9d2d: add missing productIdentifier to RedmeptionPaywallInfo

## 0.6.6

### Patch Changes

* 9c5a9a5: bump ios to 4.10.1

## 0.6.5

### Patch Changes

* e4c6aec: add getEntitlements to useUser hook

## 0.6.4

### Patch Changes

* fedde41: fix: compat superwall options on android

## 0.6.3

### Patch Changes

* 0278ad4: bump ios to 4.10.0. This fixes missing localization for app2web restore flow

## 0.6.2

### Patch Changes

* 72519cd: remove unused expo plugin

## 0.6.1

### Patch Changes

* 7920773: fix(android): handle nullable properties in RedemptionResult JSON serialization

  Fixed a Kotlin compilation error where nullable properties (`variantId`, `experimentId`, `productIdentifier`) were being assigned directly to a `Map&lt;String, Any&gt;`. Now using the null-safe let operator to conditionally add these properties only when they have values.

## 0.6.0

### Minor Changes

* b816292: # Custom Purchase Controller API Improvement

  Changed `CustomPurchaseControllerContext` return types from `Promise<PurchaseResult | undefined>` to `Promise<PurchaseResult | void>` for cleaner success handling.

  Now you can simply not return anything for success instead of `return undefined`:

  ```tsx
  import Purchases, { PURCHASES_ERROR_CODE } from "react-native-purchases";

  <CustomPurchaseControllerProvider
    controller={{
      onPurchase: async (params) => {
        try {
          const products = await Purchases.getProducts([params.productId]);
          const product = products[0];

          if (!product) {
            return { type: "failed", error: "Product not found" };
          }

          await Purchases.purchaseStoreProduct(product);
          // Success - no return needed âœ¨
        } catch (error: any) {
          if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
            return { type: "cancelled" };
          }
          return { type: "failed", error: error.message };
        }
      },

      onPurchaseRestore: async () => {
        try {
          await Purchases.restorePurchases();
          // Success - no return needed âœ¨
        } catch (error: any) {
          return { type: "failed", error: error.message };
        }
      },
    }}
  >
    {/* Your app */}
  </CustomPurchaseControllerProvider>;
  ```

### Patch Changes

* acb9956: feature: add StoreProduct Type to exports

## 0.5.1

### Patch Changes

* 889aaf7: fix: improve custom purchase type handling
* 56a72c9: Bump Android version to 2.6.3
* 465a215: Exposes Product identifier in Redemption Info

## 0.5.0

### Minor Changes

* 8c2c14f: User identification and attribute operations are now non-blocking async calls, preventing UI freezes while ensuring proper state synchronization

  Thanks to @gursheyss for the PR #90

## 0.4.1

### Patch Changes

* 86a3b28: Update Android version to 2.6.1 adding app2web support
* 6df6cc4: Adds paddle store identifiers

## 0.4.0

### Minor Changes

* 6d3e625: bump ios to fix critical webview bug

## 0.3.2

### Patch Changes

* 5555e8e: make error handling more defensive

## 0.3.1

### Patch Changes

* 4a3f540: fix: compat typeissues

## 0.3.0

### Minor Changes

* 9ed73eb: feat: improve error handling of Custom Purchase Controller

## 0.2.9

### Patch Changes

* bd460a7: Expose signature in android StoreTransaction
* e9eeff8: Expose appAcounttoken and purchaseToken on Android StoreTransaction

## 0.2.8

### Patch Changes

* e0b57bc: fix(compat): none nullable access
* 314be3c: bump deps

## 0.2.7

### Patch Changes

* adccfe4: Update Android SDK to 2.5.4 and iOS to 4.8.2

## 0.2.6

### Patch Changes

* 10bb039: force release?

## 0.2.5

### Patch Changes

* 95636a6: Bump internal android sdk to 2.5.1

## 0.2.4

### Patch Changes

* c274e6a: Add typed SuperwallOptions and fix mispelled option name

## 0.2.3

### Patch Changes

* f9372f1: Exposes StoreTransaction in /compat

## 0.2.2

### Patch Changes

* 3f832c7: Updates Android SDK to 2.3.2

## 0.2.1

### Patch Changes

* 4327c59: expose internal types

## 0.2.0

### Minor Changes

* 3b58ea4: Updates Android SDK to 2.3.1 (with Google Play Billing library 7)

## 0.1.3

### Patch Changes

* d273d2a: bump expo module

## 0.1.2

### Patch Changes

* f243226: fix: type issues

## 0.1.1

### Patch Changes

* 707e513: temp fix swift types

## 0.1.0

### Minor Changes

* b39e98e: feat: Remove the export of the internal SuperwallExpoModule Class,
  this class should have not been used since it's an internal class and could break the state of the internal SuperwallStore.
  If you have used in prior for a usecase that the current SDK doesn't support, please open an issue.

### Patch Changes

* 32112a6: feat: handle deeplink automatically, no need for manual handling

## 0.0.18

### Patch Changes

* 3a93b2b: feat: fix inital loading state

## 0.0.17

### Patch Changes

* db980b6: fix missing types on native

## 0.0.16

### Patch Changes

* e19e626: require Expo 53+

## 0.0.15

### Patch Changes

* 020c22a: fix: old exports

## 0.0.14

### Patch Changes

* 6153163: mark things as internal
* 6fbaa94: add types to TransactionProductIdentifier

## 0.0.13

### Patch Changes

* 2ead245: feat: add getDeviceAttributes
* efbd9d5: feat: add getDeviceAttributes to ios

## 0.0.12

### Patch Changes

* 4751b75: Fixes issues with identify on Android, updates Android SDK to 2.2.3

## 0.0.11

### Patch Changes

* 9c053b3: feat: add experimentalDeviceVariables for ios

## 0.0.10

### Patch Changes

* d5beb70: fix(compat): subscription event emitter not firing

## 0.0.9

### Patch Changes

* 67edd16: feat: export internal SuperwallExpoModule for advance usage

## 0.0.8

### Patch Changes

* 0175478: feat: set subscription status to UNKNOWN on startup
* d8390ab: feat: bump ios SDK version

## 0.0.7

### Patch Changes

* f5a1d9a: fix: signout state changes
* 4df7557: fix: ios getSubscriptionStatus

## 0.0.6

### Patch Changes

* fc22062: fix: android getSubscriptionStatus returning undefined

## 0.0.5

### Patch Changes

* 8f4d758: fix compat subscriptionStatus access failing
* 9d98a30: fix: android sdk version not being passed correctly

## 0.0.4

### Patch Changes

* eb98aeb: feat: add ability to use CustomPurchaseController

  Just wrap your app with CustomPurchaseControllerProvider and pass your own handler functions to it.
  It will await the result of these handler functions to continue the purchase/restore flow.

  ```tsx
  <CustomPurchaseControllerProvider
    controller={{
      onPurchase: async (params) => {
        // Set stuff in ur system here
        if (params.platform === "ios") {
          console.log("onPurchase", params);
        } else {
          console.log("onPurchase", params.productId);
        }
        return;
      },
      onPurchaseRestore: async () => {
        console.log("onPurchaseRestore");
        // Set stuff in ur system here
        return;
      },
    }}
  >
    <SuperwallProvider apiKeys={{ ios: API_KEY }}>
      <SuperwallLoading>
        <ActivityIndicator style={{ flex: 1 }} />
      </SuperwallLoading>
      <SuperwallLoaded>
        <ScreenContent />
      </SuperwallLoaded>
    </SuperwallProvider>
  </CustomPurchaseControllerProvider>
  ```

## 0.0.3

### Patch Changes

* 72d9879: fix: adding ability to let superwall manage subscriptions

## 0.0.2

### Patch Changes

* 8914f05: Initialize new experimental Hook based SDK.

## 0.0.1

### Patch Changes

* 0cd5243: Inital Release
* 0cd5243: Change Delegate class to normal class from abstract

## Unpublished

### ðŸ›  Breaking changes

### ðŸŽ‰ New features

### ðŸ› Bug fixes

### ðŸ’¡ Others


---

# Cohorting in 3rd Party Tools
Source: https://superwall.com/docs/expo/guides/3rd-party-analytics/cohorting-in-3rd-party-tools

To easily view Superwall cohorts in 3rd party tools, we recommend you set user attributes based on the experiments that users are included in. You can also use custom placements for creating analytics events for actions such as interacting with an element on a paywall.

:::android
```kotlin Kotlin
override fun handleSuperwallEvent(eventInfo: SuperwallEventInfo) {
  when(eventInfo.event) {
    is SuperwallEvent.TriggerFire -> {
      MyAnalyticsService.shared.setUserAttributes(
        mapOf(
          "sw_experiment_${eventInfo.params.get("experiment_id").toString()}" to true,
          "sw_variant_${eventInfo.params.get("variant_id").toString()}" to true
        )
      )
    }
    else -> {}
  }
}
```
:::

:::flutter
```dart Flutter
@override
void handleSuperwallEvent(SuperwallEventInfo eventInfo) async {
  final experimentId = eventInfo.params?['experiment_id'];
  final variantId = eventInfo.params?['variant_id'];

  switch (eventInfo.event.type) {
    case EventType.triggerFire:
      MyAnalyticsService.shared.setUserAttributes({
        "sw_experiment_$experimentId": true,
        "sw_variant_$variantId": true
      });
      break;
    default:
      break;
  }
}
```
:::

:::expo
```typescript React Native
handleSuperwallEvent(eventInfo: SuperwallEventInfo) {
  const experimentId = eventInfo.params?['experiment_id']
  const variantId = eventInfo.params?['variant_id']

  if (!experimentId || !variantId) {
    return
  }

  switch (eventInfo.event.type) {
    case EventType.triggerFire:
      MyAnalyticsService.shared.setUserAttributes({
        `sw_experiment_${experimentId}`: true,
        `sw_variant_${variantId}`: true
      });
      break;
    default:
      break;
  }
}
```
:::

Once you've set this up, you can easily ask for all users who have an attribute `sw_experiment_1234` and breakdown by both variants to see how users in a Superwall experiment behave in other areas of your app.


---

# Custom Paywall Analytics
Source: https://superwall.com/docs/expo/guides/3rd-party-analytics/custom-paywall-analytics

Learn how to log events from paywalls, such as a button tap or product change, to forward to your analytics service.

You can create customized analytics tracking for any paywall event by using custom placements. With them, you can get callbacks for actions such as interacting with an element on a paywall sent to your [Superwall delegate](/using-superwall-delegate). This can be useful for tracking how users interact with your paywall and how that affects their behavior in other areas of your app.

For example, in the paywall below, perhaps you're interested in tracking when people switch the plan from "Standard" and "Pro":

<Frame>
  ![](/images/3pa_cp_2.jpeg)
</Frame>

You could create a custom placement [tap behavior](/paywall-editor-styling-elements#tap-behaviors) which fires when a segment is tapped:

<Frame>
  ![](/images/3pa_cp_1.jpeg)
</Frame>

Then, you can listen for this placement and forward it to your analytics service:

```swift Swift
extension SuperwallService: SuperwallDelegate {
  func handleSuperwallEvent(withInfo eventInfo: SuperwallEventInfo) {
    switch eventInfo.event {
      case let .customPlacement(name, params, paywallInfo):
        // Prints out didTapPro or didTapStandard
        print("\(name) - \(params) - \(paywallInfo)")
        MyAnalyticsService.shared.send(event: name, params: params)
      default:
        print("Default event: \(eventInfo.event.description)")
    }
  }
}
```

For a walkthrough example, check out this [video on YouTube](https://youtu.be/4rM1rGRqDL0).


---

# 3rd Party Analytics
Source: https://superwall.com/docs/expo/guides/3rd-party-analytics

undefined

### Hooking up Superwall events to 3rd party tools

SuperwallKit automatically tracks some internal events. You can [view the list of events here](/tracking-analytics). We encourage you to also track them in your own analytics by implementing the [Superwall delegate](/using-superwall-delegate). Using the `handleSuperwallEvent(withInfo:)` function, you can forward events to your analytics service:

:::expo
```typescript
handleSuperwallEvent(eventInfo: SuperwallEventInfo) {
  console.log(`handleSuperwallEvent: ${eventInfo}`);

  switch (eventInfo.event.type) {
  case EventType.appOpen:
    console.log("appOpen event");
    break;
  case EventType.deviceAttributes:
    console.log(`deviceAttributes event: ${eventInfo.event.deviceAttributes}`);
    break;
  case EventType.paywallOpen:
    const paywallInfo = eventInfo.event.paywallInfo;
    console.log(`paywallOpen event: ${paywallInfo}`);

    if (paywallInfo !== null) {
      paywallInfo.identifier().then((identifier: string) => {
        console.log(`paywallInfo.identifier: ${identifier}`);
      });

      paywallInfo.productIds().then((productIds: string[]) => {
        console.log(`paywallInfo.productIds: ${productIds}`);
      });
    }
    break;
  default:
    break;
  }
}
```
:::

<br />

<Note>
  You might also want to set user attribute to allow for [Cohorting in 3rd Party
  Tools](/cohorting-in-3rd-party-tools)
</Note>

Alternatively, if you want typed versions of all these events with associated values, you can access them via `eventInfo.event`:

:::expo
```typescript
handleSuperwallEvent(eventInfo: SuperwallEventInfo) {
  console.log(`handleSuperwallEvent: ${eventInfo}`);

  switch (eventInfo.event.type) {
  case EventType.appOpen:
    console.log("appOpen event");
    break;
  case EventType.deviceAttributes:
    console.log(`deviceAttributes event: ${eventInfo.event.deviceAttributes}`);
    break;
  case EventType.paywallOpen:
    const paywallInfo = eventInfo.event.paywallInfo;
    console.log(`paywallOpen event: ${paywallInfo}`);

    if (paywallInfo !== null) {
      paywallInfo.identifier().then((identifier: string) => {
        console.log(`paywallInfo.identifier: ${identifier}`);
      });

      paywallInfo.productIds().then((productIds: string[]) => {
        console.log(`paywallInfo.productIds: ${productIds}`);
      });
    }
    break;
  default:
    break;
  }
}
```
:::

<Info>
  Wanting to use events to see which product was purchased on a paywall? Check out this
  [doc](/viewing-purchased-products).
</Info>


---

# Superwall Events
Source: https://superwall.com/docs/expo/guides/3rd-party-analytics/tracking-analytics

The SDK automatically tracks some events, which power the charts in the dashboard. 

We encourage you to track them in your own analytics as described in [3rd Party Analytics](/3rd-party-analytics).

The following Superwall events can be used as placements to present paywalls:

* `app_install`
* `app_launch`
* `deepLink_open`
* `session_start`
* `paywall_decline`
* `transaction_fail`
* `transaction_abandon`
* `survey_response`

For more info about how to use these, check out [how to add them using a Placement](/campaigns-placements#adding-a-placement).

The full list of events is as follows:

| **Event Name**                                                                      | **Action**                                                                                    | **Parameters**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `adServicesTokenRequestComplete`                                                    | When the AdServices token request finishes.                                                   | `["token": String]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `adServicesTokenRequestFail`                                                        | When the AdServices token request fails.                                                      | `["error": Error]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `adServicesTokenRequestStart`                                                       | When the AdServices token request starts.                                                     | None                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `app_close`                                                                         | Anytime the app leaves the foreground.                                                        | Same as `app_install`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `app_install`                                                                       | When the SDK is configured for the first time.                                                | `["is_superwall": true, "app_session_id": String, "using_purchase_controller": Bool]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `app_launch`                                                                        | When the app is launched from a cold start.                                                   | Same as `app_install`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `app_open`                                                                          | Anytime the app enters the foreground.                                                        | Same as `app_install`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `configAttributes`                                                                  | When the attributes affecting Superwall's configuration are set or changed.                   | None                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `configFail`                                                                        | When the Superwall configuration fails to be retrieved.                                       | None                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `configRefresh`                                                                     | When the Superwall configuration is refreshed.                                                | None                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `confirmAllAssignments`                                                             | When all experiment assignments are confirmed.                                                | None                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `customPlacement`                                                                   | When the user taps on an element in the paywall that has a `custom_placement` action.         | `["name": String, "params": [String: Any], "paywallInfo": PaywallInfo]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| [`deepLink_open`](/campaigns-standard-placements#using-the-deeplink-open-event)     | When a user opens the app via a deep link.                                                    | `["url": String, "path": String", "pathExtension": String, "lastPathComponent": String, "host": String, "query": String, "fragment": String]` + any query parameters in the deep link URL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `device_attributes`                                                                 | When device attributes are sent to the backend every session.                                 | Includes `app_session_id`, `app_version`, `os_version`, `device_model`, `device_locale`, and various hardware/software details.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `first_seen`                                                                        | When the user is first seen in the app, regardless of login status.                           | Same as `app_install`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `freeTrial_start`                                                                   | When a user completes a transaction for a subscription product with an introductory offer.    | Same as `subscription_start`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `identityAlias`                                                                     | When the user's identity aliases after calling `identify`.                                    | None                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `nonRecurringProduct_purchase`                                                      | When the user purchases a non-recurring product.                                              | Same as `subscription_start`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `paywall_close`                                                                     | When a paywall is closed (either manually or after a transaction succeeds).                   | \[â€œpaywall\_webview\_load\_complete\_timeâ€: String?, â€œpaywall\_urlâ€: String, â€œpaywall\_response\_load\_start\_timeâ€: String?, â€œpaywall\_products\_load\_fail\_timeâ€: String?, â€œsecondary\_product\_idâ€: String, â€œfeature\_gatingâ€: Int, â€œpaywall\_response\_load\_complete\_timeâ€: String?, â€œis\_free\_trial\_availableâ€: Bool, â€œis\_superwallâ€: true, â€œpresented\_byâ€: String, â€œpaywall\_nameâ€: String, â€œpaywall\_response\_load\_durationâ€: String?, â€œpaywall\_identifierâ€: String, â€œpaywall\_webview\_load\_start\_timeâ€: String?, â€œpaywall\_products\_load\_complete\_timeâ€: String?, â€œpaywall\_product\_idsâ€: String, â€œtertiary\_product\_idâ€: String, â€œpaywall\_idâ€: String, â€œapp\_session\_idâ€: String, â€œpaywall\_products\_load\_start\_timeâ€: String?, â€œprimary\_product\_idâ€: String, â€œsurvey\_attachedâ€: Bool, â€œsurvey\_presentationâ€: String?]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| [`paywall_decline`](/campaigns-standard-placements#using-the-paywall-decline-event) | When a user manually dismisses a paywall.                                                     | Same as `paywall_close`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `paywall_open`                                                                      | When a paywall is opened.                                                                     | Same as `paywall_close`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `paywallPresentationRequest`                                                        | When something happened during the paywall presentation, whether a success or failure.        | `[â€œsource_event_nameâ€: String, â€œstatusâ€: String, â€œis_superwallâ€: true, â€œapp_session_idâ€: String, â€œpipeline_typeâ€: String, â€œstatus_reasonâ€: String]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `paywallProductsLoad_complete`                                                      | When the request to load a paywall's products completes.                                      | Same as `paywallResponseLoad_start`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `paywallProductsLoad_fail`                                                          | When the request to load a paywall's products fails.                                          | Same as `paywallResponseLoad_start`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `paywallProductsLoad_retry`                                                         | When the request to load a paywall's products fails and is being retried.                     | `["triggeredPlacementName": String?, "paywallInfo": PaywallInfo, "attempt": Int]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `paywallProductsLoad_start`                                                         | When the request to load a paywall's products starts.                                         | Same as `paywallResponseLoad_start`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `paywallResponseLoad_complete`                                                      | When a paywall request to Superwall's servers completes.                                      | Same as `paywallResponseLoad_start`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `paywallResponseLoad_fail`                                                          | When a paywall request to Superwall's servers fails.                                          | Same as `paywallResponseLoad_start`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `paywallResponseLoad_notFound`                                                      | When a paywall request returns a 404 error.                                                   | Same as `paywallResponseLoad_start`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `paywallResponseLoad_start`                                                         | When a paywall request to Superwall's servers has started.                                    | Same as `app_install` + `["is_triggered_from_event": Bool]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `paywallWebviewLoad_complete`                                                       | When a paywall's webpage completes loading.                                                   | Same as `paywall_close`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `paywallWebviewLoad_fail`                                                           | When a paywall's webpage fails to load.                                                       | Same as `paywall_close`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `paywallWebviewLoad_fallback`                                                       | When a paywall's webpage fails and loads a fallback version.                                  | Same as `paywall_close`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `paywallWebviewLoad_start`                                                          | When a paywall's webpage begins to load.                                                      | Same as `paywall_close`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `paywallWebviewLoad_timeout`                                                        | When the loading of a paywall's webpage times out.                                            | Same as `paywall_close`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `paywallWebviewLoad_processTerminated`                                              | When the paywall's web view content process terminates.                                       | Same as `paywall_close`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `reset`                                                                             | When `Superwall.reset()` is called.                                                           | None                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `restoreComplete`                                                                   | When a restore completes successfully.                                                        | None                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `restoreFail`                                                                       | When a restore fails.                                                                         | `["message": String]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `restoreStart`                                                                      | When a restore is initiated.                                                                  | None                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `session_start`                                                                     | When the app is opened after at least 60 minutes since last `app_close`.                      | Same as `app_install`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `shimmerViewComplete`                                                               | When the shimmer view stops showing.                                                          | None                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `shimmerViewStart`                                                                  | When the shimmer view starts showing.                                                         | None                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `subscription_start`                                                                | When a user completes a transaction for a subscription product without an introductory offer. | \[â€œproduct\_period\_daysâ€: String, â€œproduct\_priceâ€: String, â€œpresentation\_source\_typeâ€: String?, â€œpaywall\_response\_load\_complete\_timeâ€: String?, â€œproduct\_language\_codeâ€: String, â€œproduct\_trial\_period\_monthly\_priceâ€: String, â€œpaywall\_products\_load\_durationâ€: String?, â€œproduct\_currency\_symbolâ€: String, â€œis\_superwallâ€: true, â€œapp\_session\_idâ€: String, â€œproduct\_period\_monthsâ€: String, â€œpresented\_by\_event\_idâ€: String?, â€œproduct\_idâ€: String, â€œtrigger\_session\_idâ€: String, â€œpaywall\_webview\_load\_complete\_timeâ€: String?, â€œpaywall\_response\_load\_start\_timeâ€: String?, â€œproduct\_raw\_trial\_period\_priceâ€: String, â€œfeature\_gatingâ€: Int, â€œpaywall\_idâ€: String, â€œproduct\_trial\_period\_daily\_priceâ€: String, â€œproduct\_period\_yearsâ€: String, â€œpresented\_byâ€: String, â€œproduct\_periodâ€: String, â€œpaywall\_urlâ€: String, â€œpaywall\_nameâ€: String, â€œpaywall\_identifierâ€: String, â€œpaywall\_products\_load\_start\_timeâ€: String?, â€œproduct\_trial\_period\_monthsâ€: String, â€œproduct\_currency\_codeâ€: String, â€œproduct\_period\_weeksâ€: String, â€œproduct\_periodlyâ€: String, â€œproduct\_trial\_period\_textâ€: String, â€œpaywall\_webview\_load\_start\_timeâ€: String?, â€œpaywall\_products\_load\_complete\_timeâ€: String?, â€œprimary\_product\_idâ€: String, â€œproduct\_trial\_period\_yearly\_priceâ€: String, â€œpaywalljs\_versionâ€: String?, â€œproduct\_trial\_period\_yearsâ€: String, â€œtertiary\_product\_idâ€: String, â€œpaywall\_products\_load\_fail\_timeâ€: String?, â€œproduct\_trial\_period\_end\_dateâ€: String, â€œproduct\_weekly\_priceâ€: String, â€œvariant\_idâ€: String, â€œpresented\_by\_event\_timestampâ€: String?, â€œpaywall\_response\_load\_durationâ€: String?, â€œsecondary\_product\_idâ€: String, â€œproduct\_trial\_period\_daysâ€: String, â€œproduct\_monthly\_priceâ€: String, â€œpaywall\_product\_idsâ€: String, â€œproduct\_localeâ€: String, â€œproduct\_daily\_priceâ€: String, â€œproduct\_raw\_priceâ€: String, â€œproduct\_yearly\_priceâ€: String, â€œproduct\_trial\_period\_priceâ€: String, â€œproduct\_localized\_periodâ€: String, â€œproduct\_identifierâ€: String, â€œexperiment\_idâ€: String, â€œis\_free\_trial\_availableâ€: Bool, â€œproduct\_trial\_period\_weeksâ€: String, â€œpaywall\_webview\_load\_durationâ€: String?, â€œproduct\_period\_altâ€: String, â€œproduct\_trial\_period\_weekly\_priceâ€: String, â€œpresented\_by\_event\_nameâ€: String?] |
| `subscriptionStatus_didChange`                                                      | When a user's subscription status changes.                                                    | `["is_superwall": true, "app_session_id": String, "subscription_status": String]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `surveyClose`                                                                       | When the user chooses to close a survey instead of responding.                                | None                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| [`survey_response`](/campaigns-standard-placements#using-the-survey-response-event) | When a user responds to a paywall survey.                                                     | `["survey_selected_option_title": String, "survey_custom_response": String, "survey_id": String, "survey_assignment_key": String, "survey_selected_option_id": String]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `touches_began`                                                                     | When the user touches the app's UIWindow for the first time (if tracked by a campaign).       | Same as `app_install`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `transaction_abandon`                                                               | When the user cancels a transaction.                                                          | Same as `subscription_start`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `transaction_complete`                                                              | When the user completes checkout and any product is purchased.                                | Same as subscription\_start + \[â€œweb\_order\_line\_item\_idâ€: String, â€œapp\_bundle\_idâ€: String, â€œconfig\_request\_idâ€: String, â€œstateâ€: String, â€œsubscription\_group\_idâ€: String, â€œis\_upgradedâ€: String, â€œexpiration\_dateâ€: String, â€œtrigger\_session\_idâ€: String, â€œoriginal\_transaction\_identifierâ€: String, â€œidâ€: String, â€œtransaction\_dateâ€: String, â€œis\_superwallâ€: true, â€œstore\_transaction\_idâ€: String, â€œoriginal\_transaction\_dateâ€: String, â€œapp\_session\_idâ€: String]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `transaction_fail`                                                                  | When the payment sheet fails to complete a transaction (ignores user cancellation).           | Same as `subscription_start` + `["message": String]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `transaction_restore`                                                               | When the user successfully restores their purchases.                                          | Same as `subscription_start`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `transaction_start`                                                                 | When the payment sheet is displayed to the user.                                              | Same as `subscription_start`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `transaction_timeout`                                                               | When the transaction takes longer than 5 seconds to display the payment sheet.                | `["paywallInfo": PaywallInfo]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `trigger_fire`                                                                      | When a registered placement triggers a paywall.                                               | `[â€œtrigger_nameâ€: String, â€œtrigger_session_idâ€: String, â€œvariant_idâ€: String?, â€œexperiment_idâ€: String?, â€œpaywall_identifierâ€: String?, â€œresultâ€: String, â€œunmatched_rule_<id>â€: â€œ<outcome>â€]. unmatched_rule_<id> indicates why a rule (with a specfiic experiment id) didnâ€™t match. It will only exist if the result is no_rule_match. Its outcome will either be OCCURRENCE, referring to the limit applied to a rule, or EXPRESSION.`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `user_attributes`                                                                   | When the user attributes are set.                                                             | `[â€œaliasIdâ€: String, â€œseedâ€: Int, â€œapp_session_idâ€: String, â€œapplicationInstalledAtâ€: String, â€œis_superwallâ€: true, â€œapplication_installed_atâ€: String] + provided attributes`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |


---

# Custom Paywall Actions
Source: https://superwall.com/docs/expo/guides/advanced/custom-paywall-actions

undefined

For example, adding a custom action called `help_center` to a button in your paywall gives you the opportunity to present a help center whenever that button is pressed. To set this up, implement `handleCustomPaywallAction(withName:)` in your `SuperwallDelegate`:

:::expo
```typescript
handleCustomPaywallAction(name: string) {
  if (name == "help_center") {
    HelpCenterManager.present();
  }
}
```
:::

<br />

<Note>
  Remember to set `Superwall.shared.delegate`! For implementation details, see the [Superwall Delegate](/using-superwall-delegate) guide.
</Note>


---

# Game Controller Support
Source: https://superwall.com/docs/expo/guides/advanced/game-controller-support

undefined

:::android
First set the `SuperwallOption` `isGameControllerEnabled` to `true`:

```kotlin
Superwall.instance.options.isGameControllerEnabled = true
```

Then Superwall will automatically listen for gamepad events and forward them to your paywall!
:::

:::flutter
First set the `SuperwallOption` `isGameControllerEnabled` to `true`:

```dart
Superwall.instance.options.isGameControllerEnabled = true
```

Then Superwall will automatically listen for gamepad events and forward them to your paywall!
:::

:::expo
First set the `SuperwallOption` `isGameControllerEnabled` to `true`:

```typescript
Superwall.instance.options.isGameControllerEnabled = true
```

Then Superwall will automatically listen for gamepad events and forward them to your paywall!
:::


---

# Observer Mode
Source: https://superwall.com/docs/expo/guides/advanced/observer-mode

undefined

If you wish to make purchases outside of Superwall's SDK and paywalls, you can use **observer mode** to report purchases that will appear in the Superwall dashboard, such as transactions:

<Frame>
  ![](/images/om_transactions.png)
</Frame>

This is useful if you are using Superwall solely for revenue tracking, and you're making purchases using frameworks like StoreKit or Google Play Billing Library directly. Observer mode will also properly link user identifiers to transactions. To enable observer mode, set it using `SuperwallOptions` when configuring the SDK:

There are a few things to keep in mind when using observer mode:

1. On iOS, if you're using StoreKit 2, then Superwall solely reports transaction completions. If you're using StoreKit 1, then Superwall will report transaction starts, abandons, and completions.
2. When using observer mode, you can't make purchases using our SDK â€” such as `Superwall.shared.purchase(aProduct)`.

For more on setting up revenue tracking, check out this [doc](/overview-settings-revenue-tracking).


---

# Retrieving and Presenting a Paywall Yourself
Source: https://superwall.com/docs/expo/guides/advanced/presenting-paywalls

undefined

If you want complete control over the paywall presentation process, you can use `getPaywall(forPlacement:params:paywallOverrides:delegate:)`. This returns the `UIViewController` subclass `PaywallViewController`, which you can then present however you like. Or, you can use a SwiftUI `View` via `PaywallView`. The following is code is how you'd mimic [register](/docs/feature-gating):

<Tabs items={["Swift","Objective-C","SwiftUI","Kotlin"]} groupId="language" persist>
  <Tab value="Swift">
    ```swift Swift
    final class MyViewController: UIViewController {
      private func presentPaywall() async {
        do {
          // 1
      	  let paywallVc = try await Superwall.shared.getPaywall(
            forPlacement: "campaign_trigger",
            delegate: self
          )
       	  self.present(paywallVc, animated: true)
        } catch let skippedReason as PaywallSkippedReason {
          // 2
          switch skippedReason {
           case .holdout,
           .noAudienceMatch,
           .placementNotFound:
             break
           }
        } catch {
          // 3
          print(error)
        }
      }

      private func launchFeature() {
        // Insert code to launch a feature that's behind your paywall.
      }
    }

    // 4
    extension MyViewController: PaywallViewControllerDelegate {
      func paywall(
        _ paywall: PaywallViewController,
        didFinishWith result: PaywallResult,
        shouldDismiss: Bool
      ) {
        if shouldDismiss {
          paywall.dismiss(animated: true)
        }

        switch result {
        case .purchased,
          .restored:
          launchFeature()
        case .declined:
          let closeReason = paywall.info.closeReason
          let featureGating = paywall.info.featureGatingBehavior
          if closeReason != .forNextPaywall && featureGating == .nonGated {
            launchFeature()
          }
        }
      }
    }
    ```
  </Tab>

  <Tab value="Objective-C">
    ```swift Objective-C
    @interface MyViewController : UIViewController

    - (void)presentPaywall;

    @end

    @interface MyViewController () <SWKPaywallViewControllerDelegate>

    @end

    @implementation MyViewController

    - (void)presentPaywall {
      // 1
      [[Superwall sharedInstance] getPaywallForEvent:@"campaign_trigger" params:nil paywallOverrides:nil delegate:self completion:^(SWKGetPaywallResult * _Nonnull result) {
        if (result.paywall != nil) {
          [self presentViewController:result.paywall animated:YES completion:nil];
        } else if (result.skippedReason != SWKPaywallSkippedReasonNone) {
          switch (result.skippedReason) {
          // 2
            case SWKPaywallSkippedReasonHoldout:
            case SWKPaywallSkippedReasonUserIsSubscribed:
            case SWKPaywallSkippedReasonEventNotFound:
            case SWKPaywallSkippedReasonNoRuleMatch:
            case SWKPaywallSkippedReasonNone:
              break;
          };
        } else if (result.error) {
          // 3
          NSLog(@"%@", result.error);
        }
      }];
    }

    -(void)launchFeature {
      // Insert code to launch a feature that's behind your paywall.
    }

    // 4
    - (void)paywall:(SWKPaywallViewController *)paywall didFinishWithResult:(enum SWKPaywallResult)result shouldDismiss:(BOOL)shouldDismiss {
      if (shouldDismiss) {
        [paywall dismissViewControllerAnimated:true completion:nil];
      }

      SWKPaywallCloseReason closeReason;
      SWKFeatureGatingBehavior featureGating;

      switch (result) {
      case SWKPaywallResultPurchased:
      case SWKPaywallResultRestored:
        [self launchFeature];
        break;
      case SWKPaywallResultDeclined:
        closeReason = paywall.info.closeReason;
        featureGating = paywall.info.featureGatingBehavior;

        if (closeReason != SWKPaywallCloseReasonForNextPaywall && featureGating == SWKFeatureGatingBehaviorNonGated) {
            [self launchFeature];
        }
        break;
      }
    }

    @end
    ```
  </Tab>

  <Tab value="SwiftUI">
    ```swift SwiftUI
    import SuperwallKit

    struct MyAwesomeApp: App {
      @State var store: AppStore = .init()

      init() {
        Superwall.configure(apiKey: "MyAPIKey")
      }

      var body: some Scene {
        WindowGroup {
          ContentView()
            .fullScreenCover(isPresented: $store.showPaywall) {
              // You can just use 'placement' at a minimum. The 'feature'
              // Closure fires if they convert
              PaywallView(placement: "a_placement", onSkippedView: { skip in
                switch skip {
                case .userIsSubscribed,
                  .holdout(_),
                  .noRuleMatch,
                  .eventNotFound:
                    MySkipView()
                }
              }, onErrorView: { error in
                MyErrorView()
              }, feature: {
                // User is subscribed as a result of the paywall purchase
                // Or they already were (which would happen in `onSkippedView`)
              })
            }
        }
      }
    }
    ```
  </Tab>

  <Tab value="Kotlin">
    ```kotlin Kotlin

    // This is an example of how to use `getPaywall` to use a composable`

    import androidx.compose.foundation.layout.Arrangement
    import androidx.compose.foundation.layout.Box
    import androidx.compose.foundation.layout.Column
    import androidx.compose.foundation.layout.fillMaxSize
    import androidx.compose.material3.CircularProgressIndicator
    import androidx.compose.material3.Text
    import androidx.compose.runtime.Composable
    import androidx.compose.runtime.LaunchedEffect
    import androidx.compose.runtime.mutableStateOf
    import androidx.compose.runtime.remember
    import androidx.compose.ui.Alignment
    import androidx.compose.ui.Modifier
    import androidx.compose.ui.viewinterop.AndroidView
    import com.superwall.sdk.Superwall
    import com.superwall.sdk.paywall.presentation.get_paywall.getPaywall
    import com.superwall.sdk.paywall.presentation.internal.request.PaywallOverrides
    import com.superwall.sdk.paywall.vc.PaywallView
    import com.superwall.sdk.paywall.vc.delegate.PaywallViewCallback

    @Composable
    fun PaywallComposable(
        event: String,
        params: Map<String, Any>? = null,
        paywallOverrides: PaywallOverrides? = null,
        callback: PaywallViewCallback,
        errorComposable: @Composable ((Throwable) -> Unit) = { error: Throwable ->
            // Default error composable
            Text(text = "No paywall to display")
        },
        loadingComposable: @Composable (() -> Unit) = {
            // Default loading composable
            Box(modifier = Modifier.fillMaxSize()) {
                Column(
                    modifier = Modifier.align(Alignment.Center),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    CircularProgressIndicator()
                }
            }
        }
    ) {
        val viewState = remember { mutableStateOf<PaywallView?>(null) }
        val errorState = remember { mutableStateOf<Throwable?>(null) }
        val context = LocalContext.current

        LaunchedEffect(Unit) {
            PaywallBuilder(event)
                .params(params)
                .overrides(paywallOverrides)
                .delegate(delegate)
                .activity(context as Activity)
                .build()
                .fold(onSuccess = {
                    viewState.value = it
                }, onFailure = {
                    errorState.value = it
                })
        }

        when {
            viewState.value != null -> {
                viewState.value?.let { viewToRender ->
                    DisposableEffect(viewToRender) {
                        viewToRender.onViewCreated()

                        onDispose {
                            viewToRender.beforeOnDestroy()
                            viewToRender.encapsulatingActivity = null

                            CoroutineScope(Dispatchers.Main).launch {
                                viewToRender.destroyed()
                            }
                        }
                    }
                    AndroidView(
                        factory = { context ->
                            viewToRender
                        }
                    )
                }
            }
            errorState.value != null -> {
                errorComposable(errorState.value!!)
            }
            else -> {
                loadingComposable()
            }
        }
    }
    ```
  </Tab>
</Tabs>

This does the following:

1. Gets the paywall view controller.
2. Handles the cases where the paywall was skipped.
3. Catches any presentation errors.
4. Implements the delegate. This is called when the user is finished with the paywall. First, it checks `shouldDismiss`. If this is true then is dismissed the paywall from view before launching any features. This may depend on the `result` depending on how you first presented your view. Then, it switches over the `result`. If the result is `purchased` or `restored` the feature can be launched. However, if the result is `declined`, it checks that the the `featureGating` property of `paywall.info` is `nonGated` and that the `closeReason` isn't `.forNextPaywall`.

### Best practices

1. **Make sure to prevent a paywall from being accessed after a purchase has occurred**.

If a user purchases from a paywall, it is your responsibility to make sure that the user can't access that paywall again. For example, if after successful purchase you decide to push a new view on to the navigation stack, you should make sure that the user can't go back to access the paywall.

2. **Make sure the paywall view controller deallocates before presenting it elsewhere**.

If you have a paywall view controller presented somewhere and you try to present
the same view controller elsewhere, you will get a crash. For example, you may
have a paywall in a tab bar controller, and then you also try to present it
modally. We plan on improving this, but currently it's your responsibility to
ensure this doesn't happen.


---

# Using the Presentation Handler
Source: https://superwall.com/docs/expo/guides/advanced/using-the-presentation-handler

undefined

You can provide a `PaywallPresentationHandler` to `register`, whose functions provide status updates for a paywall:

* `onDismiss`: Called when the paywall is dismissed. Accepts a `PaywallInfo` object containing info about the dismissed paywall, and there is a `PaywallResult` informing you of any transaction.
* `onPresent`: Called when the paywall did present. Accepts a `PaywallInfo` object containing info about the presented paywall.
* `onError`: Called when an error occurred when trying to present a paywall. Accepts an `Error` indicating why the paywall could not present.
* `onSkip`: Called when a paywall is skipped. Accepts a `PaywallSkippedReason` enum indicating why the paywall was skipped.

<Tabs items={["Swift","Objective-C","Kotlin","Flutter","React Native"]} groupId="language" persist>
  <Tab value="Swift">
    ```swift Swift
    let handler = PaywallPresentationHandler()
    handler.onDismiss { paywallInfo, result in
      print("The paywall dismissed. PaywallInfo: \(paywallInfo). Result: \(result)")
    }
    handler.onPresent { paywallInfo in
      print("The paywall presented. PaywallInfo:", paywallInfo)
    }
    handler.onError { error in
      print("The paywall presentation failed with error \(error)")
    }
    handler.onSkip { reason in
      switch reason {
      case .holdout(let experiment):
        print("Paywall not shown because user is in a holdout group in Experiment: \(experiment.id)")
      case .noAudienceMatch:
        print("Paywall not shown because user doesn't match any audiences.")
      case .placementNotFound:
        print("Paywall not shown because this placement isn't part of a campaign.")
      }
    }

    Superwall.shared.register(placement: "campaign_trigger", handler: handler) {
      // Feature launched
    }
    ```
  </Tab>

  <Tab value="Objective-C">
    ```swift Objective-C
    SWKPaywallPresentationHandler *handler = [[SWKPaywallPresentationHandler alloc] init];

    [handler onDismiss:^(SWKPaywallInfo * _Nonnull paywallInfo,
                             enum SWKPaywallResult result,
                             SWKStoreProduct * _Nullable product) {
      NSLog(@"The paywall presented. PaywallInfo: %@ - result: %ld", paywallInfo, (long)result);
    }];

    [handler onPresent:^(SWKPaywallInfo * _Nonnull paywallInfo) {
      NSLog(@"The paywall presented. PaywallInfo: %@", paywallInfo);
    }];

    [handler onError:^(NSError * _Nonnull error) {
      NSLog(@"The paywall presentation failed with error %@", error);
    }];

    [handler onSkip:^(enum SWKPaywallSkippedReason reason) {
      switch (reason) {
        case SWKPaywallSkippedReasonUserIsSubscribed:
          NSLog(@"Paywall not shown because user is subscribed.");
          break;
        case SWKPaywallSkippedReasonHoldout:
          NSLog(@"Paywall not shown because user is in a holdout group.");
          break;
        case SWKPaywallSkippedReasonNoAudienceMatch:
          NSLog(@"Paywall not shown because user doesn't match any audiences.");
          break;
        case SWKPaywallSkippedReasonPlacementNotFound:
          NSLog(@"Paywall not shown because this placement isn't part of a campaign.");
          break;
        case SWKPaywallSkippedReasonNone:
          // The paywall wasn't skipped.
          break;
      }
    }];

    [[Superwall sharedInstance] registerWithPlacement:@"campaign_trigger" params:nil handler:handler feature:^{
      // Feature launched.
    }];
    ```
  </Tab>

  <Tab value="Kotlin">
    ```kotlin Kotlin
    val handler = PaywallPresentationHandler()
    handler.onDismiss { paywallInfo, result ->
      println("The paywall dismissed. PaywallInfo: ${it}")
    }
    handler.onPresent {
      println("The paywall presented. PaywallInfo: ${it}")
    }
    handler.onError {
      println("The paywall errored. Error: ${it}")
    }
    handler.onSkip {
      when (it) {
        is PaywallSkippedReason.PlacementNotFound -> {
          println("The paywall was skipped because the placement was not found.")
        }
        is PaywallSkippedReason.Holdout -> {
          println("The paywall was skipped because the user is in a holdout group.")
        }
        is PaywallSkippedReason.NoAudienceMatch -> {
          println("The paywall was skipped because no audience matched.")
        }
      }
    }

    Superwall.instance.register(placement = "campaign_trigger", handler = handler) {
        // Feature launched
    }
    ```
  </Tab>

  <Tab value="Flutter">
    ```dart Flutter
    PaywallPresentationHandler handler = PaywallPresentationHandler();
    handler.onPresent((paywallInfo) async {
      String name = await paywallInfo.name;
      print("Handler (onPresent): $name");
    });
    handler.onDismiss((paywallInfo, paywallResult) async {
      String name = await paywallInfo.name;
      print("Handler (onDismiss): $name");
    });
    handler.onError((error) {
      print("Handler (onError): ${error}");
    });
    handler.onSkip((skipReason) async {
      String description = await skipReason.description;

      if (skipReason is PaywallSkippedReasonHoldout) {
        print("Handler (onSkip): $description");

        final experiment = await skipReason.experiment;
        final experimentId = await experiment.id;
        print("Holdout with experiment: ${experimentId}");
      } else if (skipReason is PaywallSkippedReasonNoAudienceMatch) {
        print("Handler (onSkip): $description");
      } else if (skipReason is PaywallSkippedReasonPlacementNotFound) {
        print("Handler (onSkip): $description");
      } else {
        print("Handler (onSkip): Unknown skip reason");
      }
    });

    Superwall.shared.registerPlacement("campaign_trigger", handler: handler, feature: () {
      // Feature launched
    });
    ```
  </Tab>

  <Tab value="React Native">
    ```typescript React Native
    const handler = new PaywallPresentationHandler()
    handler.onPresent((paywallInfo) => {
      const name = paywallInfo.name
      console.log(`Handler (onPresent): ${name}`)
    })
    handler.onDismiss((paywallInfo, paywallResult) => {
      const name = paywallInfo.name
      console.log(`Handler (onDismiss): ${name}`)
    })
    handler.onError((error) => {
      console.log(`Handler (onError): ${error}`)
    })
    handler.onSkip((skipReason) => {
      const description = skipReason.description

      if (skipReason instanceof PaywallSkippedReasonHoldout) {
        console.log(`Handler (onSkip): ${description}`)
        const experiment = skipReason.experiment
        const experimentId = experiment.id
        console.log(`Holdout with experiment: ${experimentId}`)
      } else if (skipReason instanceof PaywallSkippedReasonNoAudienceMatch) {
        console.log(`Handler (onSkip): ${description}`)
      } else if (skipReason instanceof PaywallSkippedReasonPlacementNotFound) {
        console.log(`Handler (onSkip): ${description}`)
      } else {
        console.log(`Handler (onSkip): Unknown skip reason`)
      }
    })

    Superwall.shared.register({
      placement: 'campaign_trigger',
      handler: handler,
      feature: () => {
        // Feature launched
      }
    });
    ```
  </Tab>
</Tabs>

:::expo
```tsx React Native
import { usePlacement } from "expo-superwall";
import { Button } from "react-native";

function PaywallButton() {
  const { registerPlacement } = usePlacement({
    onPresent: (paywallInfo) => {
      console.log(`Handler (onPresent): ${paywallInfo.name}`);
    },
    onDismiss: (paywallInfo, paywallResult) => {
      console.log(`Handler (onDismiss): ${paywallInfo.name}`);
      // Check the result to see if user purchased
      console.log(`Result:`, paywallResult);
    },
    onError: (error) => {
      console.log(`Handler (onError): ${error}`);
    },
    onSkip: (skipReason) => {
      console.log(`Handler (onSkip):`, skipReason);
    },
  });

  const handlePress = async () => {
    await registerPlacement({
      placement: 'campaign_trigger',
      feature: () => {
        // Feature launched
        console.log("Feature unlocked!");
      },
    });
  };

  return <Button onPress={handlePress} title="Show Paywall" />;
}
```
:::

<Tip>
  Wanting to see which product was just purchased from a paywall? Use `onDismiss` and the `result`
  parameter. Or, you can use the
  [SuperwallDelegate](/3rd-party-analytics#using-events-to-see-purchased-products).
</Tip>


---

# Viewing Purchased Products
Source: https://superwall.com/docs/expo/guides/advanced/viewing-purchased-products

undefined

When a paywall is presenting and a user converts, you can view the purchased products in several different ways.

### Use the `PaywallPresentationHandler`

Arguably the easiest of the options â€” simply pass in a presentation handler and check out the product within the `onDismiss` block.

<Tabs items={["Swift  ","Objective-C","Android","Flutter","React Native"]} groupId="language" persist>
  <Tab value="Swift  ">
    ```swift Swift  
    let handler = PaywallPresentationHandler()
    handler.onDismiss { _, result in
      switch result {
      case .declined:
          print("No purchased occurred.")
      case .purchased(let product):
          print("Purchased \(product.productIdentifier)")
      case .restored:
          print("Restored purchases.")
      }
    }

    Superwall.shared.register(placement: "caffeineLogged", handler: handler) {
    logCaffeine()
    }

    ```
  </Tab>

  <Tab value="Objective-C">
    ```swift Objective-C
    SWKPaywallPresentationHandler *handler = [SWKPaywallPresentationHandler new];
    [handler onDismiss:^(SWKPaywallInfo * _Nonnull info,
                          enum SWKPaywallResult result,
                          SWKStoreProduct * _Nullable product) {
      switch (result) {
        case SWKPaywallResultPurchased:
          NSLog(@"Purchased %@", product.productIdentifier);
        default:
          NSLog(@"Unhandled event.");
      }
    }];

    [[Superwall sharedInstance] registerWithPlacement:@"caffeineLogged"
                                               params:@{}
                                              handler:handler
                                              feature:^{
      [self logCaffeine];
    }];
    ```
  </Tab>

  <Tab value="Android">
    ```kotlin Android
    val handler = PaywallPresentationHandler()
    handler.onDismiss { _, paywallResult ->
      when (paywallResult) {
        is PaywallResult.Purchased -> {
            // The user made a purchase!
            val purchasedProductId = paywallResult.productId
            println("User purchased product: $purchasedProductId")
            // ... do something with the purchased product ID ...
        }
        is PaywallResult.Declined -> {
            // The user declined to make a purchase.
            println("User declined to make a purchase.")
            // ... handle the declined case ...
        }
        is PaywallResult.Restored -> {
            // The user restored a purchase.
            println("User restored a purchase.")
            // ... handle the restored case ...
        }
      }
    }

    Superwall.instance.register(placement = "caffeineLogged", handler = handler) {
       logCaffeine()
    }
    ```
  </Tab>

  <Tab value="Flutter">
    ```dart Flutter
      PaywallPresentationHandler handler = PaywallPresentationHandler();

      handler.onDismiss((paywallInfo, paywallResult) async {
        String name = await paywallInfo.name;
        print("Handler (onDismiss): $name");
        switch (paywallResult) {
          case PurchasedPaywallResult(productId: var id):
            // The user made a purchase!
            print('User purchased product: $id');
            // ... do something with the purchased product ID ...
            break;
          case DeclinedPaywallResult():
            // The user declined to make a purchase.
            print('User declined the paywall.');
            // ... handle the declined case ...
            break;
          case RestoredPaywallResult():
            // The user restored a purchase.
            print('User restored a previous purchase.');
            // ... handle the restored case ...
            break;
        }
      });

      Superwall.shared.registerPlacement(
          "caffeineLogged", handler: handler, feature: () {
        logCaffeine();
      });
    ```
  </Tab>

  <Tab value="React Native">
    ```typescript React Native
    import * as React from "react"
    import Superwall from "../../src"
    import { PaywallPresentationHandler, PaywallInfo } from "../../src"
    import type { PaywallResult } from "../../src/public/PaywallResult"

    const Home = () => {
      const navigation = useNavigation<HomeScreenNavigationProp>()

      const presentationHandler: PaywallPresentationHandler = {
        onDismiss: (handler: (info: PaywallInfo, result: PaywallResult) => void) => {
          handler = (info, result) => {
            console.log("Paywall dismissed with info:", info, "and result:", result)
            if (result.type === "purchased") {
              console.log("Product purchased with ID:", result.productId)
            }
          }
        },
        onPresent: (handler: (info: PaywallInfo) => void) => {
          handler = (info) => {
            console.log("Paywall presented with info:", info)
            // Add logic for when the paywall is presented
          }
        },
        onError: (handler: (error: string) => void) => {
          handler = (error) => {
            console.error("Error presenting paywall:", error)
            // Handle any errors that occur during presentation
          }
        },
        onSkip: () => {
          console.log("Paywall presentation skipped")
          // Handle the case where the paywall presentation is skipped
        },
      }

      const nonGated = () => {
        Superwall.shared.register({ placement: "non_gated", handler: presentationHandler, feature: () => {
          navigation.navigate("caffeineLogged", {
            value: "Go for caffeine logging",
          })
        });
      }

      return <View style={styles.container}>// Your view code here</View>
    }
    ```
  </Tab>
</Tabs>

### Use `SuperwallDelegate`

Next, the [SuperwallDelegate](/using-superwall-delegate) offers up much more information, and can inform you of virtually any Superwall event that occurred:

<Tabs items={["Swift ","Objective-C","Android","Flutter","React Native"]} groupId="language" persist>
  <Tab value="Swift ">
    ```swift Swift 
    class SWDelegate: SuperwallDelegate {
      func handleSuperwallEvent(withInfo eventInfo: SuperwallEventInfo) {
        switch eventInfo.event {
        case .transactionComplete(_, let product, _, _):
          print("Transaction complete: product: \(product.productIdentifier)")
        case .subscriptionStart(let product, _):
          print("Subscription start: product: \(product.productIdentifier)")
        case .freeTrialStart(let product, _):
          print("Free trial start: product: \(product.productIdentifier)")
        case .transactionRestore(_, _):
          print("Transaction restored")
        case .nonRecurringProductPurchase(let product, _):
          print("Consumable product purchased: \(product.id)")
        default:
          print("Unhandled event.")
        }
      }
    }

    @main
    struct Caffeine_PalApp: App {
      @State private var swDelegate: SWDelegate = .init()

      init() {
        Superwall.configure(apiKey: "my_api_key")
        Superwall.shared.delegate = swDelegate
      }

      var body: some Scene {
        WindowGroup {
          ContentView()
        }
      }
    }
    ```
  </Tab>

  <Tab value="Objective-C">
    ```swift Objective-C
    // SWDelegate.h...
    #import <Foundation/Foundation.h>
    @import SuperwallKit;

    NS_ASSUME_NONNULL_BEGIN

    @interface SWDelegate : NSObject <SWKSuperwallDelegate>

    @end

    NS_ASSUME_NONNULL_END

    // SWDelegate.m...
    @implementation SWDelegate

    - (void)handleSuperwallEventWithInfo:(SWKSuperwallEventInfo *)eventInfo {
      switch(eventInfo.event) {
        case SWKSuperwallEventTransactionComplete:
          NSLog(@"Transaction complete: %@", eventInfo.params[@"primary_product_id"]);
      }
    }

    // In AppDelegate.m...
    #import "AppDelegate.h"
    #import "SWDelegate.h"
    @import SuperwallKit;

    @interface AppDelegate ()

    @property (strong, nonatomic) SWDelegate *delegate;

    @end

    @implementation AppDelegate

    - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
        // Override point for customization after application launch.
        self.delegate = [SWDelegate new];
        [Superwall configureWithApiKey:@"my_api_key"];
        [Superwall sharedInstance].delegate = self.delegate;

        return YES;
    }
    ```
  </Tab>

  <Tab value="Android">
    ```kotlin Android
    class SWDelegate : SuperwallDelegate {
      override fun handleSuperwallEvent(eventInfo: SuperwallEventInfo) {
        when (eventInfo.event) {
            is SuperwallPlacement.TransactionComplete -> {
              val transaction = (eventInfo.event as SuperwallPlacement.TransactionComplete).transaction
              val product = (eventInfo.event as SuperwallPlacement.TransactionComplete).product
              val paywallInfo = (eventInfo.event as SuperwallPlacement.TransactionComplete).paywallInfo
              println("Transaction Complete: $transaction, Product: $product, Paywall Info: $paywallInfo")
            }
            else -> {
              // Handle other cases
            }
        }
      }
    }

    class MyApplication : Application() {
        override fun onCreate() {
            super.onCreate()
            Superwall.configure(this, "my_api_key")
            Superwall.instance.delegate = SWDelegate()
        }
    }
    ```
  </Tab>

  <Tab value="Flutter">
    ```dart Flutter
    import 'dart:io';
    import 'package:flutter/material.dart';
    import 'package:superwallkit_flutter/superwallkit_flutter.dart';

    class _MyAppState extends State<MyApp> implements SuperwallDelegate {
      final logging = Logging();

      @override
      void initState() {
        super.initState();
        configureSuperwall(useRevenueCat);
      }

      Future<void> configureSuperwall(bool useRevenueCat) async {
        try {
          final apiKey = Platform.isIOS
              ? 'ios_api_project_key'
              : 'android_api_project_key';

          final logging = Logging();
          logging.level = LogLevel.warn;
          logging.scopes = {LogScope.all};

          final options = SuperwallOptions();
          options.paywalls.shouldPreload = false;
          options.logging = logging;

          Superwall.configure(apiKey,
              purchaseController: null,
              options: options, completion: () {
            logging.info('Executing Superwall configure completion block');
          });

          Superwall.shared.setDelegate(this);
        } catch (e) {
          // Handle any errors that occur during configuration
          logging.error('Failed to configure Superwall:', e);
        }
      }

      @override
      Future<void> handleSuperwallEvent(SuperwallEventInfo eventInfo) async {
        switch (eventInfo.event.type) {
          case PlacementType.transactionComplete:
            final product = eventInfo.params?['product'];
            logging.info('Transaction complete event received with product: $product');

            // Add any additional logic you need to handle the transaction complete event
            break;
          // Handle other events if necessary
          default:
            logging.info('Unhandled event type: ${eventInfo.event.type}');
            break;
        }
      }
    }
    ```
  </Tab>

  <Tab value="React Native">
    ```typescript React Native
    import {
      PaywallInfo,
      SubscriptionStatus,
      SuperwallDelegate,
      SuperwallPlacementInfo,
      PlacementType,
    } from '../../src';

    export class MySuperwallDelegate extends SuperwallDelegate {
      handleSuperwallPlacement(placementInfo: SuperwallPlacementInfo) {
        console.log('Handling Superwall placement:', placementInfo);

        switch (placementInfo.placement.type) {
          case PlacementType.transactionComplete:
            const product = placementInfo.params?.["product"];
            if (product) {
              console.log(`Product: ${product}`);
            } else {
              console.log("Product not found in params.");
            }
            break;
          default:
            break;
        }
      }
    }

    export default function App() {
      const delegate = new MySuperwallDelegate();

      React.useEffect(() => {
        const setupSuperwall = async () => {
          const apiKey =
            Platform.OS === 'ios'
              ? 'ios_api_project_key'
              : 'android_api_project_key';

          Superwall.configure({
            apiKey: apiKey,
          });

          Superwall.shared.setDelegate(delegate);
        };
      }
    }
    ```
  </Tab>
</Tabs>

### Use a purchase controller

If you are controlling the purchasing pipeline yourself via a [purchase controller](/advanced-configuration), then naturally the purchased product is available:

<Tabs items={["Swift","Objective-C","Android","Flutter","React Native"]} groupId="language" persist>
  <Tab value="Swift">
    ```swift Swift
    final class MyPurchaseController: PurchaseController {
      func purchase(product: StoreProduct) async -> PurchaseResult {
        print("Kicking off purchase of \(product.productIdentifier)")

        do {
          let result = try await MyPurchaseLogic.purchase(product: product)
          return .purchased // .cancelled,  .pending, .failed(Error)
        } catch {
          return .failed(error)
        }

    }

    // 2
    func restorePurchases() async -> RestorationResult {
    print("Restoring purchases")
    return .restored // false
    }
    }

    @main
    struct Caffeine_PalApp: App {
    private let pc: MyPurchaseController = .init()

    init() {
    Superwall.configure(apiKey: "my_api_key", purchaseController: pc)
    }

    var body: some Scene {
    WindowGroup {
    ContentView()
    }
    }
    }

    ```
  </Tab>

  <Tab value="Objective-C">
    ```swift Objective-C
    // In MyPurchaseController.h...
    #import <Foundation/Foundation.h>
    @import SuperwallKit;
    @import StoreKit;

    NS_ASSUME_NONNULL_BEGIN

    @interface MyPurchaseController : NSObject<SWKPurchaseController>
    + (instancetype)sharedInstance;
    @end

    NS_ASSUME_NONNULL_END

    // In MyPurchaseController.m...
    #import "MyPurchaseController.h"

    @implementation MyPurchaseController

    + (instancetype)sharedInstance
    {
      static MyPurchaseController *sharedInstance = nil;
      static dispatch_once_t onceToken;
      dispatch_once(&onceToken, ^{
        sharedInstance = [MyPurchaseController new];
      });
      return sharedInstance;
    }


    - (void)purchaseWithProduct:(SWKStoreProduct * _Nonnull)product
                     completion:(void (^ _Nonnull)(enum SWKPurchaseResult, NSError * _Nullable))completion {
      NSLog(@"Kicking off purchase of %@", product.productIdentifier);
      // Do purchase logic here
      completion(SWKPurchaseResultPurchased, nil);
    }

    - (void)restorePurchasesWithCompletion:(void (^ _Nonnull)(enum SWKRestorationResult, NSError * _Nullable))completion {
      // Do restore logic here
      completion(SWKRestorationResultRestored, nil);
    }
    @end

    // In AppDelegate.m...

    #import "AppDelegate.h"
    #import "MyPurchaseController.h"
    @import SuperwallKit;

    @interface AppDelegate ()
    @end

    @implementation AppDelegate

    - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
        // Override point for customization after application launch.
        [Superwall configureWithApiKey:@"my_api_key"
                    purchaseController:[MyPurchaseController sharedInstance]
                               options:nil
                            completion:^{

        }];

        return YES;
    }
    ```
  </Tab>

  <Tab value="Android">
    ```kotlin Android
    class MyPurchaseController(val context: Context): PurchaseController {
        override suspend fun purchase(
            activity: Activity,
            productDetails: ProductDetails,
            basePlanId: String?,
            offerId: String?
        ): PurchaseResult {
            println("Kicking off purchase of $basePlanId")
            return PurchaseResult.Purchased()
        }

        override suspend fun restorePurchases(): RestorationResult {
            TODO("Not yet implemented")
        }
    }

    class MyApplication : Application() {
        override fun onCreate() {
            super.onCreate()
            Superwall.configure(this, "my_api_key", purchaseController = MyPurchaseController(this))
        }
    }
    ```
  </Tab>

  <Tab value="Flutter">
    ```dart Flutter
    class MyPurchaseController extends PurchaseController {
      // 1
      @override
      Future<PurchaseResult> purchaseFromAppStore(String productId) async {
        print('Attempting to purchase product with ID: $productId');
        // Do purchase logic
        return PurchaseResult.purchased;
      }

      @override
      Future<PurchaseResult> purchaseFromGooglePlay(
        String productId,
        String? basePlanId,
        String? offerId
      ) async {
        print('Attempting to purchase product with ID: $productId and basePlanId: $basePlanId');
        // Do purchase logic
        return PurchaseResult.purchased;
      }

      @override
      Future<RestorationResult> restorePurchases() async {
        // Do resture logic
      }
    }
    ```
  </Tab>

  <Tab value="React Native">
    ```typescript React Native
    export class MyPurchaseController extends PurchaseController {
      // 1
      async purchaseFromAppStore(productId: string): Promise<PurchaseResult> {
        console.log("Kicking off purchase of ", productId)
        // Purchase logic
        return await this._purchaseStoreProduct(storeProduct)
      }

      async purchaseFromGooglePlay(
        productId: string,
        basePlanId?: string,
        offerId?: string
      ): Promise<PurchaseResult> {
        console.log("Kicking off purchase of ", productId, " base plan ID", basePlanId)
        // Purchase logic
        return await this._purchaseStoreProduct(storeProduct)
      }

      // 2
      async restorePurchases(): Promise<RestorationResult> {
        // TODO
        // ----
        // Restore purchases and return true if successful.
      }
    }
    ```
  </Tab>
</Tabs>

### SwiftUI - Use `PaywallView`

The `PaywallView` allows you to show a paywall by sending it a placement. It also has a dismiss handler where the purchased product will be vended:

```swift
@main
struct Caffeine_PalApp: App {
  @State private var presentPaywall: Bool = false

  init() {
    Superwall.configure(apiKey: "my_api_key")
  }

  var body: some Scene {
    WindowGroup {
      Button("Log") {
        presentPaywall.toggle()
      }
      .sheet(isPresented: $presentPaywall) {
        PaywallView(placement: "caffeineLogged", params: nil, paywallOverrides: nil) { info, result in
          switch result {
          case .declined:
            print("No purchased occurred.")
          case .purchased(let product):
            print("Purchased \(product.productIdentifier)")
          case .restored:
            print("Restored purchases.")
          }
        } feature: {
          print("Converted")
          presentPaywall.toggle()
        }
      }
    }
  }
}
```


---

# Advanced Purchasing
Source: https://superwall.com/docs/expo/guides/advanced-configuration

If you need fine-grain control over the purchasing pipeline, use a purchase controller to manually handle purchases and subscription status.

<Warning>
  Using a `PurchaseController` is only recommended for **advanced** use cases. By default, Superwall handles all
  subscription-related logic and purchasing operations for you out of the box.
</Warning>

By default, Superwall handles basic subscription-related logic for you:

1. **Purchasing**: When the user initiates a checkout on a paywall.
2. **Restoring**: When the user restores previously purchased products.
3. **Subscription Status**: When the user's subscription status changes to active or expired (by checking the local receipt).

However, if you want more control, you can pass in a `PurchaseController` when configuring the SDK via `configure(apiKey:purchaseController:options:)` and manually set `Superwall.shared.subscriptionStatus` to take over this responsibility.

### Step 1: Creating a `PurchaseController`

A `PurchaseController` handles purchasing and restoring via protocol methods that you implement.

:::expo
```typescript React Native
export class MyPurchaseController extends PurchaseController {
  // 1
  async purchaseFromAppStore(productId: string): Promise<PurchaseResult> {
    // TODO
    // ----
    // Purchase via StoreKit, RevenueCat, Qonversion or however
    // you like and return a valid PurchaseResult
  }

  async purchaseFromGooglePlay(
    productId: string,
    basePlanId?: string,
    offerId?: string
  ): Promise<PurchaseResult> {
    // TODO
    // ----
    // Purchase via Google Billing, RevenueCat, Qonversion or however
    // you like and return a valid PurchaseResult
  }

  // 2
  async restorePurchases(): Promise<RestorationResult> {
    // TODO
    // ----
    // Restore purchases and return true if successful.
  }
}
```
:::

Hereâ€™s what each method is responsible for:

1. Purchasing a given product. In here, enter your code that you use to purchase a product. Then, return the result of the purchase as a `PurchaseResult`. For Flutter, this is separated into purchasing from the App Store and Google Play. This is an enum that contains the following cases, all of which must be handled:
   1. `.cancelled`: The purchase was cancelled.
   2. `.purchased`: The product was purchased.
   3. `.pending`: The purchase is pending/deferred and requires action from the developer.
   4. `.failed(Error)`: The purchase failed for a reason other than the user cancelling or the payment pending.
2. Restoring purchases. Here, you restore purchases and return a `RestorationResult` indicating whether the restoration was successful or not. If it was, return `.restore`, or `failed` along with the error reason.

### Step 2: Configuring the SDK With Your `PurchaseController`

Pass your purchase controller to the `configure(apiKey:purchaseController:options:)` method:

:::expo
```typescript React Native
export default function App() {
  React.useEffect(() => {
    const apiKey = Platform.OS === "ios" ? "MY_IOS_API_KEY" : "MY_ANDROID_API_KEY"
    const purchaseController = new MyPurchaseController()
    Superwall.configure({
      apiKey: apiKey,
      purchaseController: purchaseController,
    })
  }, [])
}
```
:::

### Step 3: Keeping `subscriptionStatus` Up-To-Date

You **must** set `Superwall.shared.subscriptionStatus` every time the user's subscription status changes, otherwise the SDK won't know who to show a paywall to. This is an enum that has three possible cases:

1. **`.unknown`**: This is the default value. In this state, paywalls will not show and their presentation will be ***automatically delayed*** until `subscriptionStatus` changes to a different value.
2. **`.active(let entitlements)`**: Indicates that the user has an active entitlement. Paywalls will not show in this state unless you remotely set the paywall to ignore subscription status. A user can have one or more active entitlement.
3. **`.inactive`**: Indicates that the user doesn't have an active entitlement. Paywalls can show in this state.

Here's how you might do this:

:::expo
```typescript React Native
// When a subscription is purchased, restored, validated, expired, etc...
myService.addSubscriptionStatusListener((subscriptionInfo: SubscriptionInfo) => {
  const entitlements = Object.keys(subscriptionInfo.entitlements.active).map((id) => ({
    id,
  }))
  if (entitlements.length === 0) {
    Superwall.shared.setSubscriptionStatus(SubscriptionStatus.Inactive())
  } else {
    Superwall.shared.setSubscriptionStatus(
      SubscriptionStatus.Active(entitlements.map((id) => new Entitlement(id)))
    )
  }
})
```
:::

<br />

<Note>
   

  `subscriptionStatus`

   is cached between app launches 
</Note>

### Listening for subscription status changes

If you need a simple way to observe when a user's subscription status changes, on iOS you can use the `Publisher` for it. Here's an example:

:::expo
```typescript React Native
Superwall.shared.subscriptionStatusEmitter.addListener("change", (status) => {
  switch (status.status) {
    case "ACTIVE":
      break
    default:
      break
  }
})
```
:::

You can do similar tasks with the `SuperwallDelegate`, such as [viewing which product was purchased from a paywall](/3rd-party-analytics#using-events-to-see-purchased-products).

### Product Overrides

<Note>
  Product overrides allow you to dynamically substitute products on paywalls without modifying the paywall design in the Superwall dashboard.
</Note>

When using a `PurchaseController`, you may want to override specific products shown on your paywalls. This is useful for:

* A/B testing different subscription tiers
* Showing region-specific products
* Dynamically changing products based on user segments
* Testing promotional pricing without modifying paywalls

**How Product Overrides Work:**

1. Product names (e.g., "primary", "secondary") must match exactly as defined in the Superwall dashboard's Paywall Editor
2. The SDK substitutes the original product IDs with your override IDs before fetching from the App Store
3. The paywall maintains its visual design while showing the substituted products
4. Your `PurchaseController` will receive the overridden products when `purchase(product:)` is called

<Warning>
  Product overrides only affect the products shown on paywalls. They don't change your subscription logic or entitlement validation.
</Warning>


---

# Configuring
Source: https://superwall.com/docs/expo/guides/configuring

undefined

### Logging

Logging is enabled by default in the SDK and is controlled by two properties: `level` and `scopes`.

`level` determines the minimum log level to print to the console. There are five types of log level:

1. **debug**: Prints all logs from the SDK to the console. Useful for debugging your app if something isn't working as expected.
2. **info**: Prints errors, warnings, and useful information from the SDK to the console.
3. **warn**: Prints errors and warnings from the SDK to the console.
4. **error**: Only prints errors from the SDK to the console.
5. **none**: Turns off all logs.

The SDK defaults to `info`.

`scopes` defines the scope of logs to print to the console. For example, you might only care about logs relating to `paywallPresentation` and `paywallTransactions`. This defaults to `.all`. Check out [LogScope](https://sdk.superwall.me/documentation/superwallkit/logscope) for all possible cases.

You set these properties like this:

:::expo
```typescript
const options = new SuperwallOptions()
options.logging.level = LogLevel.Warn
options.logging.scopes = [LogScope.PaywallPresentation, LogScope.PaywallTransactions]

Superwall.configure(
  "MY_API_KEY",
  null,
  options: options
);

// Or you can set:
await Superwall.shared.setLogLevel(LogLevel.Warn)
```
:::

### Preloading Paywalls

Paywalls are preloaded by default when the app is launched from a cold start. The paywalls that are preloaded are determined by the list of placements that result in a paywall for the user when [registered](/docs/feature-gating). Preloading is smart, only preloading paywalls that belong to audiences that could be matched.

Paywalls are cached by default, which means after they load once, they don't need to be reloaded from the network unless you make a change to them on the dashboard. However, if you have a lot of paywalls, preloading may increase network usage of your app on first load of the paywalls and result in slower loading times overall.

You can turn off preloading by setting `shouldPreload` to `false`:

:::expo
```typescript
const options = new SuperwallOptions()
options.paywalls.shouldPreload = false

Superwall.configure(
  "MY_API_KEY",
  null,
  options: options
);

// Or you can set:
Superwall.instance.logLevel = LogLevel.Warn
```
:::

Then, if you'd like to preload paywalls for specific placements you can use `preloadPaywalls(forPlacements:)`:

:::expo
```typescript
var placements = {"campaign_trigger"};
Superwall.shared.preloadPaywalls(placements);
```
:::

If you'd like to preload all paywalls you can use `preloadAllPaywalls()`:

:::expo
```typescript
// Coming soon
```
:::

Note: These methods will not reload any paywalls that have already been preloaded.

### External Data Collection

By default, Superwall sends all registered events and properties back to the Superwall servers. However, if you have privacy concerns, you can stop this by setting `isExternalDataCollectionEnabled` to `false`:

:::expo
```typescript
const options = SuperwallOptions()
options.isExternalDataCollectionEnabled = false

Superwall.configure(
  "MY_API_KEY",
  options: options
);
```
:::

Disabling this will not affect your ability to create triggers based on properties.

### Automatically Dismissing the Paywall

By default, Superwall automatically dismisses the paywall when a product is purchased or restored. You can disable this by setting `automaticallyDismiss` to `false`:

:::expo
```typescript
const options = SuperwallOptions()
options.paywalls.automaticallyDismiss = false

Superwall.configure(
  "MY_API_KEY",
  null,
  options: options
);
```
:::

To manually dismiss the paywall , call `Superwall.shared.dismiss()`.

### Custom Restore Failure Message

You can set the title, message and close button title for the alert that appears after a restoration failure:

:::expo
```typescript
const options = SuperwallOptions()
options.paywalls.restoreFailed.title = "My Title"
options.paywalls.restoreFailed.message = "My message";
options.paywalls.restoreFailed.closeButtonTitle = "Close";

Superwall.configure(
  "MY_API_KEY",
  null,
  options: options
);
```
:::

### Haptic Feedback

On iOS, the paywall uses haptic feedback by default after a user purchases or restores a product, opens a URL from the paywall, or closes the paywall. To disable this, set the `isHapticFeedbackEnabled` `PaywallOption` to false:

:::expo
```typescript
const options = SuperwallOptions()
options.paywalls.isHapticFeedbackEnabled = false;

Superwall.configure(
  "MY_API_KEY",
  null,
  options: options
);
```
:::

Note: Android does not use haptic feedback.

### Transaction Background View

During a transaction, we add a `UIActivityIndicator` behind the view to indicate a loading status. However, you can remove this by setting the `transactionBackgroundView` to `nil`:

:::expo
```typescript
const options = SuperwallOptions()
options.paywalls.transactionBackgroundView = TransactionBackgroundView.none

Superwall.configure(
  "MY_API_KEY",
  null,
  options: options
);
```
:::

### Purchase Failure Alert

When a purchase fails, we automatically present an alert with the error message. If you'd like to show your own alert after failure, set the `shouldShowPurchaseFailureAlert` `PaywallOption` to `false`:

:::expo
```typescript
const options = SuperwallOptions()
options.paywalls.shouldShowPurchaseFailureAlert = false;

Superwall.configure(
  "MY_API_KEY",
  null,
  options: options
);
```
:::

### Web Purchase Confirmation Alert

When a user completes a purchase via web checkout (app2web flow), you can control whether to show a confirmation alert. By default, this is set to `false` to prevent duplicate alerts. Set `shouldShowWebPurchaseConfirmationAlert` to `true` if you want to show the native confirmation alert:

:::expo
```typescript
const options = new SuperwallOptions()
options.paywalls.shouldShowWebPurchaseConfirmationAlert = true

Superwall.configure(
  "MY_API_KEY",
  null,
  options: options
);
```
:::

### Locale Identifier

When evaluating rules, the device locale identifier is set to `autoupdatingCurrent`. However, you can override this if you want to test a specific locale:

:::expo
```typescript
const options = SuperwallOptions()
options.localeIdentifier = "en_GB";

Superwall.configure(
  "MY_API_KEY",
  null,
  options: options
);
```
:::

For a list of locales that are available on iOS, take a look at [this list](https://gist.github.com/jacobbubu/1836273). You can also preview your paywall in different locales using [In-App Previews](/docs/in-app-paywall-previews).

### Game Controller

If you're using a game controller, you can enable this in `SuperwallOptions` too. Check out our [Game Controller Support](/docs/game-controller-support) article.

Take a look at [SuperwallOptions](https://sdk.superwall.me/documentation/superwallkit/superwalloptions) in our SDK reference for more info.


---

# Debugging
Source: https://superwall.com/docs/expo/guides/debugging

Common issues and solutions when integrating the Superwall Expo SDK.

## Cannot find native module 'SuperwallExpo'

This error occurs when the native Superwall module isn't properly linked in your app. There are several common causes.

### Cause 1: Using Expo Go

**Expo Go does not support custom native modules.** Superwall requires native code that isn't included in Expo Go.

**Solution:** Use an [Expo Development Build](https://docs.expo.dev/develop/development-builds/introduction/) instead.

```bash
# For iOS
npx expo run:ios

# For Android
npx expo run:android
```

<Note>
  You can tell you're running Expo Go if the app icon is the Expo logo. Your development build will show your own app icon.
</Note>

### Cause 2: Outdated Native Folders

If you added `expo-superwall` to an existing project, your `ios` and `android` folders may be outdated and missing the native module configuration.

**Solution:** Regenerate your native folders:

```bash
# Clean and regenerate native folders
npx expo prebuild --clean
```

This will delete your existing `ios` and `android` folders and regenerate them with the correct native module configuration.

<Warning>
  If you've made manual changes to your native folders, back them up first. The `--clean` flag will remove all custom native code.
</Warning>

### Cause 3: EAS Build Not Updated

If you're using EAS Build, you need to create a new development build after adding `expo-superwall`.

**Solution:** Build a new development client:

```bash
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

### Cause 4: Stale Caches

Cached build artifacts can cause issues after updating dependencies.

**Solution:** Clear all caches and rebuild:

```bash
# Clear watchman (if installed)
watchman watch-del-all

# Clear Expo cache
npx expo start --clear

# Remove and reinstall dependencies
rm -rf node_modules
npm install  # or yarn/pnpm/bun

# For iOS: reinstall pods
cd ios && pod install --repo-update && cd ..

# Rebuild
npx expo run:ios
```

### Cause 5: Version Incompatibility

Your Expo SDK version may not be compatible with `expo-superwall`.

**Solution:** Run the Expo doctor to check for issues:

```bash
npx expo-doctor
npx expo install --check
```

<Warning>
  Superwall requires **Expo SDK 53 or higher**. If you're on an older version, upgrade your Expo SDK first.
</Warning>

### Still Having Issues?

If none of the above solutions work:

1. **Completely clean rebuild:**
   ```bash
   rm -rf node_modules ios android .expo
   npm install
   npx expo prebuild --clean
   npx expo run:ios
   ```

2. **Verify the package is installed:**
   ```bash
   npm ls expo-superwall
   ```

3. **Check for conflicting packages** that might interfere with native module resolution


---

# Experimental Flags
Source: https://superwall.com/docs/expo/guides/experimental-flags

undefined

Experimental flags in Superwall's SDK allow you to opt into features that are safe for production but are still being refined. These features may undergo naming changes or internal restructuring in future SDK versions. We expose them behind flags to give you early access while preserving flexibility for ongoing development.

These flags are configured via the `SuperwallOptions` struct:

```swift
let options = SuperwallOptions()
options.enableExperimentalDeviceVariables = true
Superwall.configure(apiKey: "my_api_key",
                    options: options)
```

## Available experimental flags

When these flags are enabled and the user runs your app, these values become available in campaign filters. Currently, these include:

**Latest Subscription Period Type (String)**:
Represents whether the user is in a trial, promotional, or a similar phase. Possible values include:

* `trial`
* `code`
* `subscription`
* `promotional`
* `winback`
* `revoked`

Represented as `latestSubscriptionPeriodType` in campaign filters.

**Latest Subscription State (String)**:
Represents what *state* the actual subscription is in. Possible values include:

* `inGracePeriod`
* `subscribed`
* `expired`
* `inBillingRetryPeriod`
* `revoked`

Represented as `latestSubscriptionState` in campaign filters.

**Latest Subscription Will Auto Renew (Bool)**:
If the user is set to renew or not. Either `true` or `false`

Represented as `latestSubscriptionWillAutoRenew` in campaign filters.

### Detecting users who've cancelled an active trial

One common use case for these flags is detecting users who've cancelled an active trial. In that case, the filter in the campaign would check for `latestSubscriptionWillAutoRenew` to be `false` and `latestSubscriptionPeriodType` to be `trial`.

:::expo
### Platform Availability

These variables are currently only available on **iOS**, support for Android is not yet available.
:::


---

# Managing Users
Source: https://superwall.com/docs/expo/guides/managing-users

Learn how to manage users in your app.

## Overview

The [`useUser`](/expo/sdk-reference/hooks/useUser) hook provides functions to identify users, sign them out, update their attributes, and access user and subscription status information.

## Example

```tsx
import { useUser } from "expo-superwall";
import { Button, Text, View } from "react-native";

function UserManagementScreen() {
  const { identify, user, signOut, update, subscriptionStatus } = useUser();

  const handleLogin = async () => {
    // Identify the user with a unique ID
    await identify(`user_${Date.now()}`);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleUpdateUserAttributes = async () => {
    // Update custom user attributes
    await update((oldAttributes) => ({
      ...oldAttributes,
      customProperty: "new_value",
      counter: (oldAttributes.counter || 0) + 1,
    }));
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Subscription Status: {subscriptionStatus?.status ?? "unknown"}</Text>
      {user && <Text>User ID: {user.appUserId}</Text>}
      {user && <Text>User Attributes: {JSON.stringify(user, null, 2)}</Text>}

      <Button title="Login" onPress={handleLogin} />
      <Button title="Sign Out" onPress={handleSignOut} />
      <Button title="Update Attributes" onPress={handleUpdateUserAttributes} />
    </View>
  );
}
```


---

# Migrating from React Native SDK
Source: https://superwall.com/docs/expo/guides/migrating-react-native

Guide to migrating from the legacy React Native SDK

This guide is for React Native projects that already have Superwall's legacy React Native SDK installed and want to migrate to the new Expo SDK.

<Note>
  **This doesn't sound like you?**

  * **Expo project** â†’ Use the standard [installation guide](/expo/quickstart/install)
  * **React Native app, new to Superwall** â†’ See our [installation guide for bare React Native apps](/expo/guides/using-expo-sdk-in-bare-react-native)
</Note>

<Warning>
  **Important: Expo SDK 53+ Required**

  This SDK is exclusively compatible with Expo SDK version 53 and newer. For projects using older Expo versions, please use our [legacy React Native SDK](https://github.com/superwall/react-native-superwall).
</Warning>

This guide is to help you migrate your project using the legacy `react-native-superwall` SDK to the new Expo SDK. The `expo-superwall/compat` SDK is intended to make it easy for existing projects to migrate over.

## Installation

First, you need to install `expo-superwall` using your package manager of choice.

<Tabs items={["bun","pnpm","npm","yarn"]} groupId="language" persist>
  <Tab value="bun">
    ```bash bun
    bunx expo install expo-superwall
    ```
  </Tab>

  <Tab value="pnpm">
    ```bash pnpm
    pnpm dlx expo install expo-superwall
    ```
  </Tab>

  <Tab value="npm">
    ```bash npm
    npx expo install expo-superwall
    ```
  </Tab>

  <Tab value="yarn">
    ```bash yarn
    yarn dlx expo install expo-superwall
    ```
  </Tab>
</Tabs>

## Basic Setup

Configure the SDK with your **Public API Key**. You'll retrieve this from the Superwall settings page, same as your existing React Native project.

```tsx
import Superwall from "expo-superwall/compat"
import { useEffect, useState } from "react"
import { Platform } from "react-native"

// Initialize Superwall
useEffect(()=> {
	const apiKey = Platform.OS === "ios"
        ? "yourSuperwall_iOSKey"
        : "yourSuperwall_androidKey";
	Superwall.configure({ // `await` is optional here if not chaining or needing immediate confirmation
		apiKey,
	});
})
```

## Identify User

```tsx
// Identify a user
await Superwall.shared.identify({ userId })

// Set User Attributes
await Superwall.shared.setUserAttributes({
        someCustomVal: "abc",
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
})
```

## Present a Paywall

```tsx
// Present a paywall
Superwall.shared.register({
      placement: "yourPlacementName",
      feature() {
        console.log(`Feature called!`)
      },
})
```

## Listen to Events

```tsx
// 1. Define your Superwall Delegate
import {
  EventType,
  type PaywallInfo,
  type RedemptionResult,
  type SubscriptionStatus,
  SuperwallDelegate,
  type SuperwallEventInfo,
} from "expo-superwall/compat"

export class MyDelegate extends SuperwallDelegate {
  handleSuperwallEvent(eventInfo) {
    switch (eventInfo.event.type) {
      case EventType.paywallOpen:
        console.log("Paywall opened");
        break;
      case EventType.paywallClose:
        console.log("Paywall closed");
        break;
    }
  }
}

// 2. Simply set the delegate
const delegate = new MyDelegate()
await Superwall.shared.setDelegate(delegate)

```


---

# Migrating from v1 to v2 - React Native
Source: https://superwall.com/docs/expo/guides/migrations/migrating-to-v2

SuperwallKit 2.0 is a major release of Superwall's React Native SDK. This introduces breaking changes.

<Warning>
  **Legacy SDK Migration Guide**

  This guide is for migrating between v1 and v2 of the **legacy** `react-native-superwall` SDK. If you're using the modern `expo-superwall` SDK, you don't need this guide. See the [migration guide for moving from react-native-superwall to expo-superwall](/expo/guides/migrating-react-native) instead.
</Warning>

## Migration steps

## 1. Update code references

### 1.1 Update the `configure`, `register`, and `identify` functions

These functions now use an object with named parameters as their argument.

Before:

```typescript (Before)
Superwall.configure(apiKey, options, purchaseController, completion)

Superwall.shared.register(event, params, handler, feature)

Superwall.shared.identify(userId, options)
```

Now:

```typescript (Now)
Superwall.configure({
  apiKey,
  options,
  purchaseController,
  completion,
})

Superwall.shared.register({
  placement,
  params,
  handler,
  feature,
})

Superwall.shared.identify({
  userId,
  options
})
```

### 1.2 Rename references from `event` to `placement`

In some cases, you should be able to update references using the automatic renaming suggestions in your editor. For other cases where this hasn't been possible, you'll need to run through this list to manually update your code.

| Before                                     | After                                         |
| ------------------------------------------ | --------------------------------------------- |
| async register(event)                      | async register(placement)                     |
| async preloadPaywalls(eventNames)          | async preloadPaywalls(placementNames)         |
| async getPresentationResult(event, params) | async getPresentationResult(placement,params) |
| TriggerResult.eventNotFound                | TriggerResult.placementNotFound               |
| TriggerResult.noRuleMatch                  | TriggerResult.noAudienceMatch                 |

### 2. Getting the purchased product

The `onDismiss` block of the `PaywallPresentationHandler` now accepts both a `PaywallInfo` object and a `PaywallResult` object. This allows you to easily access
the purchased product from the result when the paywall dismisses.

### 3. Entitlements

The `subscriptionStatus` has been changed to accept a set of `Entitlement` objects. This allows you to give access to entitlements based on products purchased.
For example, in your app you might have Bronze, Silver, and Gold subscription tiers, i.e. entitlements, which entitle a user to access a certain set of features within your app.
Every subscription product must be associated with one or more entitlements, which is controlled via the dashboard. Superwall will already have associated all your
products with a default entitlement. If you don't use more than one entitlement tier within your app and you only use subscription products, you don't need to do anything extra.
However, if you use one-time purchases or multiple entitlements, you should review your products and their entitlements. In general, consumables should not be associated with an
entitlement, whereas non-consumables should be. Check your products [here](https://superwall.com/applications/\:app/products/v2).

If you're using a `PurchaseController`, you'll need to set the `entitlements.status` instead of the `subscriptionStatus`:

| Before                                                            | After                                                                           |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Superwall.shared.setSubscriptionStatus(SubscriptionStatus.ACTIVE) | Superwall.shared.setSubscriptionStatus(SubscriptionStatus.Active(entitlements)) |

Here is an example of how you'd sync your subscription status with Superwall if you were using RevenueCat for example:

<Tabs items={["RevenueCat"]} groupId="language" persist>
  <Tab value="RevenueCat">
    ```typescript RevenueCat
    syncSubscriptionStatus() {
        Purchases.addCustomerInfoUpdateListener((customerInfo) => {
          const entitlements = Object.keys(customerInfo.entitlements.active).map((id) => ({
            id,
          }))
          Superwall.shared.setSubscriptionStatus(
            entitlements.length === 0
              ? SubscriptionStatus.Inactive()
              : SubscriptionStatus.Active(entitlements)
          )
        })
    }
    ```
  </Tab>
</Tabs>

You can listen to the emitter property `Superwall.shared.subscriptionStatusEmitter` to be notified when the subscriptionStatus changes by passing in a `change` listener. Or you can use the `SuperwallDelegate`
method `subscriptionStatusDidChange(from:to:)`, which replaces `subscriptionStatusDidChange(to:)`.

### 4. Paywall Presentation Condition

In the Paywall Editor you can choose whether to always present a paywall or ask the SDK to check the user subscription before presenting a paywall.
For users on v2 of the SDK, this is replaced with a check on the entitlements within the audience filter. As you migrate your users from v1 to v2 of the
SDK, you'll need to make sure you set both the entitlements check and the paywall presentation condition in the paywall editor.

<Frame>![](/images/camp-presentation-conditions.png)</Frame>

## 5. Check out the full change log

You can view this on [our GitHub page](https://github.com/superwall/react-native-superwall/blob/master/CHANGELOG.md).

## 6. Check out our updated example apps

All of our example apps ([standard React Native](https://github.com/superwall/react-native-superwall/tree/main/example) and [Expo](https://github.com/superwall/react-native-superwall/tree/main/expo-example)) have been updated to use the latest SDK. We now only have two apps: Basic and Advanced. Basic shows you the basic integration of Superwall without needing a purchase controller or multiple entitlements. Advanced shows you how to use entitlements within your app as well as optionally using a purchase controller with RevenueCat.


---

# Setting a Locale
Source: https://superwall.com/docs/expo/guides/setting-locale

Override the default device locale when using the Expo SDK so you can preview localized paywalls and targeting.

## Overview

The Expo SDK automatically uses the device's locale to localize paywalls and evaluate campaign rules. Override the locale with the `localeIdentifier` option when you need to:

* preview translations without changing the simulator or device settings
* QA rules that gate content by market or language
* capture store screenshots or marketing assets in a specific language

`localeIdentifier` accepts standard BCPâ€‘47 identifiers such as `en_US`, `en_GB`, or `fr_CA`. You can reference Apple's [complete locale list](https://gist.github.com/jacobbubu/1836273) if you need the exact identifier for a region.

## Set the locale before Superwall config

`<SuperwallProvider />` configures the native SDK only once, so be sure the locale you want to test is decided before the provider mounts.

```tsx
import { SuperwallProvider, type PartialSuperwallOptions } from "expo-superwall";

const localeOptions: PartialSuperwallOptions = {
  localeIdentifier: "fr_FR",
};

export default function App() {
  return (
    <SuperwallProvider
      apiKeys={{
        ios: process.env.EXPO_PUBLIC_SUPERWALL_IOS_KEY!,
        android: process.env.EXPO_PUBLIC_SUPERWALL_ANDROID_KEY!,
      }}
      options={localeOptions}
    >
      <RootNavigator />
    </SuperwallProvider>
  );
}
```

## Verify the active locale

Use `useSuperwall()` and `getDeviceAttributes()` to confirm which locale the native SDK currently sees. This is helpful when debugging targeting issues.

```tsx
import { useEffect } from "react";
import { useSuperwall } from "expo-superwall";

export function LocaleDebug() {
  const superwall = useSuperwall();

  useEffect(() => {
    superwall.getDeviceAttributes().then((attrs) => {
      console.log("[Superwall] localeIdentifier:", attrs.localeIdentifier);
    });
  }, [superwall]);

  return null;
}
```

## Related resources

* [Localization overview](/localization)
* [In-App Paywall Previews](/expo/quickstart/in-app-paywall-previews)


---

# StoreKit testing (iOS only)
Source: https://superwall.com/docs/expo/guides/testing-purchases

How to set up StoreKit testing for iOS when using the Expo SDK.

StoreKit testing in Xcode is a local test environment for testing in-app purchases without requiring a connection to App Store servers. Set up in-app purchases in a local StoreKit configuration file in your Xcode project, or create a synced StoreKit configuration file in Xcode from your in-app purchase settings in App Store Connect. After you enable the configuration file, the test environment uses this local data on your paywalls when your app calls StoreKit APIs.

### Add a StoreKit Configuration File

Go to **File â–¸ New â–¸ File...** in the menu bar , select **StoreKit Configuration File** and hit **Next**:

<Frame>
  ![](/images/3dbedb3-Screenshot_2023-03-02_at_11.35.16.png)
</Frame>

Give it the name **Products**. For a configuration file synced with an app on App Store Connect, select the checkbox, specify your team and app in the drop-down menus that appear, then click **Next**. For a local configuration, leave the checkbox unselected, then click **Next**. Save the file in the top-level folder of your project. You don't need to add it to your target.

### Create a New Scheme for StoreKit Testing

It's best practice to create a new scheme in Xcode to be used for StoreKit testing. This allows you to separate out staging and production environments.

Click the scheme in the scheme menu and click **Manage Schemes...**:

<Frame>
  ![](/images/e0e2c89-Screenshot_2023-03-02_at_11.44.02.png)
</Frame>

If you haven't already got a Staging scheme, select your current scheme and click **Duplicate**:

<Frame>
  ![](/images/d3c7e96-Screenshot_2023-03-02_at_11.44.47.png)
</Frame>

In the scheme editor, add the StoreKit Configuration file to your scheme by clicking on **Run** in the side bar, selecting the **Options** tab and choosing your configuration file in **StoreKit Configuration**. Then, click **Close**:

<Frame>
  ![](/images/444719d-Screenshot_2023-03-02_at_11.46.34.png)
</Frame>

You can rename your scheme to **MyAppName (Staging)**.

### Setting up the StoreKit Configuration File

If you've chosen to sync your configuration file with the App Store, your apps will automatically be loaded into your StoreKit Configuration file. When you add new products, just sync again.

If you're using a local configuration, open **Products.storekit**, click the **+** button at the bottom and create a new product. In this tutorial, we'll create an auto-renewable subscription:

<Frame>
  ![](/images/6d89a21-Screenshot_2023-03-02_at_12.07.50.png)
</Frame>

Enter a name for a new subscription group and click **Done**. The subscription group name should match one that is set up for your app in App Store Connect, but it's not a requirement. That means you can test your subscription groups and products in the simulator and then create the products in App Store Connect later:

<Frame>
  ![](/images/717d912-Screenshot_2023-03-02_at_12.09.07.png)
</Frame>

Configure the subscription as needed by filling in the **Reference Name**, **Product ID**, **Price**, **Subscription Duration**, and optionally an **Introductory Offer**. Again, this product doesn't have to exist in App Store Connect for you to test purchasing in the simulator. Here is a sample configuration:

<Frame>
  ![](/images/d6a9b7f-Screenshot_2023-03-02_at_12.10.27.png)
</Frame>

Repeat this for all of your products. When configuring a paywall, the product ID you enter here must match the product ID on the paywall.

You're now all set!

## Testing purchases with Transaction Manager

Once you've set up your StoreKit configuration file, you can leverage Xcode's Transaction Manager. Find it under **Debug -> StoreKit -> Manage Transactions...**:

<Frame>
  ![](/images/transactionManager.png)
</Frame>

Use this to quickly test purchasing your products. Once you make a purchase, you can open Transaction Manager to delete it, refund it, request parental approval and much more. Most commonly, you'll probably delete the transaction to reset your subscription state:

<Frame>
  ![](/images/transactionRemove.png)
</Frame>

This makes everything a little faster, saving you the trouble of having to delete and reinstall your app to test these states. If you'd like to see a video over how to use it, check this one out:

<iframe width="560" height="315" src="https://www.youtube.com/embed/riL7LYeM0EQ?si=05vmZAR4ZaGLbyJ3" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" referrerpolicy="strict-origin-when-cross-origin" />


---

# Using Expo SDK in Bare React Native Apps
Source: https://superwall.com/docs/expo/guides/using-expo-sdk-in-bare-react-native

Install Superwall's Expo SDK in existing React Native projects without Expo

This guide is for React Native developers who want to integrate Superwall for the first time using our Expo SDK, even though their project doesn't use Expo.

<Note>
  **This doesn't sound like you?**

  * **Expo project** â†’ Use the standard [installation guide](/expo/quickstart/install)
  * **React Native app with existing Superwall SDK** â†’ See our [migration guide](/expo/guides/migrating-react-native)
</Note>

## What are Expo Modules?

Expo Modules allow you to use Expo SDK packages in any React Native project, even if you're not using Expo as your development framework. This means bare React Native apps can benefit from Expo's ecosystem while maintaining their existing project structure.

Superwall's Expo SDK (`expo-superwall`) is now our recommended SDK for all React Native projects. By installing Expo Modules in your bare React Native app, you can use our latest SDK with the best features and support.

## Prerequisites

Before starting, ensure you have:

* A React Native project (compatible with React Native 0.79+)
* iOS deployment target set to 15.1 or higher
* Android minimum SDK version 21 or higher
* Node.js 18 or newer

## Step 1: Install Expo Modules

First, you need to install Expo modules in your React Native project. This allows you to use any Expo SDK package, including `expo-superwall`.

<Note>
  For comprehensive installation details, refer to [Expo's official guide](https://docs.expo.dev/bare/installing-expo-modules/)
</Note>

### Automatic Installation (Recommended)

Run the following command in your project root:

```bash
npx install-expo-modules@latest
```

This command automatically configures your iOS and Android projects to support Expo modules.

### Manual Installation (If Automatic Fails)

If the automatic installation doesn't work (common in highly customized projects), follow these steps:

1. Install the expo package:

```bash
npm install expo
```

2. Configure your iOS project:
   * Set iOS deployment target to 15.1 in Xcode
   * Update your `AppDelegate` files as per [Expo's manual instructions](https://docs.expo.dev/bare/installing-expo-modules/#manual-installation)
   * Run `npx pod-install` to install iOS dependencies

3. Configure your Android project:
   * Update `android/settings.gradle` and `android/app/build.gradle`
   * Follow the Android configuration steps in [Expo's guide](https://docs.expo.dev/bare/installing-expo-modules/#manual-installation)

## Step 2: Install Superwall Expo SDK

Once Expo modules are configured, install the Superwall SDK:

<Tabs items={["npm","yarn","pnpm","bun"]} groupId="language" persist>
  <Tab value="npm">
    ```bash npm
    npm install expo-superwall
    ```
  </Tab>

  <Tab value="yarn">
    ```bash yarn
    yarn add expo-superwall
    ```
  </Tab>

  <Tab value="pnpm">
    ```bash pnpm
    pnpm add expo-superwall
    ```
  </Tab>

  <Tab value="bun">
    ```bash bun
    bun add expo-superwall
    ```
  </Tab>
</Tabs>

## Step 3: Platform-Specific Configuration

### iOS Configuration

After installing the SDK, run:

```bash
cd ios && pod install
```

### Android Configuration

Ensure your `android/app/build.gradle` has:

```groovy gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        minSdkVersion 21
        targetSdkVersion 34
    }
}
```

## Troubleshooting

If you encounter any issues during installation, refer to [Expo's installation guide](https://docs.expo.dev/bare/installing-expo-modules/) for detailed troubleshooting steps and platform-specific configuration details.

## What's Next?

Continue with the [Superwall configuration guide](/expo/quickstart/configure) to complete your setup.


---

# Using RevenueCat
Source: https://superwall.com/docs/expo/guides/using-revenuecat

If you want to use RevenueCat to handle your subscription-related logic with Superwall, follow this guide.

<Note>
  Not using RevenueCat? No problem! Superwall works out of the box without any additional SDKs.
</Note>

<Warning>You only need to use a `PurchaseController` if you want end-to-end control of the purchasing pipeline. The recommended way to use RevenueCat with Superwall is by putting it in observer mode.</Warning>

You can integrate RevenueCat with Superwall in one of two ways:

* [`CustomPurchaseControllerProvider` component (recommended)](#custompurchasecontrollerprovider-component)
* [`PurchaseController` (legacy)](#purchasecontroller-legacy)

## `CustomPurchaseControllerProvider` component

The easiest way to integrate RevenueCat with Superwall is using the `CustomPurchaseControllerProvider` component. This approach uses modern React patterns and requires much less code.

### 1. Configure RevenueCat and Superwall

```tsx
import { useEffect } from "react"
import { Platform } from "react-native"
import Purchases, { PURCHASES_ERROR_CODE } from "react-native-purchases"
import {
  CustomPurchaseControllerProvider,
  SuperwallProvider,
  SuperwallLoaded,
  SuperwallLoading,
} from "expo-superwall"

const REVENUECAT_API_KEYS = {
  ios: "appl_YOUR_IOS_KEY_HERE",
  android: "goog_YOUR_ANDROID_KEY_HERE",
}

const SUPERWALL_API_KEYS = {
  ios: "YOUR_SUPERWALL_IOS_KEY",
  android: "YOUR_SUPERWALL_ANDROID_KEY",
}

function App() {
  useEffect(() => {
    const apiKey = Platform.OS === "ios"
      ? REVENUECAT_API_KEYS.ios
      : REVENUECAT_API_KEYS.android
    Purchases.configure({ apiKey })
  }, [])

  return (
    <CustomPurchaseControllerProvider
      controller={{
        onPurchase: async (params) => {
          try {
            const products = await Purchases.getProducts([params.productId])
            const product = products[0]

            if (!product) {
              return { type: "failed", error: "Product not found" }
            }

            await Purchases.purchaseStoreProduct(product)
          } catch (error: any) {
            if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
              return { type: "cancelled" }
            }
            return { type: "failed", error: error.message }
          }
        },

        onPurchaseRestore: async () => {
          try {
            await Purchases.restorePurchases()
          } catch (error: any) {
            return { type: "failed", error: error.message }
          }
        },
      }}
    >
      <SuperwallProvider apiKeys={SUPERWALL_API_KEYS}>
        <SuperwallLoading>
          {/* Loading UI */}
        </SuperwallLoading>
        <SuperwallLoaded>
          {/* Your app */}
        </SuperwallLoaded>
      </SuperwallProvider>
    </CustomPurchaseControllerProvider>
  )
```

### 2. Sync Subscription Status

Listen for RevenueCat subscription changes and update Superwall:

```tsx
import { useSuperwallEvents, useUser } from 'expo-superwall'

function SubscriptionSync() {
  const { setSubscriptionStatus } = useUser()

  useEffect(() => {
    // Listen for RevenueCat customer info updates
    const listener = Purchases.addCustomerInfoUpdateListener((customerInfo) => {
      const entitlementIds = Object.keys(customerInfo.entitlements.active)
      
      setSubscriptionStatus({
        status: entitlementIds.length === 0 ? "INACTIVE" : "ACTIVE",
        entitlements: entitlementIds.map(id => ({ 
          id, 
          type: "SERVICE_LEVEL" 
        }))
      })
    })

    // Get initial customer info
    const syncInitialStatus = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo()
        const entitlementIds = Object.keys(customerInfo.entitlements.active)
        
        setSubscriptionStatus({
          status: entitlementIds.length === 0 ? "INACTIVE" : "ACTIVE",
          entitlements: entitlementIds.map(id => ({ 
            id, 
            type: "SERVICE_LEVEL" 
          }))
        })
      } catch (error) {
        console.error("Failed to sync initial subscription status:", error)
      }
    }

    syncInitialStatus()

    return () => {
      listener?.remove()
    }
  }, [setSubscriptionStatus])

  return null // This component just handles the sync
}
```

That's it! This approach is much simpler than the class-based implementation and uses modern React patterns.

Check out our sample app for a working example: [Expo Example](https://github.com/superwall/expo-superwall/tree/main/example)

***

## `PurchaseController` (legacy)

<Note type="warning">
  This approach is for apps using the legacy `expo-superwall/compat` import. For new projects, use the hooks-based integration above.
</Note>

You can integrate RevenueCat with Superwall using purchase controllers:

1. **Using a purchase controller:** Use this route if you want to maintain control over purchasing logic and code.
2. **Using PurchasesAreCompletedBy:** Here, you don't use a purchase controller and you tell RevenueCat that purchases are completed by your app using StoreKit. In this mode, RevenueCat will observe the purchases that the Superwall SDK makes. For more info [see here](https://www.revenuecat.com/docs/migrating-to-revenuecat/sdk-or-not/finishing-transactions).

### 1. Create a PurchaseController

Create a new file called `RCPurchaseController`, then copy and paste the following:

```typescript
import { Platform } from "react-native"
import Superwall, {
  PurchaseController,
  PurchaseResult,
  RestorationResult,
  SubscriptionStatus,
  PurchaseResultCancelled,
  PurchaseResultFailed,
  PurchaseResultPending,
  PurchaseResultPurchased,
} from 'expo-superwall/compat';
import Purchases, {
  type CustomerInfo,
  PRODUCT_CATEGORY,
  type PurchasesStoreProduct,
  type SubscriptionOption,
  PURCHASES_ERROR_CODE,
  type MakePurchaseResult,
} from "react-native-purchases"

export class RCPurchaseController extends PurchaseController {
  constructor() {
    super()

    Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    const apiKey = Platform.OS === 'ios' ? 'ios_rc_key' : 'android_rc_key';
    Purchases.configure({ apiKey });
  }

  syncSubscriptionStatus() {
    // Listen for changes
    Purchases.addCustomerInfoUpdateListener((customerInfo) => {
      const entitlementIds = Object.keys(customerInfo.entitlements.active)
      Superwall.shared.setSubscriptionStatus(
        entitlementIds.length === 0
          ? SubscriptionStatus.Inactive()
          : SubscriptionStatus.Active(entitlementIds)
      )
    })
  }

  async purchaseFromAppStore(productId: string): Promise<PurchaseResult> {
    const products = await Promise.all([
      Purchases.getProducts([productId], PRODUCT_CATEGORY.SUBSCRIPTION),
      Purchases.getProducts([productId], PRODUCT_CATEGORY.NON_SUBSCRIPTION),
    ]).then((results) => results.flat())

    // Assuming an equivalent for Dart's firstOrNull is not directly available in TypeScript,
    // so using a simple conditional check
    const storeProduct = products.length > 0 ? products[0] : null

    if (!storeProduct) {
      return new PurchaseResultFailed("Failed to find store product for $productId")
    }

    return await this._purchaseStoreProduct(storeProduct)
  }

  async purchaseFromGooglePlay(
    productId: string,
    basePlanId?: string,
    offerId?: string
  ): Promise<PurchaseResult> {
    // Find products matching productId from RevenueCat
    const products = await Promise.all([
      Purchases.getProducts([productId], PRODUCT_CATEGORY.SUBSCRIPTION),
      Purchases.getProducts([productId], PRODUCT_CATEGORY.NON_SUBSCRIPTION),
    ]).then((results) => results.flat())

    // Choose the product which matches the given base plan.
    // If no base plan set, select first product or fail.
    const storeProductId = `${productId}:${basePlanId}`

    // Initialize matchingProduct as null explicitly
    let matchingProduct: PurchasesStoreProduct | null = null

    // Loop through each product in the products array
    for (const product of products) {
      // Check if the current product's identifier matches the given storeProductId
      if (product.identifier === storeProductId) {
        // If a match is found, assign this product to matchingProduct
        matchingProduct = product
        // Break the loop as we found our matching product
        break
      }
    }

    let storeProduct: PurchasesStoreProduct | null =
      matchingProduct ??
      (products.length > 0 && typeof products[0] !== "undefined" ? products[0] : null)

    // If no product is found (either matching or the first one), return a failed purchase result.
    if (storeProduct === null) {
      return new PurchaseResultFailed("Product not found")
    }

    switch (storeProduct.productCategory) {
      case PRODUCT_CATEGORY.SUBSCRIPTION:
        const subscriptionOption = await this._fetchGooglePlaySubscriptionOption(
          storeProduct,
          basePlanId,
          offerId
        )
        if (subscriptionOption === null) {
          return new PurchaseResultFailed("Valid subscription option not found for product.")
        }
        return await this._purchaseSubscriptionOption(subscriptionOption)
      case PRODUCT_CATEGORY.NON_SUBSCRIPTION:
        return await this._purchaseStoreProduct(storeProduct)
      default:
        return new PurchaseResultFailed("Unable to determine product category")
    }
  }

  private async _purchaseStoreProduct(
    storeProduct: PurchasesStoreProduct
  ): Promise<PurchaseResult> {
    const performPurchase = async (): Promise<MakePurchaseResult> => {
      // Attempt to purchase product
      const makePurchaseResult = await Purchases.purchaseStoreProduct(storeProduct)
      return makePurchaseResult
    }
    return await this.handleSharedPurchase(performPurchase)
  }

  private async _fetchGooglePlaySubscriptionOption(
    storeProduct: PurchasesStoreProduct,
    basePlanId?: string,
    offerId?: string
  ): Promise<SubscriptionOption | null> {
    const subscriptionOptions = storeProduct.subscriptionOptions

    if (subscriptionOptions && subscriptionOptions.length > 0) {
      // Concatenate base + offer ID
      const subscriptionOptionId = this.buildSubscriptionOptionId(basePlanId, offerId)

      // Find first subscription option that matches the subscription option ID or use the default offer
      let subscriptionOption: SubscriptionOption | null = null

      // Search for the subscription option with the matching ID
      for (const option of subscriptionOptions) {
        if (option.id === subscriptionOptionId) {
          subscriptionOption = option
          break
        }
      }

      // If no matching subscription option is found, use the default option
      subscriptionOption = subscriptionOption ?? storeProduct.defaultOption

      // Return the subscription option
      return subscriptionOption
    }

    return null
  }

  private buildSubscriptionOptionId(basePlanId?: string, offerId?: string): string {
    let result = ""

    if (basePlanId !== null) {
      result += basePlanId
    }

    if (offerId !== null) {
      if (basePlanId !== null) {
        result += ":"
      }
      result += offerId
    }

    return result
  }

  private async _purchaseSubscriptionOption(
    subscriptionOption: SubscriptionOption
  ): Promise<PurchaseResult> {
    // Define the async perform purchase function
    const performPurchase = async (): Promise<MakePurchaseResult> => {
      // Attempt to purchase product
      const purchaseResult = await Purchases.purchaseSubscriptionOption(subscriptionOption)
      return purchaseResult
    }

    const purchaseResult: PurchaseResult = await this.handleSharedPurchase(performPurchase)
    return purchaseResult
  }

  private async handleSharedPurchase(
    performPurchase: () => Promise<MakePurchaseResult>
  ): Promise<PurchaseResult> {
    try {
      // Perform the purchase using the function provided
      const makePurchaseResult = await performPurchase()

      // Handle the results
      if (this.hasActiveEntitlementOrSubscription(makePurchaseResult.customerInfo)) {
        return new PurchaseResultPurchased()
      } else {
        return new PurchaseResultFailed("No active subscriptions found.")
      }
    } catch (e: any) {
      // Catch block to handle exceptions, adjusted for TypeScript
      if (e.userCancelled) {
        return new PurchaseResultCancelled()
      }
      if (e.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
        return new PurchaseResultPending()
      } else {
        return new PurchaseResultFailed(e.message)
      }
    }
  }

  async restorePurchases(): Promise<RestorationResult> {
    try {
      await Purchases.restorePurchases()
      return RestorationResult.restored()
    } catch (e: any) {
      return RestorationResult.failed(e.message)
    }
  }

  private hasActiveEntitlementOrSubscription(customerInfo: CustomerInfo): Boolean {
    return (
      customerInfo.activeSubscriptions.length > 0 &&
      Object.keys(customerInfo.entitlements.active).length > 0
    )
  }
}
```

As discussed in [Purchases and Subscription Status](/docs/expo/guides/advanced-configuration), this `PurchaseController` is responsible for handling the subscription-related logic. Take a few moments to look through the code to understand how it does this.

### 2. Configure Superwall

Initialize an instance of `RCPurchaseController` and pass it in to `Superwall.configure(apiKey:purchaseController)`:

```typescript
React.useEffect(() => {
  const apiKey = Platform.OS === "ios" ? "MY_SUPERWALL_IOS_API_KEY" : "MY_SUPERWALL_ANDROID_API_KEY"

  const purchaseController = new RCPurchaseController()

  Superwall.configure(apiKey, null, purchaseController)
  purchaseController.syncSubscriptionStatus()
}, [])
```

### 3. Sync the subscription status

Then, call `purchaseController.syncSubscriptionStatus()` to keep Superwall's subscription status up to date with RevenueCat.

That's it! Check out our sample app for working examples:

* [Expo](https://github.com/superwall/expo-superwall/tree/main/example)
* [React Native (deprecated)](https://github.com/superwall/react-native-superwall/blob/main/example/src/RCPurchaseController.tsx)

### Using PurchasesAreCompletedBy

If you're using RevenueCat's [PurchasesAreCompletedBy](https://www.revenuecat.com/docs/migrating-to-revenuecat/sdk-or-not/finishing-transactions), you don't need to create a purchase controller. Register your placements, present a paywall â€” and Superwall will take care of completing any purchase the user starts. However, there are a few things to note if you use this setup:

1. Here, you aren't using RevenueCat's [entitlements](https://www.revenuecat.com/docs/getting-started/entitlements#entitlements) as a source of truth. If your app is multiplatform, you'll need to consider how to link up pro features or purchased products for users.
2. If you require custom logic when purchases occur, then you'll want to add a purchase controller. In that case, Superwall handles purchasing flows and RevenueCat will still observe transactions to power their analytics and charts.
3. Be sure that user identifiers are set the same way across Superwall and RevenueCat.

For more information on observer mode, visit [RevenueCat's docs](https://www.revenuecat.com/docs/migrating-to-revenuecat/sdk-or-not/finishing-transactions).


---

# Using the Superwall Delegate
Source: https://superwall.com/docs/expo/guides/using-superwall-delegate

undefined

Use Superwall's delegate to extend our SDK's functionality across several surface areas by assigning to the `delegate` property:

:::expo
```tsx
import { useSuperwallEvents } from "expo-superwall";

// Use the useSuperwallEvents hook to subscribe to Superwall events
function MyApp() {
  useSuperwallEvents({
    onSuperwallEvent: (eventInfo) => {
      console.log('Superwall Event:', eventInfo.event.event, eventInfo.params);
    },
    onSubscriptionStatusChange: (status) => {
      console.log('Subscription Status Changed:', status.status);
    },
    onPaywallPresent: (info) => {
      console.log('Paywall Presented:', info.name);
    },
    onPaywallDismiss: (info, result) => {
      console.log('Paywall Dismissed:', info.name, 'Result:', result);
    },
    onCustomPaywallAction: (name) => {
      console.log('Custom Action:', name);
      // Handle custom actions here
    },
  });

  return (
    // Your app content
  );
}
```

<Note>
  The new hooks-based SDK uses `useSuperwallEvents()` instead of the delegate pattern. For delegate functionality with the compat SDK, use `expo-superwall/compat`.
</Note>
:::

Some common use cases for using the Superwall delegate include:

* **Custom actions:** [Respond to custom tap actions from a paywall.](/custom-paywall-events#custom-paywall-actions)
* **Respond to purchases:** [See which product was purchased from the presented paywall.](/viewing-purchased-products)
* **Analytics:** [Forward events from Superwall to your own analytics.](/3rd-party-analytics)

Below are some commonly used implementations when using the delegate.

### Superwall Events

Most of what occurs in Superwall can be viewed using the delegate method to respond to events:

:::expo
```typescript
export class MySuperwallDelegate extends SuperwallDelegate {
  handleSuperwallPlacement(placementInfo: SuperwallPlacementInfo) {
    console.log("Handling Superwall placement:", placementInfo)

    switch (placementInfo.placement.type) {
      case PlacementType.transactionComplete:
        const product = placementInfo.params?.["product"]
        if (product) {
          console.log(`Product: ${product}`)
        } else {
          console.log("Product not found in params.")
        }
        break
      default:
        // Handle any other placement types as needed...
        break
    }
  }
}
```
:::

### Paywall Custom Actions

Using the [custom tap action](/custom-paywall-events), you can respond to any arbitrary event from a paywall:

:::expo
```tsx
import { useSuperwallEvents } from "expo-superwall";

function MyApp() {
  useSuperwallEvents({
    onCustomPaywallAction: (name) => {
      console.log("Handling custom paywall action:", name);
      // Handle your custom actions here
    },
  });

  return (
    // Your app content
  );
}
```
:::

### Subscription status changes

You can be informed of subscription status changes using the delegate. If you need to set or handle the status on your own, use a [purchase controller](/advanced-configuration) â€” this function is only for informational, tracking or similar purposes:

:::expo
```tsx
import { useSuperwallEvents } from "expo-superwall";

function MyApp() {
  useSuperwallEvents({
    onSubscriptionStatusChange: (status) => {
      console.log("Subscription status changed to:", status.status);
      if (status.status === "ACTIVE") {
        console.log("Active entitlements:", status.entitlements);
      }
    },
  });

  return (
    // Your app content
  );
}
```
:::

### Paywall events

The delegate also has callbacks for several paywall events, such dismissing, presenting, and more. Here's an example:

:::expo
```typescript
export class MySuperwallDelegate extends SuperwallDelegate {
  didPresentPaywall(paywallInfo: PaywallInfo): void {
    console.log("Paywall did present:", paywallInfo)
  }
}
```
:::


---

# Vibe Coding
Source: https://superwall.com/docs/expo/guides/vibe-coding

How to Vibe Code using the knowledge of the Superwall Docs

## Overview

We've built a few tools to help you Vibe Code using the knowledge of the Superwall Docs, right in your favorite AI tools:

* [Superwall Docs MCP](#superwall-docs-mcp) in Claude Code, Cursor, etc.
* [Superwall Docs GPT](#superwall-docs-gpt) in ChatGPT

And right here in the Superwall Docs:

* [Ask AI](#ask-ai)
* [Docs Links](#docs-links)
* [LLMs.txt](#llmstxt)

## Superwall Docs MCP

The Superwall Docs MCP ([Model Context Protocol](https://modelcontextprotocol.io/docs/tutorials/use-remote-mcp-server)) is a tool that allows your favorite AI tools to search the Superwall Docs and get context from the docs.

### Cursor

You can install the MCP server in Cursor by clicking this button:
[![Install MCP Server](/images/cursor-mcp-install-light.svg)](https://cursor.com/en/install-mcp?name=superwall-docs-mcp\&config=eyJ1cmwiOiJodHRwczovL21jcC5zdXBlcndhbGwuY29tL21jcCJ9)

or by adding the following to your `~/.cursor/mcp.json` file:

```json
{
  "mcpServers": {
    "superwall-docs": {
      "url": "https://mcp.superwall.com/mcp"
    }
  }
}
```

### Claude Code

You can install the MCP server in Claude Code by running the following command:

```bash
claude mcp add --transport sse superwall-docs https://mcp.superwall.com/sse
```

## Superwall Docs GPT

You can use the [Superwall Docs GPT](https://chatgpt.com/g/g-6888175f1684819180302d66f4e61971-superwall-docs-gpt) right in the ChatGPT app, and use it to ask any Superwall question.

It has the full knowledge of the Superwall Docs, and can be used with all the ChatGPT features you love like using the context of your files straight from your IDE.

## Ask AI

The built-in [Ask AI tool](https://superwall.com/docs/ai) in the Superwall Docs is a great place to start if you have a question or issue.

## Docs Links

On each page of the Superwall Docs (including this one!), you can find in the top right corner:

* **Copy page**: to copy the page in Markdown format.

Also in the dropdown menu, you can access these options:

* **View as markdown**: to view the page in Markdown format
* **Open in ChatGPT**, **Open in Claude**: to open the page in the respective AI tool and add the page as context for your conversation

## LLMs.txt

The Superwall Docs website has `llms.txt` and `llms-full.txt` files, in total and for each SDK, that you can use to add context to your LLMs.

`llms.txt` is a summary of the docs with links to each page.

`llms-full.txt` is the full text of all of the docs.

| SDK                       | Summary                                                                     | Full Text                                                                             |
| ------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| All                       | [`llms.txt`](https://superwall.com/docs/llms.txt)                           | [`llms-full.txt`](https://superwall.com/docs/llms-full.txt)                           |
| Dashboard                 | [`llms-dashboard.txt`](https://superwall.com/docs/llms-dashboard.txt)       | [`llms-full-dashboard.txt`](https://superwall.com/docs/llms-full-dashboard.txt)       |
| iOS                       | [`llms-ios.txt`](https://superwall.com/docs/llms-ios.txt)                   | [`llms-full-ios.txt`](https://superwall.com/docs/llms-full-ios.txt)                   |
| Android                   | [`llms-android.txt`](https://superwall.com/docs/llms-android.txt)           | [`llms-full-android.txt`](https://superwall.com/docs/llms-full-android.txt)           |
| Flutter                   | [`llms-flutter.txt`](https://superwall.com/docs/llms-flutter.txt)           | [`llms-full-flutter.txt`](https://superwall.com/docs/llms-full-flutter.txt)           |
| Expo                      | [`llms-expo.txt`](https://superwall.com/docs/llms-expo.txt)                 | [`llms-full-expo.txt`](https://superwall.com/docs/llms-full-expo.txt)                 |
| React Native (Deprecated) | [`llms-react-native.txt`](https://superwall.com/docs/llms-react-native.txt) | [`llms-full-react-native.txt`](https://superwall.com/docs/llms-full-react-native.txt) |
| Integrations              | [`llms-integrations.txt`](https://superwall.com/docs/llms-integrations.txt) | [`llms-full-integrations.txt`](https://superwall.com/docs/llms-full-integrations.txt) |
| Web Checkout              | [`llms-web-checkout.txt`](https://superwall.com/docs/llms-web-checkout.txt) | [`llms-full-web-checkout.txt`](https://superwall.com/docs/llms-full-web-checkout.txt) |

To minimize token use, we recommend using the files specific to your SDK.


---

# Web Checkout
Source: https://superwall.com/docs/expo/guides/web-checkout

Integrate Superwall web checkout with your iOS app for seamless cross-platform subscriptions

## Dashboard Setup

1. [Set up Web Checkout in the dashboard](/web-checkout/web-checkout-overview)
2. [Add web products to your paywall](/web-checkout/web-checkout-direct-stripe-checkout)

## SDK Setup

1. [Set up deep links](/sdk/quickstart/in-app-paywall-previews)
2. [Handle Post-Checkout redirecting](/sdk/guides/web-checkout/post-checkout-redirecting)
3. **Only if you're using RevenueCat:** [Using RevenueCat](/sdk/guides/web-checkout/using-revenuecat)
4. **Only if you're using your own PurchaseController:** [Redeeming In-App](/sdk/guides/web-checkout/linking-membership-to-iOS-app)

## Testing

1. [Testing Purchases](/web-checkout/web-checkout-testing-purchases)
2. [Managing Memberships](/web-checkout/web-checkout-managing-memberships)

## Troubleshooting

If a user has issues accessing their subscription in your app after paying via web checkout, direct them to your plan management page to retrieve their subscription link or manage billing:

For example: `http://yourapp.superwall.app/manage`

## FAQ

[Web Checkout FAQ](/web-checkout/web-checkout-faq)


---

# Redeeming In-App
Source: https://superwall.com/docs/expo/guides/web-checkout/linking-membership-to-iOS-app

Handle a deep link in your app and use the delegate methods.

After purchasing from a web paywall, the user will be redirected to your app by a deep link to redeem their purchase on device.
Please follow our [Post-Checkout Redirecting](/web-checkout-post-checkout-redirecting) guide to handle this user experience.

<Note>
  If you're using Superwall to handle purchases, then you don't need to do anything here.
</Note>

If you're using your own `PurchaseController`, you will need to update the subscription status with the redeemed web entitlements. If you're using RevenueCat, you should follow our [Using RevenueCat](/web-checkout-using-revenuecat) guide.

### Using a PurchaseController

If you're using a custom PurchaseController (with either iOS StoreKit or Android Play Billing), you'll need to merge the web entitlements with the device entitlements before setting the subscription status.
Here's an example of how you might do this:

```typescript
import Superwall, { SubscriptionStatus, Entitlement } from 'expo-superwall/compat';

async function syncSubscriptionStatus(): Promise<void> {
  // Get the device entitlements from your purchase controller
  // This will vary based on whether you're using RevenueCat, StoreKit, or Play Billing
  const deviceEntitlements = await getDeviceEntitlements();

  // Get the web entitlements from Superwall
  const webEntitlements = await Superwall.shared.getWebEntitlements();

  // Merge the two sets of entitlements
  const allEntitlementIds = new Set([
    ...deviceEntitlements,
    ...webEntitlements.map(e => e.id)
  ]);

  // Update subscription status
  if (allEntitlementIds.size > 0) {
    const entitlements = Array.from(allEntitlementIds).map(id => 
      new Entitlement(id)
    );
    Superwall.shared.setSubscriptionStatus(
      SubscriptionStatus.Active(entitlements)
    );
  } else {
    Superwall.shared.setSubscriptionStatus(SubscriptionStatus.Inactive());
  }
}

// Helper function to get device entitlements
// This is a simplified example - your implementation will depend on your purchase system
async function getDeviceEntitlements(): Promise<string[]> {
  // For RevenueCat:
  // const customerInfo = await Purchases.getCustomerInfo();
  // return Object.keys(customerInfo.entitlements.active);

  // For custom StoreKit/Play Billing:
  // Query your store's API for current purchases
  // Extract entitlement IDs from those purchases
  // Return array of entitlement IDs
  
  return []; // Replace with your actual implementation
}
```

In addition to syncing the subscription status when purchasing and restoring, you'll need to sync it whenever `didRedeemLink(result)` is called:

```typescript
import { SuperwallDelegate, RedemptionResult } from 'expo-superwall/compat';

export class SWDelegate extends SuperwallDelegate {
  async didRedeemLink(result: RedemptionResult): Promise<void> {
    await syncSubscriptionStatus();
  }
}
```

### Refreshing of web entitlements

If you aren't using a Purchase Controller, the SDK will refresh the web entitlements every 24 hours.

### Redeeming while a paywall is open

If a redeem event occurs when a paywall is open, the SDK will track that as a restore event and the paywall will close.


---

# Post-Checkout Redirecting
Source: https://superwall.com/docs/expo/guides/web-checkout/post-checkout-redirecting

Learn how to handle users redirecting back to your app after a web purchase.

After a user completes a web purchase, Superwall needs to redirect them back to your app. You can configure this behavior in two ways:

## Post-Purchase Behavior Modes

You can configure how users are redirected after checkout in your [Application Settings](/web-checkout-configuring-stripe-keys-and-settings#post-purchase-behavior):

### Redeem Mode (Default)

Superwall manages the entire redemption experience:

* Users are automatically deep linked to your app with a redemption code
* Fallback to App Store/Play Store if the app isn't installed
* Redemption emails are sent automatically
* The SDK handles redemption via delegate methods (detailed below)

This is the recommended mode for most apps.

### Redirect Mode

Redirect users to your own custom URL with purchase information:

* **When to use**: You want to show a custom success page, perform additional actions before redemption, or have your own deep linking infrastructure
* **What you receive**: Purchase data is passed as query parameters to your URL

**Query Parameters Included**:

* `app_user_id` - The user's identifier from your app
* `email` - User's email address
* `stripe_subscription_id` - The Stripe subscription ID
* Any custom placement parameters you set

**Example**:

```
https://yourapp.com/success?
  app_user_id=user_123&
  email=user@example.com&
  stripe_subscription_id=sub_1234567890&
  campaign_id=summer_sale
```

You'll need to implement your own logic to handle the redirect and deep link users into your app.

***

## Setting Up Deep Links

Whether you're showing a checkout page in a browser or using the In-App Browser, the Superwall SDK relies on deep links to redirect back to your app.

#### Prerequisites

1. [Configuring Stripe Keys and Settings](/web-checkout-configuring-stripe-keys-and-settings)
2. [Deep Links](/in-app-paywall-previews)

<Warning>
  If you're not using Superwall to handle purchases, then you'll need to follow extra steps to redeem the web purchase in your app.
</Warning>

* [Using RevenueCat](/web-checkout-using-revenuecat)
* [Using a PurchaseController](/web-checkout-linking-membership-to-iOS-app#using-a-purchasecontroller)

***

## Handling Redemption (Redeem Mode)

When using Redeem mode (the default), handle the user experience when they're redirected back to your app using `SuperwallDelegate` methods:

### willRedeemLink

When your app opens via the deep link, we will call the delegate method `willRedeemLink()` before making a network call to redeem the code.
At this point, you might wish to display a loading indicator in your app so the user knows that the purchase is being redeemed.

```typescript
import { SuperwallDelegate } from 'expo-superwall/compat';
import { Toast } from 'react-native-toast-message'; // or your preferred toast library

export class SWDelegate extends SuperwallDelegate {
  willRedeemLink(): void {
    // Show a loading indicator to the user
    Toast.show({
      type: 'info',
      text1: 'Activating your purchase...',
    });
  }
}
```

You can manually dismiss the paywall at this point if needed, but note that the paywall will be dismissed automatically when the `didRedeemLink` method is called.

### didRedeemLink

After receiving a response from the network, we will call `didRedeemLink(result)` with the result of redeeming the code. This result can be one of the following:

* `RedemptionResult` with `type: 'success'`: The redemption succeeded and contains information about the redeemed code.
* `RedemptionResult` with `type: 'error'`: An error occurred while redeeming. You can check the error message via the error parameter.
* `RedemptionResult` with `type: 'expiredCode'`: The code expired and contains information about whether a redemption email has been resent and an optional obfuscated email address.
* `RedemptionResult` with `type: 'invalidCode'`: The code that was redeemed was invalid.
* `RedemptionResult` with `type: 'expiredSubscription'`: The subscription that the code redeemed has expired.

On network failure, the SDK will retry up to 6 times before returning an `error` `RedemptionResult` in `didRedeemLink(result)`.

Here, you should remove any loading UI you added in `willRedeemLink` and show a message to the user based on the result. If a paywall is presented, it will be dismissed automatically.

```typescript
import { SuperwallDelegate, RedemptionResult } from 'expo-superwall/compat';
import Superwall from 'expo-superwall/compat';
import { Toast } from 'react-native-toast-message'; // or your preferred toast library

export class SWDelegate extends SuperwallDelegate {
  didRedeemLink(result: RedemptionResult): void {
    switch (result.type) {
      case 'expiredCode':
        Toast.show({
          type: 'error',
          text1: 'Expired Link',
        });
        console.log('[!] code expired', result.code, result.expiredInfo);
        break;
      
      case 'error':
        Toast.show({
          type: 'error',
          text1: result.error.message,
        });
        console.log('[!] error', result.code, result.error);
        break;
      
      case 'expiredSubscription':
        Toast.show({
          type: 'error',
          text1: 'Expired Subscription',
        });
        console.log('[!] expired subscription', result.code, result.redemptionInfo);
        break;
      
      case 'invalidCode':
        Toast.show({
          type: 'error',
          text1: 'Invalid Link',
        });
        console.log('[!] invalid code', result.code);
        break;
      
      case 'success':
        const email = result.redemptionInfo?.purchaserInfo?.email;
        if (email) {
          Superwall.shared.setUserAttributes({ email });
          Toast.show({
            type: 'success',
            text1: `Welcome, ${email}!`,
          });
        } else {
          Toast.show({
            type: 'success',
            text1: 'Welcome!',
          });
        }
        break;
    }
  }
}
```


---

# Using RevenueCat
Source: https://superwall.com/docs/expo/guides/web-checkout/using-revenuecat

Handle a deep link in your app and use the delegate methods to link web checkouts with RevenueCat.

After purchasing from a web paywall, the user will be redirected to your app by a deep link to redeem their purchase on device. Please follow our [Post-Checkout Redirecting](/web-checkout-post-checkout-redirecting) guide to handle this user experience.

<Note>
  If you're using Superwall to handle purchases, then you don't need to do anything here.
</Note>

<Warning>You only need to use a `PurchaseController` if you want end-to-end control of the purchasing pipeline. The recommended way to use RevenueCat with Superwall is by putting it in observer mode.</Warning>

If you're using your own `PurchaseController`, you should follow our [Redeeming In-App](/web-checkout-linking-membership-to-iOS-app) guide.

### Using a PurchaseController with RevenueCat

If you're using RevenueCat, you'll need to follow [steps 1 to 4 in their guide](https://www.revenuecat.com/docs/web/integrations/stripe) to set up Stripe with RevenueCat. Then, you'll need to
associate the RevenueCat customer with the Stripe subscription IDs returned from redeeming the code. You can do this by extracting the ids from the `RedemptionResult` and sending them to RevenueCat's API
by using the `didRedeemLink(result)` delegate method:

```typescript
import { SuperwallDelegate, RedemptionResult } from 'expo-superwall/compat';
import Purchases from 'react-native-purchases';

export class SWDelegate extends SuperwallDelegate {
  // The user tapped on a deep link to redeem a code
  willRedeemLink(): void {
    console.log('[!] willRedeemLink');
    // Optionally show a loading indicator here
  }

  // Superwall received a redemption result and validated the purchase with Stripe.
  async didRedeemLink(result: RedemptionResult): Promise<void> {
    console.log('[!] didRedeemLink', result);
    // Send Stripe IDs to RevenueCat to link purchases to the customer

    // Get a list of subscription ids tied to the customer.
    const stripeSubscriptionIds = 
      result.type === 'success' ? result.stripeSubscriptionIds : null;
    
    if (!stripeSubscriptionIds) {
      return;
    }

    const revenueCatStripePublicAPIKey = 'strp.....'; // replace with your RevenueCat Stripe Public API Key
    const appUserId = Purchases.getAppUserID();

    // In the background, process all subscription IDs
    await Promise.all(
        stripeSubscriptionIds.map(async (stripeSubscriptionId) => {
          try {
            const response = await fetch('https://api.revenuecat.com/v1/receipts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Platform': 'stripe',
                'Authorization': `Bearer ${revenueCatStripePublicAPIKey}`,
              },
              body: JSON.stringify({
                app_user_id: appUserId,
                fetch_token: stripeSubscriptionId,
              }),
            });

            const responseText = await response.text();

            if (!response.ok) {
              throw new Error(
                `RevenueCat responded with ${response.status}: ${responseText || 'No body'}`
              );
            }

            const data = responseText ? JSON.parse(responseText) : {};
            console.log(`[!] Success: linked ${stripeSubscriptionId} to user ${appUserId}`, data);
          } catch (error) {
            console.error(`[!] Error: unable to link ${stripeSubscriptionId} to user ${appUserId}`, error);
          }
        })
    );

    /// After all network calls complete, invalidate the cache
    try {
      const customerInfo = await Purchases.getCustomerInfo({ fetchPolicy: 'FETCH_CURRENT' });
      
      /// If you're using RevenueCat's `addCustomerInfoUpdateListener`, or keeping Superwall Entitlements in sync
      /// via RevenueCat's listener methods, you don't need to do anything here. Those methods will be
      /// called automatically when this call fetches the most up to date customer info, ignoring any local caches.

      /// Otherwise, if you're manually calling `Purchases.getCustomerInfo` to keep Superwall's entitlements
      /// in sync, you should use the newly updated customer info here to do so.
      
      /// You could always access web entitlements here as well
      /// const webEntitlements = Superwall.shared.entitlements.web
      
      // Perform UI updates to let the user know their subscription was redeemed
      // This runs automatically on the main thread in React Native
    } catch (error) {
      console.error('Error getting customer info', error);
    }
  }
}
```

<Note>
  The example explicitly checks HTTP status codes and throws on failures so you can plug in retries,
  alerting, or user messaging. Tailor the error handling to your networking stack.
</Note>

<Warning>
  If you call `logIn` from RevenueCat's SDK, then you need to call the logic you've implemented
  inside `didRedeemLink(result)` again. For example, that means if `logIn` was invoked from
  RevenueCat, you'd either abstract out this logic above into a function to call again, or simply
  call this function directly.
</Warning>

The web entitlements will be returned along with other existing entitlements in the `CustomerInfo` object accessible via RevenueCat's SDK.

If you're logging in and out of RevenueCat, make sure to resend the Stripe subscription IDs to RevenueCat's endpoint after logging in.


---

# Welcome
Source: https://superwall.com/docs/expo

Welcome to the Superwall Expo SDK documentation

<Warning>
  **Important: Expo SDK 53+ Required**

  This SDK is exclusively compatible with Expo SDK version 53 and newer. For projects using older Expo versions, please use our [legacy React Native SDK](https://github.com/superwall/react-native-superwall).
</Warning>

## Quick Links

<CardGroup cols={2}>
  <Card title="Quickstart" icon="sparkles" href="/expo/quickstart/install">
    Get up and running with the Superwall Expo SDK
  </Card>

  <Card title="SDK Reference" icon="hammer" href="/expo/sdk-reference">
    Reference the Superwall Expo SDK
  </Card>

  <Card title="Guides" icon="book" href="/expo/guides/using-revenuecat">
    Guides for specific use cases
  </Card>

  <Card title="Example App" icon="code" href="https://github.com/superwall/expo-superwall/tree/main/example">
    Example app for the Superwall Expo SDK
  </Card>

  <Card title="Troubleshooting" icon="bug" href="https://support.superwall.com/articles/4780985851-troubleshooting-expo-sdk">
    Guides for troubleshooting common issues
  </Card>
</CardGroup>

## Feedback

We are always improving our SDKs and documentation! The Expo SDK is being actively developed, and we're committed to making it the best way to integrate paywalls into your Expo projects!

If you have feedback on any of our docs, please leave a rating and message at the bottom of the page.

If you have any issues please [open an issue on GitHub](https://github.com/superwall/expo-superwall/issues).

<SdkLatestVersion version="v0.8.1" repoUrl="https://github.com/superwall/expo-superwall" />


---

# Configure the SDK
Source: https://superwall.com/docs/expo/quickstart/configure

undefined

<Note>
  Superwall does **not** refetch its configuration during hot reloads. So, if you add products, edit a paywall, or otherwise change anything with Superwall, re-run your app to see those changes.
</Note>

As soon as your app launches, you need to configure the SDK with your **Public API Key**. You'll retrieve this from the Superwall settings page.

### Sign Up & Grab Keys

If you haven't already, [sign up for a free account](https://superwall.com/sign-up) on Superwall. Then, when you're through to the Dashboard, click **Settings** from the panel on the left, click **Keys** and copy your **Public API Key**:

![](/images/810eaba-small-Screenshot_2023-04-25_at_11.51.13.png)

### Initialize Superwall in your app

To use the Superwall SDK, you need to wrap your application (or the relevant part of it) with the `<SuperwallProvider />`. This provider initializes the SDK with your API key.

```tsx
import { SuperwallProvider } from "expo-superwall";

// Replace with your actual Superwall API key
export default function App() {
  return (
    <SuperwallProvider apiKeys={{ ios: "YOUR_SUPERWALL_API_KEY" /* android: API_KEY */ }}>
      {/* Your app content goes here */}
    </SuperwallProvider>
  );
}
```

You've now configured Superwall!


---

# Feature Gating
Source: https://superwall.com/docs/expo/quickstart/feature-gating

undefined

This allows you to register a [placement](/campaigns-placements) to access a feature that may or may not be paywalled later in time. It also allows you to choose whether the user can access the feature even if they don't make a purchase.

Here's an example.

#### With Superwall

:::expo
```tsx React Native
import { usePlacement } from "expo-superwall";

function WorkoutButton() {
  const { registerPlacement } = usePlacement();

  const handlePress = async () => {
    // remotely decide if a paywall is shown and if
    // navigation.startWorkout() is a paid-only feature
    await registerPlacement({
      placement: 'StartWorkout',
      feature: () => {
        navigation.navigate('LaunchedFeature', {
          value: 'Non-gated feature launched',
        });
      },
    });
  };

  return <Button onPress={handlePress} title="Start Workout" />;
}
```
:::

#### Without Superwall

:::expo
```typescript React Native
function pressedWorkoutButton() {
  if (user.hasActiveSubscription) {
    navigation.startWorkout()
  } else {
    navigation.presentPaywall().then((result: boolean) => {
      if (result) {
        navigation.startWorkout()
      } else {
        // user didn't pay, developer decides what to do
      }
    })
  }
}
```
:::

### How registering placements presents paywalls

You can configure `"StartWorkout"` to present a paywall by [creating a campaign, adding the placement, and adding a paywall to an audience](/campaigns) in the dashboard.

1. The SDK retrieves your campaign settings from the dashboard on app launch.
2. When a placement is called that belongs to a campaign, audiences are evaluated ***on device*** and the user enters an experiment â€” this means there's no delay between registering a placement and presenting a paywall.
3. If it's the first time a user is entering an experiment, a paywall is decided for the user based on the percentages you set in the dashboard
4. Once a user is assigned a paywall for an audience, they will continue to see that paywall until you remove the paywall from the audience or reset assignments to the paywall.
5. After the paywall is closed, the Superwall SDK looks at the *Feature Gating* value associated with your paywall, configurable from the paywall editor under General > Feature Gating (more on this below)
   1. If the paywall is set to ***Non Gated***, the `feature:` closure on `register(placement: ...)` gets called when the paywall is dismissed (whether they paid or not)
   2. If the paywall is set to ***Gated***, the `feature:` closure on `register(placement: ...)` gets called only if the user is already paying or if they begin paying.
6. If no paywall is configured, the feature gets executed immediately without any additional network calls.

Given the low cost nature of how register works, we strongly recommend registering **all core functionality** in order to remotely configure which features you want to gate â€“ **without an app update**.

:::expo
```tsx React Native
import { usePlacement } from "expo-superwall";

// on the welcome screen
function SignUpButton() {
  const { registerPlacement } = usePlacement();

  const handlePress = async () => {
    await registerPlacement({
      placement: 'SignUp',
      feature: () => {
        navigation.beginOnboarding();
      },
    });
  };

  return <Button onPress={handlePress} title="Sign Up" />;
}

function WorkoutButton() {
  const { registerPlacement } = usePlacement();

  const handlePress = async () => {
    await registerPlacement({
      placement: 'StartWorkout',
      feature: () => {
        navigation.startWorkout();
      },
    });
  };

  return <Button onPress={handlePress} title="Start Workout" />;
}
```
:::

### Automatically Registered Placements

The SDK [automatically registers](/tracking-analytics) some internal placements which can be used to present paywalls:

### Register. Everything.

To provide your team with ultimate flexibility, we recommend registering *all* of your analytics events, even if you don't pass feature blocks through. This way you can retroactively add a paywall almost anywhere â€“ **without an app update**!

If you're already set up with an analytics provider, you'll typically have an `Analytics.swift` singleton (or similar) to disperse all your events from. Here's how that file might look:

### Getting a presentation result

Useâ€¯`getPresentationResult(forPlacement:params:)` when you need to ask the SDK what would happen when registering a placement â€” without actually showing a paywall. Superwall evaluates the placement and its audience filters then returns a `PresentationResult`. You can use this to adapt your app's behavior based on the outcome (such as showing a lock icon next to a pro feature if they aren't subscribed).

In short, this lets you peek at the outcome first and decide how your app should respond:


---

# Handling Deep Links
Source: https://superwall.com/docs/expo/quickstart/in-app-paywall-previews

undefined

1. Previewing paywalls on your device before going live.
2. Deep linking to specific [campaigns](/campaigns).
3. Web Checkout [Post-Checkout Redirecting](/web-checkout-post-checkout-redirecting)

## Setup

:::expo
There are two ways to deep link into your app: URL Schemes and Universal Links (iOS only).
:::

### Adding a Custom URL Scheme

:::expo
#### iOS

Open **Xcode**. In your **info.plist**, add a row called **URL Types**. Expand the automatically created **Item 0**, and inside the **URL identifier** value field, type your **Bundle ID**, e.g., **com.superwall.Superwall-SwiftUI**. Add another row to **Item 0** called **URL Schemes** and set its **Item 0** to a URL scheme you'd like to use for your app, e.g., **exampleapp**. Your structure should look like this:

<Frame>
  ![](/images/1.png)
</Frame>

With this example, the app will open in response to a deep link with the format **exampleapp\://**. You can [view Apple's documentation](https://developer.apple.com/documentation/xcode/defining-a-custom-url-scheme-for-your-app) to learn more about custom URL schemes.
:::

:::expo
#### Android

Add the following to your `AndroidManifest.xml` file:

```xml
<activity android:name=".MainActivity">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="exampleapp" />
    </intent-filter>
</activity>
```

This configuration allows your app to open in response to a deep link with the format `exampleapp://` from your `MainActivity` class.
:::

:::expo
### Adding a Universal Link (iOS only)

<Note>
  Only required for [Web Checkout](/web-checkout), otherwise you can skip this step.
</Note>

Before configuring in your app, first [create](/web-checkout-creating-an-app) and [configure](/web-checkout-configuring-stripe-keys-and-settings) your Stripe app on the Superwall Dashboard.

#### Add a new capability in Xcode

Select your target in Xcode, then select the **Signing & Capabilities** tab. Click on the **+ Capability** button and select **Associated Domains**. This will add a new capability to your app.

<Frame>
  ![](/images/web-checkout-ul-add.png)
</Frame>

#### Set the domain

Next, enter in the domain using the format `applinks:[your-web-checkout-url]`. This is the domain that Superwall will use to handle universal links. Your `your-web-checkout-url` value should match what's under the "Web Paywall Domain" section.

<Frame>
  ![](/images/web-checkout-ul-domain.png)
</Frame>

#### Testing

<Warning>
  If your Stripe app's iOS Configuration is incomplete or incorrect, universal links **will not work**
</Warning>

You can verify that your universal links are working a few different ways. Keep in mind that it usually takes a few minutes for the associated domain file to propagate:

1. **Use Branch's online validator:** If you visit [branch.io's online validator](https://branch.io/resources/aasa-validator//) and enter in your web checkout URL, it'll run a similar check and provide the same output.

2. **Test opening a universal link:** If the validation passes from either of the two steps above, make sure visiting a universal link opens your app. Your link should be formatted as `https://[your web checkout link]/app-link/` â€” which is simply your web checkout link with `/app-link/` at the end. This is easiest to test on device, since you have to tap an actual link instead of visiting one directly in Safari or another browser. In the iOS simulator, adding the link in the Reminders app works too:

<Frame>
  ![](/images/web-checkout-test-link.jpg)
</Frame>
:::

### Handling Deep Links

## Previewing Paywalls

Next, build and run your app on your phone.

Then, head to the Superwall Dashboard. Click on **Settings** from the Dashboard panel on the left, then select **General**:

<Frame>
  ![](/images/c252198-image.png)
</Frame>

With the **General** tab selected, type your custom URL scheme, without slashes, into the **Apple Custom URL Scheme** field:

<Frame>
  ![](/images/6b3f37e-image.png)
</Frame>

Next, open your paywall from the dashboard and click **Preview**. You'll see a QR code appear in a pop-up:

<Frame>
  ![](/images/2.png)
</Frame>

<br />

<Frame>
  ![](/images/3.png)
</Frame>

On your device, scan this QR code. You can do this via Apple's Camera app. This will take you to a paywall viewer within your app, where you can preview all your paywalls in different configurations.

## Using Deep Links to Present Paywalls

Deep links can also be used as a placement in a campaign to present paywalls. Simply add `deepLink_open` as an placement, and the URL parameters of the deep link can be used as parameters! You can also use custom placements for this purpose. [Read this doc](/presenting-paywalls-from-one-another) for examples of both.


---

# Install the SDK
Source: https://superwall.com/docs/expo/quickstart/install

Install the Superwall React Native SDK via your favorite package manager.

This guide is for Expo projects that want to integrate Superwall using our Expo SDK.

<Note>
  **This doesn't sound like you?**

  * **React Native app, new to Superwall** â†’ See our [installation guide for bare React Native apps](/expo/guides/using-expo-sdk-in-bare-react-native)
  * **React Native app with existing Superwall SDK** â†’ See our [migration guide](/expo/guides/migrating-react-native)
</Note>

<Warning>
  **Important: Expo SDK 53+ Required**

  This SDK is exclusively compatible with Expo SDK version 53 and newer. For projects using older Expo versions, please use our [legacy React Native SDK](https://github.com/superwall/react-native-superwall).
</Warning>

<Warning>
  **Expo Go is Not Supported**

  The Superwall SDK uses native modules that are not available in Expo Go. You must use an [Expo Development Build](https://docs.expo.dev/develop/development-builds/introduction/) to run your app with Superwall.

  To create a development build:

  ```bash
  npx expo run:ios
  # or
  npx expo run:android
  ```

  If you see the error `Cannot find native module 'SuperwallExpo'`, see our [Debugging guide](/expo/guides/debugging) for solutions.
</Warning>

To see the latest release, check out the [Superwall Expo SDK repo](https://github.com/superwall/expo-superwall).

<Tabs items={["bun","pnpm","npm","yarn"]} groupId="language" persist>
  <Tab value="bun">
    ```bash bun
    bunx expo install expo-superwall
    ```
  </Tab>

  <Tab value="pnpm">
    ```bash pnpm
    pnpm dlx expo install expo-superwall
    ```
  </Tab>

  <Tab value="npm">
    ```bash npm
    npx expo install expo-superwall
    ```
  </Tab>

  <Tab value="yarn">
    ```bash yarn
    yarn dlx expo install expo-superwall
    ```
  </Tab>
</Tabs>

## Version Targeting

<Warning>Superwall requires iOS 15.1 or higher, as well as Android SDK 21 or higher. Ensure your Expo project targets the correct minimum OS version by updating app.json or app.config.js.</Warning>

First, install the `expo-build-properties` config plugin if your Expo project hasnâ€™t yet:

```bash
npx expo install expo-build-properties
```

Then, add the following to your `app.json` or `app.config.js` file:

```json
{
  "expo": {
    "plugins": [
      ...
      [
        "expo-build-properties",
        {
          "android": {
            "minSdkVersion": 21
          },
          "ios": {
              "deploymentTarget": "15.1" // or higher
          }
        }
      ]
    ]
  }
}
```

<Check>**And you're done!** Now you're ready to configure the SDK </Check>


---

# Present Your First Paywall
Source: https://superwall.com/docs/expo/quickstart/present-first-paywall

Learn how to present paywalls in your app.

## Placements

With Superwall, you present paywalls by registering a [Placement](/campaigns-placements). Placements are the configurable entry points to show (or not show) paywalls based on your [Campaigns](/campaigns) as setup in your Superwall dashboard.

The placement `campaign_trigger` is set to show an example paywall by default.

## Usage

The [`usePlacement`](/expo/sdk-reference/hooks/usePlacement) hook allows you to register placements that you've configured in your Superwall dashboard.
The hook returns a `registerPlacement` function that you can use to register a placement.

```tsx
import { usePlacement, useUser } from "expo-superwall";
import { Alert, Button, Text, View } from "react-native";

function PaywallScreen() {
  const { registerPlacement, state: placementState } = usePlacement({
    onError: (err) => console.error("Placement Error:", err),
    onPresent: (info) => console.log("Paywall Presented:", info),
    onDismiss: (info, result) =>
      console.log("Paywall Dismissed:", info, "Result:", result),
  });

  const handleTriggerPlacement = async () => {
    await registerPlacement({
      placement: "campaign_trigger"
    });
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="Show Paywall" onPress={handleTriggerPlacement} />
      {placementState && (
        <Text>Last Paywall Result: {JSON.stringify(placementState)}</Text>
      )}
    </View>
  );
}
```


---

# Setting User Attributes
Source: https://superwall.com/docs/expo/quickstart/setting-user-properties

undefined

By setting user attributes, you can display information about the user on the paywall. You can also define [audiences](/campaigns-audience) in a campaign to determine which paywall to show to a user, based on their user attributes.

<Note>
  If a paywall uses the **Set user attributes** action, the merged attributes are sent back to your app via `SuperwallDelegate.userAttributesDidChange(newAttributes:)`.
</Note>

You do this by passing a `[String: Any?]` dictionary of attributes to `Superwall.shared.setUserAttributes(_:)`:

:::expo
```tsx React Native
import { useUser } from "expo-superwall";

function UserProfile() {
  const { update } = useUser();

  const updateUserAttributes = async (user) => {
    await update({
      name: user.name,
      apnsToken: user.apnsTokenString,
      email: user.email,
      username: user.username,
      profilePic: user.profilePicUrl,
      stripe_customer_id: user.stripeCustomerId, // Optional: For Stripe checkout prefilling
    });
  };

  // Or update using a function that receives old attributes
  const incrementCounter = async () => {
    await update((oldAttributes) => ({
      ...oldAttributes,
      counter: (oldAttributes.counter || 0) + 1,
    }));
  };

  return (
    <>
      <Button onPress={() => updateUserAttributes(user)} title="Update Profile" />
      <Button onPress={incrementCounter} title="Increment Counter" />
    </>
  );
}
```
:::

## Usage

This is a merge operation, such that if the existing user attributes dictionary
already has a value for a given property, the old value is overwritten. Other
existing properties will not be affected. To unset/delete a value, you can pass `nil`
for the value.

You can reference user attributes in [audience filters](/campaigns-audience) to help decide when to display your paywall. When you configure your paywall, you can also reference the user attributes in its text variables. For more information on how to that, see [Configuring a Paywall](/paywall-editor-overview).


---

# Tracking Subscription State
Source: https://superwall.com/docs/expo/quickstart/tracking-subscription-state

Here's how to view whether or not a user is on a paid plan in React Native.

Superwall tracks the subscription state of a user for you. However, there are times in your app where you need to know if a user is on a paid plan or not. For example, you might want to conditionally show certain UI elements or enable premium features based on their subscription status.

## Using the `useUser` hook

The easiest way to track subscription status in React Native is with the `useUser` hook from `expo-superwall`:

```tsx
import { useUser } from "expo-superwall";
import { useEffect, useState } from "react";
import { View, Text } from "react-native";

function SubscriptionStatusExample() {
  const { subscriptionStatus } = useUser();
  const [isPaidUser, setIsPaidUser] = useState(false);

  useEffect(() => {
    if (subscriptionStatus?.status === "ACTIVE") {
      console.log("User has active entitlements:", subscriptionStatus.entitlements);
      setIsPaidUser(true);
    } else {
      console.log("User is on free plan");
      setIsPaidUser(false);
    }
  }, [subscriptionStatus]);

  return (
    <View>
      <Text>User Status: {isPaidUser ? "Pro" : "Free"}</Text>
      <Text>Subscription: {subscriptionStatus?.status ?? "unknown"}</Text>
    </View>
  );
}
```

The `subscriptionStatus` object has the following structure:

* `status`: Can be `"ACTIVE"`, `"INACTIVE"`, or `"UNKNOWN"`
* `entitlements`: An array of active entitlements (only present when status is `"ACTIVE"`)

## Listening for subscription status changes

You can also listen for real-time subscription status changes using the `useSuperwallEvents` hook:

```tsx
import { useSuperwallEvents } from "expo-superwall";
import { useState } from "react";

function App() {
  const [isPro, setIsPro] = useState(false);

  useSuperwallEvents({
    onSubscriptionStatusChange: (status) => {
      if (status.status === "ACTIVE") {
        console.log("User upgraded to pro!");
        setIsPro(true);
      } else {
        console.log("User is on free plan");
        setIsPro(false);
      }
    },
  });

  return (
    // Your app content
  );
}
```

## Checking for specific entitlements

If your app has multiple subscription tiers (e.g., Bronze, Silver, Gold), you can check for specific entitlements:

```tsx
import { useUser } from "expo-superwall";

function PremiumFeature() {
  const { subscriptionStatus } = useUser();

  const hasGoldTier = subscriptionStatus?.entitlements?.some(
    (entitlement) => entitlement.id === "gold"
  );

  if (hasGoldTier) {
    return <GoldFeatureContent />;
  }

  return <UpgradePrompt />;
}
```

## Setting subscription status

When using Superwall with a custom purchase controller or third-party billing service, you need to manually update the subscription status. Here's how to sync with RevenueCat:

```tsx
import { useUser } from "expo-superwall";
import { useEffect } from "react";
import Purchases from "react-native-purchases";

function SubscriptionSync() {
  const { setSubscriptionStatus } = useUser();

  useEffect(() => {
    // Listen for RevenueCat customer info updates
    const listener = Purchases.addCustomerInfoUpdateListener((customerInfo) => {
      const entitlementIds = Object.keys(customerInfo.entitlements.active);
      
      setSubscriptionStatus({
        status: entitlementIds.length === 0 ? "INACTIVE" : "ACTIVE",
        entitlements: entitlementIds.map(id => ({ 
          id, 
          type: "SERVICE_LEVEL" 
        }))
      });
    });

    // Get initial customer info
    const syncInitialStatus = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const entitlementIds = Object.keys(customerInfo.entitlements.active);
        
        setSubscriptionStatus({
          status: entitlementIds.length === 0 ? "INACTIVE" : "ACTIVE",
          entitlements: entitlementIds.map(id => ({ 
            id, 
            type: "SERVICE_LEVEL" 
          }))
        });
      } catch (error) {
        console.error("Failed to sync initial subscription status:", error);
      }
    };

    syncInitialStatus();

    return () => {
      listener?.remove();
    };
  }, [setSubscriptionStatus]);

  return null; // This component just handles the sync
}
```

## Using subscription status emitter

You can also listen to subscription status changes using the event emitter directly:

```tsx
import Superwall from "expo-superwall";
import { useEffect } from "react";

function SubscriptionListener() {
  useEffect(() => {
    const subscription = Superwall.shared.subscriptionStatusEmitter.addListener(
      "change",
      (status) => {
        switch (status.status) {
          case "ACTIVE":
            console.log("Active entitlements:", status.entitlements);
            break;
          case "INACTIVE":
            console.log("No active subscription");
            break;
          case "UNKNOWN":
            console.log("Subscription status unknown");
            break;
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}
```

## Superwall checks subscription status for you

Remember that the Superwall SDK uses its [audience filters](/campaigns-audience#matching-to-entitlements) for determining when to show paywalls. You generally don't need to wrap your calls to register placements with subscription status checks:

```tsx
// âŒ Unnecessary
if (subscriptionStatus?.status !== "ACTIVE") {
  await Superwall.shared.register({ placement: "campaign_trigger" });
}

// âœ… Just register the placement
await Superwall.shared.register({ placement: "campaign_trigger" });
```

In your [audience filters](/campaigns-audience#matching-to-entitlements), you can specify whether the subscription state should be considered, which keeps your codebase cleaner and puts the "Should this paywall show?" logic where it belongsâ€”in the Superwall dashboard.


---

# User Management
Source: https://superwall.com/docs/expo/quickstart/user-management

undefined

### Anonymous Users

Superwall automatically generates a random user ID that persists internally until the user deletes/reinstalls your app.

You can call `Superwall.shared.reset()` to reset this ID and clear any paywall assignments.

### Identified Users

If you use your own user management system, call `identify(userId:options:)` when you have a user's identity. This will alias your `userId` with the anonymous Superwall ID enabling us to load the userâ€™s assigned paywalls.

Calling `Superwall.shared.reset()` will reset the on-device userId to a random ID and clear the paywall assignments.

:::expo
If your Expo app targets Android, pass `{ passIdentifiersToPlayStore: true }` inside the options object you give to `Superwall.configure`. That ensures Google Play receives the plain `appUserId` as `obfuscatedExternalAccountId`; otherwise we send a hashed value. iOS builds ignore this option. Be sure the identifier satisfies [Google's requirements](https://developer.android.com/reference/com/android/billingclient/api/BillingFlowParams.Builder#setObfuscatedAccountId) and never includes PII.
:::

:::expo
```tsx React Native
import { useUser } from "expo-superwall";

function UserManagement() {
  const { identify, signOut } = useUser();

  // After retrieving a user's ID, e.g. from logging in or creating an account
  const handleLogin = async (user) => {
    await identify(user.id);
  };

  // When the user signs out
  const handleSignOut = () => {
    signOut();
  };

  return (
    <>
      <Button onPress={() => handleLogin(user)} title="Login" />
      <Button onPress={handleSignOut} title="Sign Out" />
    </>
  );
}
```
:::

<br />

<Note>
  **Advanced Use Case**

  You can supply an `IdentityOptions` object, whose property `restorePaywallAssignments` you can set to `true`. This tells the SDK to wait to restore paywall assignments from the server before presenting any paywalls. This should only be used in advanced use cases. If you expect users of your app to switch accounts or delete/reinstall a lot, you'd set this when users log in to an existing account.
</Note>

### Best Practices for a Unique User ID

* Do NOT make your User IDs guessable â€“ they are public facing.
* Do NOT set emails as User IDs â€“ this isn't GDPR compliant.
* Do NOT set IDFA or DeviceIds as User IDs â€“ these are device specific / easily rotated by the operating system.
* Do NOT hardcode strings as User IDs â€“ this will cause every user to be treated as the same user by Superwall.

### Identifying users from AppÂ Store server events

On iOS, Superwall always supplies an [`appAccountToken`](https://developer.apple.com/documentation/storekit/product/purchaseoption/3749440-appaccounttoken) with every StoreKitÂ 2 transaction:

| Scenario                                           | Value used for `appAccountToken`                                                                                      |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Youâ€™ve called `Superwall.shared.identify(userId:)` | The exact `userId` you passed                                                                                         |
| You *havenâ€™t* called `identify` yet                | The UUID automatically generated for the anonymous user (the **alias ID**), **without** the `$SuperwallAlias:` prefix |
| You passed a nonâ€‘UUID `userId` to `identify`       | StoreKit rejects it; Superwall falls back to the alias UUID                                                           |

Because the SDK falls back to the alias UUID, purchase notifications sent to your server always include a stable, unique identifierâ€”even before the user signs in.

:::expo
<Warning>
  On iOS, `appAccountToken` must be a UUID to be accepted by StoreKit.

  If the `userId` you pass to `identify` is not a valid UUID string, StoreKit will not accept it for `appAccountToken` and the SDK will fall back to the anonymous alias UUID. This can cause the identifier in App Store Server Notifications to differ from the `userId` you passed. See Apple's docs: [appAccountToken](https://developer.apple.com/documentation/appstoreserverapi/appaccounttoken).
</Warning>
:::

```swift
// Generate and use a UUID user ID in Swift
let userId = UUID().uuidString
Superwall.shared.identify(userId: userId)
```


---

# CustomPurchaseControllerProvider
Source: https://superwall.com/docs/expo/sdk-reference/components/CustomPurchaseControllerProvider

A modern, hooks-based approach to handling purchases and purchase restores with the Superwall SDK.

The `CustomPurchaseControllerProvider` component allows you to integrate your own purchase handling logic with the Superwall SDK. It provides a modern, hooks-based approach to handling purchases and purchase restores.

## Usage

```tsx
import { CustomPurchaseControllerProvider } from 'expo-superwall'
import { SuperwallProvider } from 'expo-superwall'

export default function App() {
  return (
    <CustomPurchaseControllerProvider
      controller={{
        onPurchase: async (params) => {
          if (params.platform === "ios") {
            console.log("iOS purchase:", params)
            // Handle iOS purchase with StoreKit
          } else {
            console.log("Android purchase:", params.productId)
            // Handle Android purchase with Google Play Billing
          }
        },
        onPurchaseRestore: async () => {
          console.log("Restore purchases requested")
          // Handle restore purchases logic
        },
      }}
    >
      <SuperwallProvider apiKeys={{ ios: "YOUR_IOS_KEY", android: "YOUR_ANDROID_KEY" }}>
        {/* Your app content */}
      </SuperwallProvider>
    </CustomPurchaseControllerProvider>
  )
}
```

<Warning>
  **Important:** The `onPurchase` and `onPurchaseRestore` callbacks communicate success or failure through how the Promise resolves:

  * **Promise resolves normally** â†’ Superwall records a successful purchase (counts as a conversion)
  * **Promise throws an error** â†’ Superwall records a failed/cancelled purchase

  You **must** throw an error for any non-successful outcome (user cancelled, payment failed, etc.). If your purchase function returns a status like `'cancelled'` or `'error'`, you need to check it and throw:

  ```tsx
  onPurchase: async (params) => {
    const result = await yourPurchaseFunction(params.productId);

    if (result !== 'success') {
      throw new Error(`Purchase ${result}`);
    }

    // Only reaches here on success
  },
  ```

  **Why this matters:** If your callback resolves without throwing (even when the purchase failed), Superwall will incorrectly count it as a conversion.
</Warning>

## Props

### `controller`

**Type:** `CustomPurchaseControllerContext`

An object implementing the purchase controller interface with the following methods:

#### `onPurchase: (params: OnPurchaseParams) => Promise<void>`

Called when a user initiates a purchase from a paywall. The `params` object contains different properties based on the platform:

**iOS Parameters:**

* `platform: "ios"`
* `productId: string` - The App Store product identifier
* Additional iOS-specific purchase parameters

**Android Parameters:**

* `platform: "android"`
* `productId: string` - The Google Play product identifier
* `basePlanId?: string` - The subscription base plan ID (for subscriptions)
* `offerId?: string` - The promotional offer ID (if applicable)

#### `onPurchaseRestore: () => Promise<void>`

Called when a user requests to restore previous purchases. This typically happens when users tap a "Restore Purchases" button in your paywall.

### `children`

**Type:** `React.ReactNode`

The child components that will be wrapped by this provider.

## Hook

### `useCustomPurchaseController()`

A hook that provides access to the custom purchase controller context from child components.

```tsx
import { useCustomPurchaseController } from 'expo-superwall'

function MyComponent() {
  const controller = useCustomPurchaseController()
  
  if (!controller) {
    // Not within a CustomPurchaseControllerProvider
    return null
  }
  
  const handlePurchase = async () => {
    // Access controller methods if needed
  }
  
  return <Button onPress={handlePurchase}>Purchase</Button>
}
```

**Returns:** `CustomPurchaseControllerContext | null`

Returns the controller object passed to the provider, or `null` if the component is not within a `CustomPurchaseControllerProvider`.

## How It Works

The `CustomPurchaseControllerProvider` listens for purchase events from the Superwall SDK using the `useSuperwallEvents` hook internally. When a purchase or restore event occurs:

1. It calls your provided `onPurchase` or `onPurchaseRestore` method
2. After your method completes, it notifies the Superwall SDK that the purchase was successful
3. Superwall then dismisses the paywall and continues with the user flow

## Integration with RevenueCat

For a complete RevenueCat integration with error handling, subscription status synchronization, and working examples, see the [Using RevenueCat](/docs/expo/guides/using-revenuecat) guide.

## Notes

* The provider must wrap your app at a level where both the Superwall SDK and your purchase logic can access it
* Purchase success/failure handling is automatic - you just need to perform the actual purchase


---

# SuperwallError
Source: https://superwall.com/docs/expo/sdk-reference/components/SuperwallError

undefined

`<SuperwallError />` is a component that renders its children only when Superwall configuration has failed. This component was added in v0.7.0 to help handle SDK initialization errors gracefully.

The component can accept either static React nodes or a render function that receives the error message string.

## Props

### `children`

The content to render when Superwall has an error. Can be:

* Static React nodes (e.g., `<Text>Error message</Text>`)
* A function that receives the error message string and returns React nodes

## Example

### Static Error UI

```tsx
import {
  SuperwallProvider,
  SuperwallError,
  SuperwallLoading,
  SuperwallLoaded,
} from "expo-superwall";
import { View, Text, Button } from "react-native";

export default function App() {
  return (
    <SuperwallProvider apiKeys={{ ios: "YOUR_SUPERWALL_API_KEY" }}>
      <SuperwallLoading>
        <ActivityIndicator style={{ flex: 1 }} />
      </SuperwallLoading>
      <SuperwallError>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>Failed to load Superwall</Text>
          <Text>Please check your internet connection and try again.</Text>
        </View>
      </SuperwallError>
      <SuperwallLoaded>
        {/* Your main app content */}
      </SuperwallLoaded>
    </SuperwallProvider>
  );
}
```

### Dynamic Error UI with Error Message

```tsx
import {
  SuperwallProvider,
  SuperwallError,
  SuperwallLoading,
  SuperwallLoaded,
} from "expo-superwall";
import { View, Text, Button } from "react-native";

export default function App() {
  const handleRetry = () => {
    // Implement retry logic
  };

  return (
    <SuperwallProvider apiKeys={{ ios: "YOUR_SUPERWALL_API_KEY" }}>
      <SuperwallLoading>
        <ActivityIndicator style={{ flex: 1 }} />
      </SuperwallLoading>
      <SuperwallError>
        {(error) => (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text>Failed to initialize Superwall</Text>
            <Text>{error}</Text>
            <Button title="Retry" onPress={handleRetry} />
          </View>
        )}
      </SuperwallError>
      <SuperwallLoaded>
        {/* Your main app content */}
      </SuperwallLoaded>
    </SuperwallProvider>
  );
}
```

### Using with onConfigurationError Callback

You can also use the `onConfigurationError` prop on `SuperwallProvider` to handle errors programmatically:

```tsx
import { SuperwallProvider } from "expo-superwall";

export default function App() {
  return (
    <SuperwallProvider
      apiKeys={{ ios: "YOUR_SUPERWALL_API_KEY" }}
      onConfigurationError={(error) => {
        console.error("Superwall configuration failed:", error);
        // Track error in analytics, show toast, etc.
      }}
    >
      {/* Your app content */}
    </SuperwallProvider>
  );
}
```

## Notes

* This component only renders when there's a configuration error. It will render `null` if Superwall is loading or has successfully configured.
* Use this component alongside `<SuperwallLoading />` and `<SuperwallLoaded />` to provide a complete loading/error/success UI flow.
* The error state is automatically cleared when the SDK successfully configures on retry.


---

# SuperwallLoaded
Source: https://superwall.com/docs/expo/sdk-reference/components/SuperwallLoaded

undefined

`<SuperwallLoaded />` is a component that renders its children only when Superwall has finished loading and is configured. This component is useful for conditionally rendering parts of your UI that depend on Superwall being ready.

If Superwall is still loading, has not been configured, or has a configuration error, this component will render `null`.

## Props

### `children`

The content to render once Superwall is loaded and configured.

## Example

```tsx
import {
  SuperwallProvider,
  SuperwallLoading,
  SuperwallLoaded,
  SuperwallError,
} from "expo-superwall";
import { ActivityIndicator, View, Text } from "react-native";

const API_KEY = "YOUR_SUPERWALL_API_KEY";

export default function App() {
  return (
    <SuperwallProvider apiKeys={{ ios: API_KEY }}>
      <SuperwallLoading>
        <ActivityIndicator style={{ flex: 1 }} />
      </SuperwallLoading>
      <SuperwallError>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>Failed to load Superwall</Text>
        </View>
      </SuperwallError>
      <SuperwallLoaded>
        {/* Your main app screen or component */}
        <MainAppScreen />
      </SuperwallLoaded>
    </SuperwallProvider>
  );
}

function MainAppScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Superwall SDK is ready!</Text>
      {/* Rest of your app's UI */}
    </View>
  );
}
```

## Notes

* This component will not render if there's a configuration error. Use `<SuperwallError />` to handle error states.
* This component will not render while Superwall is loading. Use `<SuperwallLoading />` to show loading states.
* Use this component alongside `<SuperwallLoading />` and `<SuperwallError />` to provide a complete loading/error/success UI flow.


---

# SuperwallLoading
Source: https://superwall.com/docs/expo/sdk-reference/components/SuperwallLoading

undefined

`<SuperwallLoading />` is a component that renders its children only when Superwall is loading or not yet configured. This component can be used to display a loading indicator or a placeholder while the Superwall SDK is initializing.

Once Superwall is configured and no longer in a loading state, this component will render `null`.

**Note:** This component will not render if there's a configuration error. Use `<SuperwallError />` to handle error states.

## Example

```tsx
import {
  SuperwallProvider,
  SuperwallLoading,
  SuperwallLoaded,
  SuperwallError,
} from "expo-superwall";
import { ActivityIndicator, View, Text } from "react-native";

const API_KEY = "YOUR_SUPERWALL_API_KEY";

export default function App() {
  return (
    <SuperwallProvider apiKeys={{ ios: API_KEY }}>
      <SuperwallLoading>
        <ActivityIndicator style={{ flex: 1 }} />
      </SuperwallLoading>
      <SuperwallError>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>Failed to load Superwall</Text>
        </View>
      </SuperwallError>
      <SuperwallLoaded>
        {/* Your main app screen or component */}
        <MainAppScreen />
      </SuperwallLoaded>
    </SuperwallProvider>
  );
}

function MainAppScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Superwall SDK is ready!</Text>
      {/* Rest of your app's UI */}
    </View>
  );
}
```

## Related Components

* [`<SuperwallLoaded />`](/expo/sdk-reference/components/SuperwallLoaded) - Renders children when Superwall is ready
* [`<SuperwallError />`](/expo/sdk-reference/components/SuperwallError) - Renders children when Superwall configuration fails


---

# SuperwallProvider
Source: https://superwall.com/docs/expo/sdk-reference/components/SuperwallProvider

undefined

`<SuperwallProvider />` is the root component for the Superwall SDK. It is used to initialize the SDK with your API key.

## Props

### `apiKeys`

The `apiKeys` prop is an object that contains the API keys for the Superwall SDK.

### `options`

Optional configuration options to pass to the native Superwall SDK. See [SuperwallOptions](/expo/guides/configuring) for available options.

### `onConfigurationError`

Optional callback invoked when SDK configuration fails. Use this to track errors, show custom UI, or implement retry logic.

```tsx
<SuperwallProvider
  apiKeys={{ ios: "YOUR_SUPERWALL_API_KEY" }}
  onConfigurationError={(error) => {
    console.error("Superwall configuration failed:", error);
    // Handle error, show UI, or retry
  }}
>
  {/* Your app content */}
</SuperwallProvider>
```

## Example

```tsx
import { SuperwallProvider } from "expo-superwall";

// Replace with your actual Superwall API key
export default function App() {
  return (
    <SuperwallProvider apiKeys={{ ios: "YOUR_SUPERWALL_API_KEY" /* android: API_KEY */ }}>
      {/* Your app content goes here */}
    </SuperwallProvider>
  );
}
```


---

# getPresentationResult()
Source: https://superwall.com/docs/expo/sdk-reference/getPresentationResult

Check the outcome of a placement without presenting a paywall.

## Purpose

Retrieves the presentation result for a placement without presenting the paywall. Call this when you need to know whether a placement would show a paywall, send the user to a holdout, or fail due to missing configuration before you decide how to render UI.

## Signature

Hook usage:

```ts
const { getPresentationResult } = useSuperwall()

await getPresentationResult(
  placement: string,
  params?: Record<string, any>
): Promise<PresentationResult>
```

Compat API usage:

```ts
import Superwall from "expo-superwall/compat"

await Superwall.getPresentationResult({
  placement: string,
  params?: Map<string, any>
}): Promise<PresentationResult>
```

Both variants return a promise that resolves to a `PresentationResult` object from `expo-superwall/compat`.

## Parameters

<ParamTable>
  | Name        | Type                                        | Description                                                                                                                                                     |
  | ----------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `placement` | `string`                                    | Placement to evaluate. Always await `Superwall.configure` before calling.                                                                                       |
  | `params`    | `Record<string, any>` or `Map<string, any>` | Optional parameters that feed audience filters. Keys beginning with `$` are reserved and removed. Nested maps or arrays are not supported. Defaults to omitted. |
</ParamTable>

## Returns / State

The promise resolves to one of the `PresentationResult` subclasses exported from `expo-superwall/compat`:

* `PresentationResultPaywall` â€“ A paywall would be shown. Includes an `experiment` field (`id`, `groupId`, etc.).
* `PresentationResultHoldout` â€“ The user is placed in a holdout for the experiment.
* `PresentationResultNoAudienceMatch` â€“ No matching audience rules.
* `PresentationResultPlacementNotFound` â€“ The placement name is not attached to any campaign.
* `PresentationResultUserIsSubscribed` â€“ The SDK determined the user is already active, so no paywall will show.
* `PresentationResultPaywallNotAvailable` â€“ The paywall could not be displayed (no activity, already showing, offline, etc.).

If configuration fails or the native module throws, the promise rejectsâ€”catch and handle these errors as you would any async call.

## Usage

```tsx
import {
  PresentationResultPaywall,
  PresentationResultHoldout,
  PresentationResultNoAudienceMatch,
  PresentationResultPlacementNotFound,
} from "expo-superwall/compat"
import { useSuperwall } from "expo-superwall"

export function FeatureGate() {
  const { getPresentationResult } = useSuperwall()

  const checkAccess = async () => {
    const result = await getPresentationResult("premium_feature", { source: "settings" })

    if (result instanceof PresentationResultPaywall) {
      setExperiment(result.experiment)
      setState("locked")
    } else if (result instanceof PresentationResultHoldout) {
      setState("holdout")
    } else if (result instanceof PresentationResultNoAudienceMatch) {
      unlockFeature()
    } else if (result instanceof PresentationResultPlacementNotFound) {
      console.warn("Placement missing from dashboard")
    } else {
      fallbackFlow()
    }
  }

  return <Button title="Check access" onPress={checkAccess} />
}
```

```tsx
import Superwall, {
  PresentationResultPaywall,
  PresentationResultPaywallNotAvailable,
} from "expo-superwall/compat"

async function inspectPlacement() {
  const result = await Superwall.getPresentationResult({
    placement: "premium_feature",
    params: new Map([["source", "home"]]),
  })

  if (result instanceof PresentationResultPaywallNotAvailable) {
    // Show offline UI
    return
  }

  if (result instanceof PresentationResultPaywall) {
    console.log("Experiment group:", result.experiment.groupId)
  }
}
```

## Related

* [`useSuperwall`](/expo/sdk-reference/hooks/useSuperwall) â€“ Provides the hook variant shown above.
* [`SuperwallProvider`](/expo/sdk-reference/components/SuperwallProvider) â€“ Configure the SDK before calling this method.
* [Feature gating quickstart](/expo/quickstart/feature-gating) â€“ Shows the full flow of gating UI with placements.


---

# usePlacement
Source: https://superwall.com/docs/expo/sdk-reference/hooks/usePlacement

A React hook that registers a placement so it can remotely trigger a paywall, gate feature access, and expose paywall-lifecycle state.

## Purpose

Registers a placement so that, when itâ€™s added to a campaign on the Superwall Dashboard, it can trigger a paywall and optionally gate access to a feature while exposing the paywall lifecycle as React state.

## Signature

```ts
function usePlacement(
  callbacks?: usePlacementCallbacks
): {
  /** Registers the placement and potentially presents a paywall. */
  registerPlacement: (args: RegisterPlacementArgs) => Promise<void>
  /** Current paywall-lifecycle state. */
  state: PaywallState
}
```

## Parameters

<ParamTable>
  | Name        | Type                     | Description                                                          |
  | ----------- | ------------------------ | -------------------------------------------------------------------- |
  | `callbacks` | `usePlacementCallbacks?` | Optional callbacks that fire at each stage of the paywall lifecycle. |
</ParamTable>

### usePlacementCallbacks

<ParamTable>
  | Name        | Type                                                        | Description                                                              |
  | ----------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
  | `onPresent` | `(paywallInfo: PaywallInfo) => void`                        | Called when a paywall is presented.                                      |
  | `onDismiss` | `(paywallInfo: PaywallInfo, result: PaywallResult) => void` | Called when a paywall is dismissed.                                      |
  | `onSkip`    | `(reason: PaywallSkippedReason) => void`                    | Called when presentation is skipped (e.g., hold-out, no audience match). |
  | `onError`   | `(error: string) => void`                                   | Called when the paywall fails to present or another SDK error occurs.    |
</ParamTable>

### RegisterPlacementArgs

<ParamTable>
  | Name        | Type                   | Description                                                                      |
  | ----------- | ---------------------- | -------------------------------------------------------------------------------- |
  | `placement` | `string`               | Placement name as defined on the Superwall Dashboard.                            |
  | `params`    | `Record<string, any>?` | Optional parameters passed to the placement.                                     |
  | `feature`   | `() => void`           | Function executed **only** if no paywall is shown (the user is allowed through). |
</ParamTable>

## Returns / State

The hook returns an object with:

â€¢ `registerPlacement` â€” `(args: RegisterPlacementArgs) => Promise<void>`\
â€¢ `state` â€” `PaywallState`

`PaywallState` union:

* `{ status: "idle" }`
* `{ status: "presented"; paywallInfo: PaywallInfo }`
* `{ status: "dismissed"; result: PaywallResult }`
* `{ status: "skipped"; reason: PaywallSkippedReason }`
* `{ status: "error"; error: string }`

## Usage

```tsx
import { Button, Text } from "react-native"
import { usePlacement } from "expo-superwall"

export default function PremiumButton() {
  const { registerPlacement, state } = usePlacement({
    onPresent: (info) => console.log("Paywall presented:", info.name),
    onDismiss: (_, result) =>
      console.log("Paywall dismissed:", result.type),
    onSkip: (reason) =>
      console.log("Paywall skipped:", reason.type),
    onError: (error) => console.error("Paywall error:", error),
  })

  const unlockFeature = async () => {
    await registerPlacement({
      placement: "MyFeaturePlacement",
      feature: () => {
        // User was allowed through without a paywall
        navigateToPremiumFeature()
      },
    })
  }

  return (
    <>
      <Button title="Unlock Feature" onPress={unlockFeature} />
      <Text>Current paywall state: {state.status}</Text>
    </>
  )
}
```

See also: [Present a paywall](/docs/expo/quickstart/present-first-paywall)


---

# useSuperwall
Source: https://superwall.com/docs/expo/sdk-reference/hooks/useSuperwall

undefined

## Purpose

The `useSuperwall` hook is the core hook that provides access to the Superwall store and underlying SDK functionality. It's generally used internally by other more specific hooks like `useUser` and `usePlacement`, but can be used directly for advanced scenarios. It ensures that native event listeners are set up on first use.

## Returned Values (Store State and Actions)

The hook returns an object representing the Superwall store. If a `selector` function is provided, it returns the selected slice of the store.

### State

* `isConfigured: boolean`: True if the Superwall SDK has been configured with an API key.
* `isLoading: boolean`: True when the SDK is performing an asynchronous operation like configuration.
* `listenersInitialized: boolean`: True if native event listeners have been initialized.
* `user?: UserAttributes | null`: An object containing the current user's attributes.
  * `UserAttributes`:
    * `aliasId: string`: The alias ID of the user.
    * `appUserId: string`: The application-specific user ID.
    * `applicationInstalledAt: string`: ISO date string of when the application was installed.
    * `seed: number`: A seed value for the user.
    * `[key: string]: any`: Other custom user attributes.
* `subscriptionStatus?: SubscriptionStatus`: The current subscription status of the user.
  * `SubscriptionStatus` (see `SuperwallExpoModule.types.ts` for full details):
    * `status: "UNKNOWN" | "INACTIVE" | "ACTIVE"`
    * `entitlements?: Entitlement[]` (if status is "ACTIVE")
      * `Entitlement`: `{ id: string, type: EntitlementType }`

### Actions (Functions)

* `configure: (apiKey: string, options?: Record<string, any>) => Promise<void>`: Initializes the Superwall SDK with the provided API key and optional configuration options.
  * **Android / Google Play**: Include `{ passIdentifiersToPlayStore: true }` in the `options` object if you need the raw `appUserId` forwarded to Google Play as `obfuscatedExternalAccountId`. Otherwise the SDK sends a SHA-256 hash. This flag is ignored on iOS builds but you can guard it with `Platform.OS === "android"` if you prefer.
* `identify: (userId: string, options?: IdentifyOptions) => Promise<void>`: Identifies the user with the given `userId`.
  * `IdentifyOptions`:
    * `restorePaywallAssignments?: boolean`: If true, restores paywall assignments from a previous session.
* `reset: () => Promise<void>`: Resets the user's identity and clears any stored user-specific data. This is equivalent to logging out the user.
* `registerPlacement: (placement: string, params?: Record<string, any>, handlerId?: string | null) => Promise<void>`: Registers a placement. This may or may not present a paywall depending on campaign rules. `handlerId` is used internally by `usePlacement` to associate events.
* `getPresentationResult: (placement: string, params?: Record<string, any>) => Promise<any>`: Gets the presentation result for a given placement.
* `dismiss: () => Promise<void>`: Dismisses any currently presented paywall.
* `preloadAllPaywalls: () => Promise<void>`: Preloads all paywalls.
* `preloadPaywalls: (placements: string[]) => Promise<void>`: Preloads paywalls for the specified placement IDs.
* `setUserAttributes: (attrs: Record<string, any>) => Promise<void>`: Sets custom attributes for the current user.
* `getUserAttributes: () => Promise<Record<string, any>>`: Retrieves the attributes of the current user.
* `setLogLevel: (level: string) => Promise<void>`: Sets the log level for the SDK. `level` can be one of: `"debug"`, `"info"`, `"warn"`, `"error"`, `"none"`.

### Selector (Optional Parameter)

* `selector?: (state: SuperwallStore) => T`: A function that receives the entire `SuperwallStore` state and returns a selected part of it. Useful for performance optimization by only re-rendering components when the selected state changes. Uses `zustand/shallow` for shallow equality checking.

## Example

(Direct Usage - Advanced)

```tsx
import { useSuperwall } from 'expo-superwall';

function MyAdvancedComponent() {
  const { isConfigured, configure, setUserAttributes } = useSuperwall();

  if (!isConfigured) {
    return <Text>SDK not configured yet.</Text>;
  }

  const handleSetCustomAttribute = () => {
    setUserAttributes({ myCustomFlag: true });
  };

  return <Button title="Set Custom Flag" onPress={handleSetCustomAttribute} />;
}
```

### Example: Configure with Android identifiers

```tsx
import { Platform } from "react-native"
import Superwall from "expo-superwall/compat"

async function configureSuperwall() {
  await Superwall.configure({
    apiKey: Platform.OS === "ios" ? IOS_KEY : ANDROID_KEY,
    options: Platform.OS === "android"
      ? { passIdentifiersToPlayStore: true }
      : undefined,
  })
}
```


---

# useSuperwallEvents
Source: https://superwall.com/docs/expo/sdk-reference/hooks/useSuperwallEvents

undefined

## Purpose

The `useSuperwallEvents` hook provides a low-level way to subscribe to *any* native Superwall event. This is useful for advanced use cases or for events not covered by the more specific hooks. Listeners are automatically cleaned up when the component using this hook unmounts.

## Parameters

* `callbacks?: SuperwallEventCallbacks`: An object where keys are event names and values are the corresponding callback functions.
  * `SuperwallEventCallbacks`: (Refer to `src/useSuperwallEvents.ts` and `src/SuperwallExpoModule.types.ts` for a full list of subscribable events and their payload types. Common events include):
    * `onPaywallPresent?: (info: PaywallInfo) => void`
    * `onPaywallDismiss?: (info: PaywallInfo, result: PaywallResult) => void`
    * `onPaywallSkip?: (reason: PaywallSkippedReason) => void`
    * `onPaywallError?: (error: string) => void`
    * `onSubscriptionStatusChange?: (status: SubscriptionStatus) => void`
    * `onSuperwallEvent?: (eventInfo: SuperwallEventInfo) => void`: For generic Superwall events.
      * `SuperwallEventInfo`: `{ event: SuperwallEvent, params: Record<string, any> }`
    * `onCustomPaywallAction?: (name: string) => void`: When a custom action is triggered from a paywall.
    * `willDismissPaywall?: (info: PaywallInfo) => void`
    * `willPresentPaywall?: (info: PaywallInfo) => void`
    * `didDismissPaywall?: (info: PaywallInfo) => void`
    * `didPresentPaywall?: (info: PaywallInfo) => void`
    * `onPaywallWillOpenURL?: (url: string) => void`
    * `onPaywallWillOpenDeepLink?: (url: string) => void`
    * `onLog?: (params: { level: LogLevel, scope: LogScope, message: string | null, info: Record<string, any> | null, error: string | null }) => void`
    * `handlerId?: string`: (Optional) If provided, some events like `onPaywallPresent`, `onPaywallDismiss`, `onPaywallSkip` will only be triggered if the event originated from a `registerPlacement` call associated with the same `handlerId`. This is used internally by `usePlacement`.

## Returned Values

This hook does not return any values (`void`). Its purpose is to set up and tear down event listeners.

## Example

```tsx
import { useSuperwallEvents } from 'expo-superwall';

function EventLogger() {
  useSuperwallEvents({
    onSuperwallEvent: (eventInfo) => {
      console.log('Superwall Event:', eventInfo.event.event, eventInfo.params);
    },
    onSubscriptionStatusChange: (newStatus) => {
      console.log('Subscription Status Changed:', newStatus.status);
    },
    onPaywallPresent: (info) => {
      console.log('Paywall Presented (via useSuperwallEvents):', info.name);
    }
  });

}
```


---

# useUser
Source: https://superwall.com/docs/expo/sdk-reference/hooks/useUser

undefined

## Purpose

The `useUser` hook provides a convenient way to manage user identity and attributes, and access user-specific information like subscription status.

## Returned Values

An object containing:

* `identify: (userId: string, options?: IdentifyOptions) => Promise<void>`: Identifies the user with Superwall.
  * `userId: string`: The unique identifier for the user.
  * `options?: IdentifyOptions`: Optional parameters for identification.
    * `restorePaywallAssignments?: boolean`: If true, attempts to restore paywall assignments for this user.
* `update: (attributes: Record<string, any> | ((old: Record<string, any>) => Record<string, any>)) => Promise<void>`: Updates the current user's attributes.
  * `attributes`: Either an object of attributes to set/update, or a function that takes the old attributes and returns the new attributes.
* `signOut: () => void`: Resets the user's identity, effectively signing them out from Superwall's perspective.
* `refresh: () => Promise<Record<string, any>>`: Manually refreshes the user's attributes and subscription status from the Superwall servers. Returns the refreshed user attributes.
* `setIntegrationAttributes: (attributes: IntegrationAttributes) => Promise<void>`: Sets attributes for third-party integrations (e.g., attribution providers, analytics platforms). Used to link user IDs from services like Adjust, Amplitude, AppsFlyer, etc.
* `getIntegrationAttributes: () => Promise<Record<string, string>>`: Gets the currently set integration attributes.
* `getEntitlements: () => Promise<EntitlementsInfo>`: Retrieves the user's entitlements from Superwall's servers. Returns both active and inactive entitlements.
* `setSubscriptionStatus: (status: SubscriptionStatus) => Promise<void>`: Manually sets the subscription status for the user. Useful when integrating with RevenueCat or other subscription providers.
* `subscriptionStatus?: SubscriptionStatus`: The current subscription status of the user.
  * `SubscriptionStatus`: (As defined in `useSuperwall` and `SuperwallExpoModule.types.ts`)
    * `status: "UNKNOWN" | "INACTIVE" | "ACTIVE"`
    * `entitlements?: Entitlement[]` (if status is "ACTIVE")
* `user?: UserAttributes | null`: An object containing the current user's attributes (e.g., `appUserId`, `aliasId`, custom attributes).
  * `UserAttributes`: (As defined in `useSuperwall`)

## Usage

[Managing Users](/expo/guides/managing-users)


---

# Overview
Source: https://superwall.com/docs/expo/sdk-reference

Reference documentation for the Superwall Expo SDK.

## Welcome to the Superwall Expo SDK Reference

You can find the source code for the SDK [on GitHub](https://github.com/superwall/expo-superwall) along with our [example app](https://github.com/superwall/expo-superwall/tree/main/example).

## Feedback

We are always improving our SDKs and documentation!

If you have feedback on any of our docs, please leave a rating and message at the bottom of the page.

If you have any issues with the SDK, please [open an issue on GitHub](https://github.com/superwall/expo-superwall/issues).

<SdkLatestVersion version="v0.8.1" repoUrl="https://github.com/superwall/expo-superwall" />