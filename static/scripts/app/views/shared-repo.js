define([
    'jquery',
    'underscore',
    'backbone',
    'common',
    'app/views/widgets/hl-item-view'
], function($, _, Backbone, Common, HLItemView) {
    'use strict';

    var SharedRepoView = HLItemView.extend({
        tagName: 'tr',

        template: _.template($('#shared-repo-tmpl').html()),

        events: {
            'click .unshare-btn': 'removeShare'
        },

        initialize: function() {
            HLItemView.prototype.initialize.call(this);
        },

        removeShare: function(e) {
            var _this = this,
                success_callback = function(data) {
                    Common.feedback(gettext('Success'), 'success', Common.SUCCESS_TIMOUT);
                    _this.$el.remove();
                    _this.collection.remove(_this.model, {silent: true});
                    if (_this.collection.length == 0) {
                        $('#repos-shared-to-me table').hide();
                        $('#repos-shared-to-me .empty-tips').show();
                    };
                };

            $.ajax({
                url: Common.getUrl({name: 'ajax_repo_remove_share'}),
                type: 'POST',
                beforeSend: Common.prepareCSRFToken,
                data: {
                    'repo_id': this.model.get('id'),
                    'from': this.model.get('owner'),
                    'share_type': this.model.get('share_type')
                },
                dataType: 'json',
                success: success_callback
            });
        },

        render: function() {
            var obj = this.model.toJSON();
            var icon_size = Common.isHiDPI() ? 96 : 24;
            var icon_url = this.model.getIconUrl(icon_size);
            _.extend(obj, {
                'icon_url': icon_url,
                'icon_title': this.model.getIconTitle()
            });
            this.$el.html(this.template(obj));
            return this;
        }

    });

    return SharedRepoView;
});
