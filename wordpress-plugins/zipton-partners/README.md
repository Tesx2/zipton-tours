# Zipton Partners

WordPress plugin for managing Zipton Tours partner organizations in a headless setup.

## Features

- Partners custom post type exposed at `/wp-json/wp/v2/partners?_embed`
- Company logo through the Featured Image panel
- Category, short description, website, partner since, featured partner, display order, and social fields
- REST API meta fields plus a grouped `partner_meta` object
- Admin columns and display-order sorting

## Installation

1. Upload the `zipton-partners` folder to `wp-content/plugins/`.
2. Activate **Zipton Partners** in WordPress.
3. Add partners from `Partners > Add Partner`.
4. Set a company logo as the Featured Image.

## Frontend Endpoint

The Netlify frontend reads partners through:

```text
/.netlify/functions/wp-partners
```
