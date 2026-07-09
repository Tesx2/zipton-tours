# Zipton Leadership

Professional WordPress plugin for managing Zipton Tours leadership profiles in a headless setup.

## Features

- Leadership custom post type exposed at `/wp-json/wp/v2/leadership?_embed`
- Profile image through the WordPress media uploader
- Name through the post title
- Position, biography, email, website, Facebook, Instagram, LinkedIn, TikTok, X/Twitter
- Numeric display order, synced to `menu_order`
- REST API meta fields plus a grouped `leadership_meta` object
- Admin columns for position and display order
- Nonce checks, capability checks, sanitization, and URL/email validation

## Install

1. Upload the `zipton-leadership` folder to `wp-content/plugins/`.
2. Activate **Zipton Leadership** in WordPress.
3. Go to `Settings > Permalinks` and click **Save Changes**.
4. Add leadership members from `Leadership > Add Leadership Member`.

## Frontend Endpoint

```text
/wp-json/wp/v2/leadership?_embed
```

The Netlify frontend can also use:

```text
/.netlify/functions/wp-leadership
```
