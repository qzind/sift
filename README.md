# sift.js
Filter and parse locally attached hardware information.

## Filters
* **Printer driver listings**
  * [Filter by well-known PDF/file printers](#virtual-printers)
  * [Filter by well-known Raw printers](#raw-printers)
* **USB scales**
  * [Filter by well-known USB scale vendors](#usb-scales)

## Utilities
* **USB scale data**
  * [Parses USB scale weight from raw byte array](#usb-scale-parsing)


## Printers
Sift offers the ability to filter a supplied printer list based on an [internal database](https://github.com/qzind/sift/blob/master/sift.js) of printer information.

### Printer Prerequisites
 * Printers must be supplied in an object array
 * Each object must contain a printer `name` and printer `driver`.

   ```js
   [ { name: 'foo', driver: 'bar' }, { ... } ]
   ```

### Virtual Printers
 * Sift can `keep` or `toss` all PDF, Virtual or File printers:

 **Before**

   ```js
   data = [ { name: 'HP Color LaserJet 2500', driver: 'HP Color LaserJet 2500 PS Class Driver' },
             { name: 'CutePDFWriter', driver: 'PDFwriter.ppd' } ];
   ```
   **Keep/Toss**
   ```js
   data = sift.toss(data, { physical: false });
   // or
   data = sift.keep(data, { physical: true }); 
   ```
   **Sifted**
   ```js
   [ { name: 'HP Color LaserJet 2500', driver: 'HP Color LaserJet 2500 PS Class Driver' } ]
   ```

### Raw Printers
 * Sift can `keep` or `toss` all raw capable printers.

 **Before**

   ```js
   data = [ { name: 'HP Color LaserJet 2500', driver: 'HP Color LaserJet 2500 PS Class Driver' },
             { name: 'Zebra LP2844 Raw', driver: 'Generic / Text Only' } ];
   ```
   **Keep/Toss**
   ```js
   data = sift.keep(data, { type: 'raw' });
   ```
   **Sifted**
   ```js
   [ { name: 'Zebra LP2844 Raw', driver: 'Generic / Text Only' } ]
   ```

---

## USB Devices
Sift can identify USB devices by `type` based on an [internal database](https://github.com/qzind/sift/blob/master/sift.js) of USB devices.  See also [USB Scale Parsing](#usb-scale-parsing)

### USB Prerequisites
 * USB device listing must be supplied in an object array
 * Each object must contain a USB `vendor` and USB `product`.

   ```js
   [ { vendor: '0x0EB8', product: '0xF000' }, { ... } ]
   ```

### USB Scales
 * Sift can return the listing of attached USB scales.

 **Before**

  ```js
   data = [ { vendor: '0x0EB8', product: '0xF000' },
             { vendor: '0x0B9E', product: '0xF0F0' } ];
   ```
   **Keep/Toss**
   ```js
   data = sift.keep(data, { type: 'scale' });
   ```
   **Sifted**
   ```js
   [ { vendor: '0x0EB8', product: '0xF000' } ]
   ```

---

## USB Data

### USB Scale Parsing
 * Sift can parse USB Data into weight, units, status in plain English text.

 **Before**

   ```js
   var data = ['\x03', '\x02', '\x0C', '\xFE', '\x00', '\x00', '\x00', '\x00'];
   ```

   **Parse Data**
   ```js
   var weight = sift.parse.scale(data);
   ```

   **Parsed**
   ```
   "0.03lbs - Stable"
   ```


```
