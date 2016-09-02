# sift
Sift is a JavaScript helper for locally attached computer hardware.  It filters hardware data for you.

## Filters
* **Printer driver listings**
  * Filter by well-known PDF/file printers
  * Filter by well-known Raw printers
  * Windows/CUPS driver lists are included
* **USB scales**
  * Filter by well-known USB scale vendors
  * Filter by `vendorId`, `productId` (`0x0000` format)

## Utilities
* **USB scales**
  * Parses USB scale weight from raw byte array

## Usage
```js
// keep raw printers only
data = sift.keep(data, { sift.Type.RAW });

// toss virtual or file printers
data = sift.toss(data, { physical: false });
```