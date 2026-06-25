# React Checkout Migration Notes

## Project Context

Legacy application: - ASP.NET MVC5 (.NET Framework) - Razor Views -
Existing checkout flow in `CheckoutController` - Existing order
processing through `CheckOutBll.AddOrder()`

Frontend: - React + TypeScript + Vite - Incremental migration - New
React Checkout page consuming MVC JSON APIs

------------------------------------------------------------------------

# Current Status

## Completed

### Cart APIs

Existing React endpoints:

-   `GET /Checkout/CartSummary`
-   `GET /Checkout/CartDetails`

Used by: - Header cart count - Cart drawer - Cart page

### Checkout API

Endpoint:

-   `GET /Checkout/CheckoutData`

Returns:

``` json
{
  "orderName": "",
  "subtotal": 77.99,
  "items": [],
  "billingAddress": {}
}
```

### Billing Address Fix

Problem:

``` json
"state": 17
```

or

``` json
"state": null
```

Solution:

Lookup state name using:

``` csharp
var stateList = sbll.GetStates(
    account.BillingAddress.CountryID.ToString().TryToInt());

var billingState = stateList.FirstOrDefault(
    state => state.ID == account.BillingAddress.StateID);

billingStateName = billingState?.State;
```

Result:

``` json
"state": "Kansas"
```

------------------------------------------------------------------------

# Legacy Checkout Flow

## Page

`Checkout.cshtml`

## Initial GET

Controller:

``` csharp
public ActionResult Checkout(string skiplogin)
```

Responsibilities:

-   Load cart
-   Load account
-   Load billing address
-   Calculate tax
-   Build checkout model
-   Render checkout page

------------------------------------------------------------------------

## Address Persistence

Legacy checkout stores billing address in Session.

Method:

``` csharp
public void SetAddresses()
```

Stores:

``` csharp
Session["billingInfo"]
```

React checkout does NOT currently replace this.

------------------------------------------------------------------------

## Checkout Validation

Legacy flow calls:

``` csharp
CheckWhenCheckout()
```

before order submission.

------------------------------------------------------------------------

## Order Submission

Critical method:

``` csharp
[HttpPost]
public ActionResult Checkout(CheckOutModel model)
```

This is the real checkout endpoint.

------------------------------------------------------------------------

## Order Creation

Orders are ultimately created through:

``` csharp
cbll.AddOrder(
    lockerID,
    model.Account.ID,
    checkoutobj);
```

This is the most important backend call in checkout.

Responsibilities already handled:

-   Payment processing
-   Order creation
-   Tax handling
-   Validation
-   Email notifications
-   Cart clearing
-   Thank You redirect

DO NOT duplicate this logic in React.

Reuse it whenever possible.

------------------------------------------------------------------------

# Payment Findings

## Not a Modern Adyen Sessions Flow

Current checkout model still expects:

``` csharp
PayInfoModel
```

Fields:

``` csharp
CardHolderName
CreditCardNumber
ExpirationMonth
ExpirationYear
CVV2Code
```

Validation exists in:

``` text
PayInfoValidator.cs
```

This indicates legacy checkout still posts card information through MVC
models.

Before rewriting payment:

Find exactly where card collection is occurring.

Search terms:

-   `payment__cardHolderName`
-   `payment__cardNumber`
-   `adyen-payment`
-   `Adyen`
-   `encryptedCardNumber`
-   `new AdyenCheckout`

------------------------------------------------------------------------

# Recommended Next Steps

## Phase 1

Build:

``` http
POST /Checkout/SaveBillingAddress
```

Purpose:

-   Replace legacy Session workflow
-   Persist billing information from React

------------------------------------------------------------------------

## Phase 2

Build:

``` http
GET /Checkout/OrderSummary
```

Return:

``` json
{
  "subtotal": 0,
  "tax": 0,
  "total": 0
}
```

Use existing backend tax logic.

------------------------------------------------------------------------

## Phase 3

Build:

``` http
POST /Checkout/CompleteOrder
```

Internally reuse:

``` csharp
Checkout(CheckOutModel model)
```

or

``` csharp
cbll.AddOrder(...)
```

instead of rewriting order logic.

------------------------------------------------------------------------

# Important Files

## Controller

``` text
CheckoutController.cs
```

Contains:

-   Cart APIs
-   CheckoutData API
-   Legacy checkout flow
-   Order submission logic

## Legacy View

``` text
Checkout.cshtml
```

Contains:

-   Checkout form
-   Payment placeholders
-   Legacy workflow

## Validators

``` text
CheckoutValidator.cs
PayInfoValidator.cs
CartValidator.cs
```

## Models

``` text
CheckoutModel.cs
ShoppingCartModel.cs
```

------------------------------------------------------------------------

# Current Migration Priority

1.  SaveBillingAddress API
2.  OrderSummary API (tax + total)
3.  Understand payment implementation
4.  CompleteOrder API
5.  React payment UI integration
