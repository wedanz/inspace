# INSPACE STUDIO — static site (WordPress-ready)

Plain HTML/CSS/JS. No build step, no framework, no jQuery dependency.

## Files

    index.html                  Home / landing
    projects.html               Projects index (filter + pagination)
    journal.html                Journal index (pagination)
    project-casa-ombra.html     Project detail (before/after slider)
    journal-casa-ombra.html     Journal post (gallery + sidebar)
    about.html                  About us
    assets/site.css             All styles (tokens, layout, hover states)
    assets/site.js              All behaviour (menu, carousel, slider, filter, pagination)
    assets/*.png                Placeholder imagery — replace with real photography

## Option A — quickest: upload as static pages

1. Upload the whole `wp-export` folder to the server (e.g. `/public_html/site/`).
2. Open `https://yourdomain.com/site/index.html`. Nothing else required.

## Option B — proper WordPress theme pages

1. In your child theme, enqueue the two asset files:

       function ini_assets() {
         wp_enqueue_style( 'ini-site', get_stylesheet_directory_uri() . '/assets/site.css', array(), '1.0' );
         wp_enqueue_script( 'ini-site', get_stylesheet_directory_uri() . '/assets/site.js', array(), '1.0', true );
       }
       add_action( 'wp_enqueue_scripts', 'ini_assets' );

2. Copy `assets/site.css`, `assets/site.js` and the images into the child theme's `assets/` folder.
3. For each page, create a page template (e.g. `page-projects.php`) and paste the markup from inside `<body>` between `get_header()` and `get_footer()`.
4. Replace image paths `assets/xxx.png` with `<?php echo get_stylesheet_directory_uri(); ?>/assets/xxx.png` or with WordPress media-library URLs.
5. Replace the internal links (`projects.html`, `journal.html`, …) with `<?php echo get_permalink( ID ); ?>` or plain `/projects/`, `/journal/` slugs.

## Making the Journal a real blog

The journal cards are ordinary `<a>` elements. In a WP loop:

    <?php while ( have_posts() ) : the_post(); ?>
      <!-- paste one journal card here, swapping in the_permalink(), the_title(),
           get_the_date(), the_excerpt() and the featured image -->
    <?php endwhile; ?>

Pagination: keep the existing `.wp-pager` markup for client-side paging, or delete it and use
`the_posts_pagination()` — `assets/site.js` simply does nothing if `.wp-pager` is absent.

## Notes

- Interactions are bound by `data-action` attributes, so nothing breaks if markup is re-ordered or a
  section is removed.
- Project filtering uses `data-cat` on each card; add cards with the same attribute and they join the filter.
- Google Maps embeds are plain `<iframe>` tags — swap the `q=` query for your real addresses.
- Images are placeholders. Replace at the same aspect ratio and no CSS changes are needed.
- The screen-capture / zoom guard is included (`assets/site.js`, bottom): it locks pinch-zoom, blocks
  ctrl+wheel zoom, right-click and print, and covers the page with the black "INSPACE STUDIO" panel on
  PrintScreen / tab-switch. To drop it for SEO or accessibility reasons, delete that one block —
  nothing else depends on it.
