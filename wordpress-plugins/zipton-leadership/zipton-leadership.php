<?php
/**
 * Plugin Name: Zipton Leadership
 * Plugin URI: https://ziptontour.netlify.app
 * Description: Professional Leadership profiles for the Zipton Tours headless WordPress and Netlify frontend.
 * Version: 1.1.0
 * Author: Zipton Tours
 * Author URI: https://ziptontour.netlify.app
 * License: GPL-2.0-or-later
 * Text Domain: zipton-leadership
 */

if (!defined('ABSPATH')) {
    exit;
}

define('ZIPTON_LEADERSHIP_VERSION', '1.1.0');
define('ZIPTON_LEADERSHIP_FILE', __FILE__);
define('ZIPTON_LEADERSHIP_DIR', plugin_dir_path(__FILE__));
define('ZIPTON_LEADERSHIP_URL', plugin_dir_url(__FILE__));

final class Zipton_Leadership_Plugin {
    const POST_TYPE = 'leadership';
    const NONCE_ACTION = 'zipton_save_leadership';
    const NONCE_NAME = 'zipton_leadership_nonce';

    public function __construct() {
        add_action('init', array($this, 'register_post_type'));
        add_action('init', array($this, 'register_rest_meta'));
        add_action('add_meta_boxes', array($this, 'add_meta_boxes'));
        add_action('save_post_' . self::POST_TYPE, array($this, 'save_profile_meta'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
        add_action('admin_head-post.php', array($this, 'rename_featured_image_box'));
        add_action('admin_head-post-new.php', array($this, 'rename_featured_image_box'));
        add_filter('manage_' . self::POST_TYPE . '_posts_columns', array($this, 'manage_columns'));
        add_action('manage_' . self::POST_TYPE . '_posts_custom_column', array($this, 'render_columns'), 10, 2);
        add_filter('manage_edit-' . self::POST_TYPE . '_sortable_columns', array($this, 'sortable_columns'));
        add_action('pre_get_posts', array($this, 'order_admin_list'));
        add_action('rest_api_init', array($this, 'register_rest_fields'));
    }

    public static function activate() {
        $plugin = new self();
        $plugin->register_post_type();
        flush_rewrite_rules();
    }

    public static function deactivate() {
        flush_rewrite_rules();
    }

    public function register_post_type() {
        register_post_type(self::POST_TYPE, array(
            'labels' => array(
                'name' => __('Leadership', 'zipton-leadership'),
                'singular_name' => __('Leadership Member', 'zipton-leadership'),
                'menu_name' => __('Leadership', 'zipton-leadership'),
                'add_new_item' => __('Add Leadership Member', 'zipton-leadership'),
                'edit_item' => __('Edit Leadership Member', 'zipton-leadership'),
                'new_item' => __('New Leadership Member', 'zipton-leadership'),
                'view_item' => __('View Leadership Member', 'zipton-leadership'),
                'search_items' => __('Search Leadership', 'zipton-leadership'),
                'not_found' => __('No leadership members found.', 'zipton-leadership'),
            ),
            'public' => true,
            'show_in_rest' => true,
            'rest_base' => 'leadership',
            'menu_icon' => 'dashicons-groups',
            'supports' => array('title', 'thumbnail', 'page-attributes'),
            'has_archive' => false,
            'rewrite' => array('slug' => 'leadership'),
        ));
    }

    public function fields() {
        return array(
            'position' => array(
                'label' => __('Position / Job Title', 'zipton-leadership'),
                'type' => 'text',
                'icon' => 'dashicons-businessperson',
                'sanitize' => 'sanitize_text_field',
            ),
            'biography' => array(
                'label' => __('Biography', 'zipton-leadership'),
                'type' => 'textarea',
                'icon' => 'dashicons-edit-page',
                'sanitize' => 'sanitize_textarea_field',
            ),
            'email' => array(
                'label' => __('Email', 'zipton-leadership'),
                'type' => 'email',
                'icon' => 'dashicons-email-alt',
                'sanitize' => 'sanitize_email',
            ),
            'website_url' => array(
                'label' => __('Website', 'zipton-leadership'),
                'type' => 'url',
                'icon' => 'dashicons-admin-site-alt3',
                'sanitize' => 'esc_url_raw',
            ),
            'facebook_url' => array(
                'label' => __('Facebook URL', 'zipton-leadership'),
                'type' => 'url',
                'icon' => 'dashicons-facebook-alt',
                'sanitize' => 'esc_url_raw',
            ),
            'instagram_url' => array(
                'label' => __('Instagram URL', 'zipton-leadership'),
                'type' => 'url',
                'icon' => 'dashicons-instagram',
                'sanitize' => 'esc_url_raw',
            ),
            'linkedin_url' => array(
                'label' => __('LinkedIn URL', 'zipton-leadership'),
                'type' => 'url',
                'icon' => 'dashicons-linkedin',
                'sanitize' => 'esc_url_raw',
            ),
            'tiktok_url' => array(
                'label' => __('TikTok URL', 'zipton-leadership'),
                'type' => 'url',
                'icon' => 'dashicons-video-alt3',
                'sanitize' => 'esc_url_raw',
            ),
            'x_url' => array(
                'label' => __('X (Twitter) URL', 'zipton-leadership'),
                'type' => 'url',
                'icon' => 'dashicons-twitter',
                'sanitize' => 'esc_url_raw',
            ),
            'display_order' => array(
                'label' => __('Display Order', 'zipton-leadership'),
                'type' => 'number',
                'icon' => 'dashicons-star-filled',
                'sanitize' => 'absint',
            ),
        );
    }

    public function register_rest_meta() {
        foreach ($this->fields() as $key => $field) {
            register_post_meta(self::POST_TYPE, $key, array(
                'single' => true,
                'type' => $field['type'] === 'number' ? 'integer' : 'string',
                'show_in_rest' => true,
                'sanitize_callback' => $field['sanitize'],
                'auth_callback' => '__return_true',
            ));
        }
    }

    public function register_rest_fields() {
        register_rest_field(self::POST_TYPE, 'leadership_meta', array(
            'get_callback' => function ($post) {
                $post_id = isset($post['id']) ? absint($post['id']) : 0;
                $meta = array();

                foreach ($this->fields() as $key => $field) {
                    $value = get_post_meta($post_id, $key, true);
                    $meta[$key] = $key === 'display_order' ? absint($value) : $value;
                }

                $meta['display_order'] = $meta['display_order'] ?: absint(get_post_field('menu_order', $post_id));
                return $meta;
            },
            'schema' => array(
                'description' => __('Leadership profile fields for the headless frontend.', 'zipton-leadership'),
                'type' => 'object',
                'context' => array('view', 'edit'),
            ),
        ));
    }

    public function add_meta_boxes() {
        add_meta_box(
            'zipton_leadership_profile',
            __('Leadership Profile', 'zipton-leadership'),
            array($this, 'render_profile_box'),
            self::POST_TYPE,
            'normal',
            'high'
        );
    }

    public function render_profile_box($post) {
        wp_nonce_field(self::NONCE_ACTION, self::NONCE_NAME);

        echo '<div class="zipton-leadership-panel">';
        echo '<div class="zipton-leadership-intro">';
        echo '<h2>' . esc_html__('Profile details', 'zipton-leadership') . '</h2>';
        echo '<p>' . esc_html__('These fields power the About page leadership cards on the Netlify frontend.', 'zipton-leadership') . '</p>';
        echo '</div>';

        foreach ($this->fields() as $key => $field) {
            $value = get_post_meta($post->ID, $key, true);
            $input_id = 'zipton_' . $key;

            echo '<div class="zipton-leadership-field zipton-field-' . esc_attr($key) . '">';
            echo '<label for="' . esc_attr($input_id) . '">';
            echo '<span class="dashicons ' . esc_attr($field['icon']) . '"></span>';
            echo '<span>' . esc_html($field['label']) . '</span>';
            echo '</label>';

            if ($field['type'] === 'textarea') {
                echo '<textarea id="' . esc_attr($input_id) . '" name="' . esc_attr($key) . '" rows="5">' . esc_textarea($value) . '</textarea>';
            } else {
                $step = $field['type'] === 'number' ? ' min="0" step="1"' : '';
                echo '<input id="' . esc_attr($input_id) . '" type="' . esc_attr($field['type']) . '" name="' . esc_attr($key) . '" value="' . esc_attr($value) . '"' . $step . '>';
            }

            echo '</div>';
        }

        echo '<div class="zipton-leadership-note">';
        echo '<span class="dashicons dashicons-format-image"></span>';
        echo '<p>' . esc_html__('Use the Profile Image panel for the member photo. Display Order controls card order; lower numbers appear first.', 'zipton-leadership') . '</p>';
        echo '</div>';
        echo '</div>';
    }

    public function save_profile_meta($post_id) {
        if (!$this->can_save($post_id)) {
            return;
        }

        foreach ($this->fields() as $key => $field) {
            $raw_value = isset($_POST[$key]) ? wp_unslash($_POST[$key]) : '';
            $value = call_user_func($field['sanitize'], $raw_value);

            update_post_meta($post_id, $key, $value);

            if ($key === 'display_order') {
                $this->sync_menu_order($post_id, absint($value));
            }
        }
    }

    private function can_save($post_id) {
        if (!isset($_POST[self::NONCE_NAME]) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST[self::NONCE_NAME])), self::NONCE_ACTION)) {
            return false;
        }

        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return false;
        }

        if (wp_is_post_revision($post_id)) {
            return false;
        }

        return current_user_can('edit_post', $post_id);
    }

    private function sync_menu_order($post_id, $display_order) {
        if ((int) get_post_field('menu_order', $post_id) === $display_order) {
            return;
        }

        remove_action('save_post_' . self::POST_TYPE, array($this, 'save_profile_meta'));
        wp_update_post(array(
            'ID' => $post_id,
            'menu_order' => $display_order,
        ));
        add_action('save_post_' . self::POST_TYPE, array($this, 'save_profile_meta'));
    }

    public function enqueue_admin_assets($hook) {
        $screen = get_current_screen();
        if (!$screen || $screen->post_type !== self::POST_TYPE) {
            return;
        }

        wp_enqueue_media();
        wp_enqueue_style(
            'zipton-leadership-admin',
            ZIPTON_LEADERSHIP_URL . 'assets/admin.css',
            array(),
            ZIPTON_LEADERSHIP_VERSION
        );
        wp_enqueue_script(
            'zipton-leadership-admin',
            ZIPTON_LEADERSHIP_URL . 'assets/admin.js',
            array('jquery'),
            ZIPTON_LEADERSHIP_VERSION,
            true
        );
    }

    public function rename_featured_image_box() {
        $screen = get_current_screen();
        if (!$screen || $screen->post_type !== self::POST_TYPE) {
            return;
        }
        ?>
        <script>
          jQuery(function ($) {
            $('#postimagediv .hndle, #postimagediv h2').text('Profile Image');
            $('#set-post-thumbnail').text('Set profile image');
            $('#remove-post-thumbnail').text('Remove profile image');
          });
        </script>
        <?php
    }

    public function manage_columns($columns) {
        $new_columns = array();

        foreach ($columns as $key => $label) {
            $new_columns[$key] = $label;

            if ($key === 'title') {
                $new_columns['zipton_position'] = __('Position', 'zipton-leadership');
                $new_columns['zipton_display_order'] = __('Display Order', 'zipton-leadership');
            }
        }

        return $new_columns;
    }

    public function render_columns($column, $post_id) {
        if ($column === 'zipton_position') {
            echo esc_html(get_post_meta($post_id, 'position', true));
        }

        if ($column === 'zipton_display_order') {
            echo esc_html(get_post_meta($post_id, 'display_order', true));
        }
    }

    public function sortable_columns($columns) {
        $columns['zipton_display_order'] = 'menu_order';
        return $columns;
    }

    public function order_admin_list($query) {
        if (!is_admin() || !$query->is_main_query()) {
            return;
        }

        if ($query->get('post_type') !== self::POST_TYPE) {
            return;
        }

        if (!$query->get('orderby')) {
            $query->set('orderby', 'menu_order title');
            $query->set('order', 'ASC');
        }
    }
}

register_activation_hook(__FILE__, array('Zipton_Leadership_Plugin', 'activate'));
register_deactivation_hook(__FILE__, array('Zipton_Leadership_Plugin', 'deactivate'));

new Zipton_Leadership_Plugin();
