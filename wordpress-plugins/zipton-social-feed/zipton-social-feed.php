<?php
/**
 * Plugin Name: Zipton Social Feed
 * Description: Adds a Social Feed custom post type for the Zipton Tours For You page.
 * Version: 1.0.0
 * Author: Zipton Tours
 */

if (!defined('ABSPATH')) {
    exit;
}

function zipton_social_feed_register_post_type() {
    $labels = array(
        'name' => 'Social Feed',
        'singular_name' => 'Social Feed Item',
        'add_new_item' => 'Add New Social Feed Item',
        'edit_item' => 'Edit Social Feed Item',
        'menu_name' => 'Social Feed',
    );

    register_post_type('social_feed', array(
        'labels' => $labels,
        'public' => true,
        'show_in_rest' => true,
        'rest_base' => 'social-feed',
        'menu_icon' => 'dashicons-share',
        'supports' => array('title', 'thumbnail', 'excerpt', 'editor', 'custom-fields', 'page-attributes'),
        'taxonomies' => array('category'),
        'has_archive' => false,
        'rewrite' => array('slug' => 'social-feed'),
    ));
}
add_action('init', 'zipton_social_feed_register_post_type');

function zipton_social_feed_register_meta() {
    $fields = array(
        'platform' => array('type' => 'string', 'default' => 'Facebook'),
        'short_description' => array('type' => 'string', 'default' => ''),
        'external_url' => array('type' => 'string', 'default' => ''),
        'featured_pinned' => array('type' => 'boolean', 'default' => false),
        'display_order' => array('type' => 'integer', 'default' => 0),
    );

    foreach ($fields as $key => $args) {
        register_post_meta('social_feed', $key, array(
            'type' => $args['type'],
            'single' => true,
            'default' => $args['default'],
            'show_in_rest' => true,
            'auth_callback' => '__return_true',
            'sanitize_callback' => $args['type'] === 'boolean' ? 'rest_sanitize_boolean' : null,
        ));
    }
}
add_action('init', 'zipton_social_feed_register_meta');

function zipton_social_feed_add_meta_box() {
    add_meta_box(
        'zipton_social_feed_details',
        'Social Feed Details',
        'zipton_social_feed_render_meta_box',
        'social_feed',
        'normal',
        'high'
    );
}
add_action('add_meta_boxes', 'zipton_social_feed_add_meta_box');

function zipton_social_feed_render_meta_box($post) {
    wp_nonce_field('zipton_social_feed_save', 'zipton_social_feed_nonce');

    $platform = get_post_meta($post->ID, 'platform', true);
    $short_description = get_post_meta($post->ID, 'short_description', true);
    $external_url = get_post_meta($post->ID, 'external_url', true);
    $featured_pinned = (bool) get_post_meta($post->ID, 'featured_pinned', true);
    $display_order = get_post_meta($post->ID, 'display_order', true);
    $platforms = array('Facebook', 'Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn');
    ?>
    <p>
        <label for="zipton_platform"><strong>Platform</strong></label><br>
        <select id="zipton_platform" name="zipton_platform">
            <?php foreach ($platforms as $item) : ?>
                <option value="<?php echo esc_attr($item); ?>" <?php selected($platform ?: 'Facebook', $item); ?>><?php echo esc_html($item); ?></option>
            <?php endforeach; ?>
        </select>
    </p>
    <p>
        <label for="zipton_short_description"><strong>Short Description</strong></label><br>
        <textarea id="zipton_short_description" name="zipton_short_description" rows="4" style="width:100%;"><?php echo esc_textarea($short_description); ?></textarea>
    </p>
    <p>
        <label for="zipton_external_url"><strong>External URL</strong></label><br>
        <input id="zipton_external_url" name="zipton_external_url" type="url" value="<?php echo esc_attr($external_url); ?>" style="width:100%;">
    </p>
    <p>
        <label>
            <input name="zipton_featured_pinned" type="checkbox" value="1" <?php checked($featured_pinned); ?>>
            Featured / Pinned
        </label>
    </p>
    <p>
        <label for="zipton_display_order"><strong>Display Order</strong></label><br>
        <input id="zipton_display_order" name="zipton_display_order" type="number" value="<?php echo esc_attr($display_order ?: 0); ?>">
    </p>
    <?php
}

function zipton_social_feed_save_meta($post_id) {
    if (!isset($_POST['zipton_social_feed_nonce']) || !wp_verify_nonce($_POST['zipton_social_feed_nonce'], 'zipton_social_feed_save')) {
        return;
    }

    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }

    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    update_post_meta($post_id, 'platform', sanitize_text_field($_POST['zipton_platform'] ?? 'Facebook'));
    update_post_meta($post_id, 'short_description', sanitize_textarea_field($_POST['zipton_short_description'] ?? ''));
    update_post_meta($post_id, 'external_url', esc_url_raw($_POST['zipton_external_url'] ?? ''));
    update_post_meta($post_id, 'featured_pinned', isset($_POST['zipton_featured_pinned']));
    update_post_meta($post_id, 'display_order', absint($_POST['zipton_display_order'] ?? 0));
}
add_action('save_post_social_feed', 'zipton_social_feed_save_meta');

function zipton_social_feed_rest_fields() {
    register_rest_field('social_feed', 'social_feed_meta', array(
        'get_callback' => function ($post) {
            return array(
                'platform' => get_post_meta($post['id'], 'platform', true),
                'short_description' => get_post_meta($post['id'], 'short_description', true),
                'external_url' => get_post_meta($post['id'], 'external_url', true),
                'featured_pinned' => (bool) get_post_meta($post['id'], 'featured_pinned', true),
                'display_order' => (int) get_post_meta($post['id'], 'display_order', true),
            );
        },
        'schema' => array(
            'description' => 'Zipton Social Feed fields.',
            'type' => 'object',
        ),
    ));
}
add_action('rest_api_init', 'zipton_social_feed_rest_fields');
