# SORIYA SPORT

Khmer jersey and fabric catalog, prepared for GitHub Pages. Prices, contact links, comparison and the order calculator work entirely in the browser.

## Hosting

In Settings → Pages, select **GitHub Actions**. The Publish Soriya Sport workflow deploys on pushes to main, manual runs, and a 15-minute schedule. GitHub may delay scheduled runs; refreshes are not instant. Scheduled workflows in inactive public repositories may be disabled by GitHub.

The workflow reads only the public jersey folder and downloads validated images and optimizes them to transparent WebP previews into the deployed artifact. No Google credentials are required. Fabric data and prices remain independent of Drive. Failed Drive refreshes retain the bundled gallery. Maximum 100 images, 30 MB each. Keep the Drive folder publicly readable.

Edit `site/index.html`, `site/style.css`, `site/app.js`, and `site/fabric-data.js` to update the site. Run `python scripts/sync-drive.py site` to refresh the bundled gallery locally. All assets and fetch paths are relative so repository Pages paths work.

No customer messages are sent automatically. The order form prepares a draft for the customer to send in Telegram.
