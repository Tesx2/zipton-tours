<?php
/**
 * Plugin Name: Zipton Partners
 * Plugin URI: https://ziptontour.netlify.app
 * Description: Partner company profiles for the Zipton Tours headless WordPress and Netlify frontend.
 * Version: 1.0.0
 * Author: Zipton Tours
 * Author URI: https://ziptontour.netlify.app
 * License: GPL-2.0-or-later
 * Text Domain: zipton-partners
 */

if (!defined('ABSPATH')) {
    exit;
}

define('ZIPTON_PARTNERS_VERSION', '1.0.0');
define('ZIPTON_PARTNERS_FILE', __FILE__);
define('ZIPTON_PARTNERS_DIR', plugin_dir_path(__FILE__));
define('ZIPTON_PARTNERS_URL', plugin_dir_url(__FILE__));

final class Zipton_Partners_Plugin {
    const POST_TYPE = 'partners';
    const NONCE_ACTION = 'zipton_save_partner';
    const NONCE_NAME = 'zipton_partner_nonce';

    public function __construct() {
        add_action('init', array($this, 'register_post_type'));
        add_action('init', array($this, 'register_rest_meta'));
        add_action('add_meta_boxes', array($this, 'add_meta_boxes'));
        add_action('save_post_' . self::POST_TYPE, array($this, 'save_partner_meta'));
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
                'name' => __('Partners', 'zipton-partners'),
                'singular_name' => __('Partner', 'zipton-partners'),
                'menu_name' => __('Partners', 'zipton-partners'),
                'add_new_item' => __('Add Partner', 'zipton-partners'),
                'edit_item' => __('Edit Partner', 'zipton-partners'),
                'new_item' => __('New Partner', 'zipton-partners'),
                'view_item' => __('View Partner', 'zipton-partners'),
                'search_items' => __('Search Partners', 'zipton-partners'),
                'not_found' => __('No partners found.', 'zipton-partners'),
            ),
            'public' => true,
            'show_in_rest' => true,
            'rest_base' => 'partners',
            'menu_icon' => 'dashicons-networking',
            'supports' => array('title', 'thumbnail', 'page-attributes'),
            'has_archive' => false,
            'rewrite' => array('slug' => 'partners'),
        ));
    }

    public function fields() {
        return array(
            'category' => array(
                'label' => __('Category', 'zipton-partners'),
                'type' => 'select',
                'icon' => 'dashicons-category',
                'sanitize' => 'sanitize_text_field',
                'options' => array('Transportation', 'Accommodation', 'Creative', 'Tourism', 'Community', 'Conservation', 'Sponsor', 'Technology', 'Other'),
            ),
            'short_description' => array(
                'label' => __('Short Description', 'zipton-partners'),
                'type' => 'textarea',
                'icon' => 'dashicons-edit-page',
                'sanitize' => 'sanitize_textarea_field',
            ),
            'website_url' => array(
                'label' => __('Website URL', 'zipton-partners'),
                'type' => 'url',
                'icon' => 'dashicons-admin-site-alt3',
                'sanitize' => 'esc_url_raw',
            ),
            'partner_since' => array(
                'label' => __('Partner Since', 'zipton-partners'),
                'type' => 'text',
                'icon' => 'dashicons-calendar-alt',
                'sanitize' => 'sanitize_text_field',
            ),
            'featured_partner' => array(
                'label' => __('Featured Partner', 'zipton-partners'),
                'type' => 'checkbox',
                'icon' => 'dashicons-star-filled',
                'sanitize' => 'absint',
            ),
            'facebook_url' => array(
                'label' => __('Facebook URL', 'zipton-partners'),
                'type' => 'url',
                'icon' => 'dashicons-facebook-alt',
                'sanitize' => 'esc_url_raw',
            ),
            'instagram_url' => array(
                'label' => __('Instagram URL', 'zipton-partners'),
                'type' => 'url',
                'icon' => 'dashicons-instagram',
                'sanitize' => 'esc_url_raw',
            ),
            'linkedin_url' => array(
                'label' => __('LinkedIn URL', 'zipton-partners'),
                'type' => 'url',
                'icon' => 'dashicons-linkedin',
                'sanitize' => 'esc_url_raw',
            ),
            'x_url' => array(
                'label' => __('X URL', 'zipton-partners'),
                'type' => 'url',
                'icon' => 'dashicons-twitter',
                'sanitize' => 'esc_url_raw',
            ),
            'display_order' => array(
                'label' => __('Display Order', 'zipton-partners'),
                'type' => 'number',
                'icon' => 'dashicons-sort',
                'sanitize' => 'absint',
            ),
        );
    }

    public function register_rest_meta() {
        foreach ($this->fields() as $key => $field) {
            register_post_meta(self::POST_TYPE, $key, array(
                'single' => true,
                'type' => in_array($field['type'], array('number', 'checkbox'), true) ? 'integer' : 'string',
                'show_in_rest' => true,
                'sanitize_callback' => $field['sanitize'],
                'auth_callback' => '__return_true',
            ));
        }
    }

    public function register_rest_fields() {
        register_rest_field(self::POST_TYPE, 'partner_meta', array(
            'get_callback' => function ($post) {
                $post_id = isset($post['id']) ? absint($post['id']) : 0;
                $meta = array();

                foreach ($this->fields() as $key => $field) {
                    $value = get_post_meta($post_id, $key, true);
                    $meta[$key] = in_array($key, array('display_order', 'featured_partner'), true) ? absint($value) : $value;
                }

                $meta['display_order'] = $meta['display_order'] ?: absint(get_post_field('menu_order', $post_id));
                return $meta;
            },
            'schema' => array(
                'description' => __('Partner fields for the headless frontend.', 'zipton-partners'),
                'type' => 'object',
                'context' => array('view', 'edit'),
            ),
        ));
    }

    public function add_meta_boxes() {
        add_meta_box(
            'zipton_partner_profile',
            __('Partner Details', 'zipton-partners'),
            array($this, 'render_partner_box'),
            self::POST_TYPE,
            'normal',
            'high'
        );
    }

    public function render_partner_box($post) {
        wp_nonce_field(self::NONCE_ACTION, self::NONCE_NAME);

        echo '<div class="zipton-partners-panel">';
        echo '<div class="zipton-partners-intro">';
        echo '<h2>' . esc_html__('Partner profile', 'zipton-partners') . '</h2>';
        echo '<p>' . esc_html__('These fields power the About page partner cards on the Netlify frontend.', 'zipton-partners') . '</p>';
        echo '</div>';

        foreach ($this->fields() as $key => $field) {
            $value = get_post_meta($post->ID, $key, true);
            $input_id = 'zipton_' . $key;

            echo '<div class="zipton-partners-field zipton-field-' . esc_attr($key) . '">';
            echo '<label for="' . esc_attr($input_id) . '">';
            echo '<span class="dashicons ' . esc_attr($field['icon']) . '"></span>';
            echo '<span>' . esc_html($field['label']) . '</span>';
            echo '</label>';

            if ($field['type'] === 'textarea') {
                echo '<textarea id="' . esc_attr($input_id) . '" name="' . esc_attr($key) . '" rows="4">' . esc_textarea($value) . '</textarea>';
            } elseif ($field['type'] === 'select') {
                echo '<select id="' . esc_attr($input_id) . '" name="' . esc_attr($key) . '">';
                echo '<option value="">' . esc_html__('Choose category', 'zipton-partners') . '</option>';
                foreach ($field['options'] as $option) {
                    echo '<option value="' . esc_attr($option) . '"' . selected($value, $option, false) . '>' . esc_html($option) . '</option>';
                }
                echo '</select>';
            } elseif ($field['type'] === 'checkbox') {
                echo '<input type="hidden" name="' . esc_attr($key) . '" value="0">';
                echo '<input id="' . esc_attr($input_id) . '" type="checkbox" name="' . esc_attr($key) . '" value="1"' . checked(absint($value), 1, false) . '>';
            } else {
                $step = $field['type'] === 'number' ? ' min="0" step="1"' : '';
                echo '<input id="' . esc_attr($input_id) . '" type="' . esc_attr($field['type']) . '" name="' . esc_attr($key) . '" value="' . esc_attr($value) . '"' . $step . '>';
            }

            echo '</div>';
        }

        echo '<div class="zipton-partners-note">';
        echo '<span class="dashicons dashicons-format-image"></span>';
        echo '<p>' . esc_html__('Use the Featured Image panel for the company logo. Display Order controls card order; lower numbers appear first.', 'zipton-partners') . '</p>';
        echo '</div>';
        echo '</div>';
    }

    public function save_partner_meta($post_id) {
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

        remove_action('save_post_' . self::POST_TYPE, array($this, 'save_partner_meta'));
        wp_update_post(array(
            'ID' => $post_id,
            'menu_order' => $display_order,
        ));
        add_action('save_post_' . self::POST_TYPE, array($this, 'save_partner_meta'));
    }

    public function enqueue_admin_assets($hook) {
        $screen = get_current_screen();
        if (!$screen || $screen->post_type !== self::POST_TYPE) {
            return;
        }

        wp_enqueue_media();
        wp_enqueue_style(
            'zipton-partners-admin',
            ZIPTON_PARTNERS_URL . 'assets/admin.css',
            array(),
            ZIPTON_PARTNERS_VERSION
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
            $('#postimagediv .hndle, #postimagediv h2').text('Company Logo');
            $('#set-post-thumbnail').text('Set company logo');
            $('#remove-post-thumbnail').text('Remove company logo');
          });
        </script>
        <?php
    }

    public function manage_columns($columns) {
        $new_columns = array();

        foreach ($columns as $key => $label) {
            $new_columns[$key] = $label;

            if ($key === 'title') {
                $new_columns['zipton_category'] = __('Category', 'zipton-partners');
                $new_columns['zipton_featured'] = __('Featured', 'zipton-partners');
                $new_columns['zipton_display_order'] = __('Display Order', 'zipton-partners');
            }
        }

        return $new_columns;
    }

    public function render_columns($column, $post_id) {
        if ($column === 'zipton_category') {
            echo esc_html(get_post_meta($post_id, 'category', true));
        }

        if ($column === 'zipton_featured') {
            echo absint(get_post_meta($post_id, 'featured_partner', true)) ? esc_html__('Yes', 'zipton-partners') : esc_html__('No', 'zipton-partners');
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

register_activation_hook(__FILE__, array('Zipton_Partners_Plugin', 'activate'));
register_deactivation_hook(__FILE__, array('Zipton_Partners_Plugin', 'deactivate'));

new Zipton_Partners_Plugin();
