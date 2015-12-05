define([
    'jquery',
    'underscore',
    'backbone',
    'common'
], function($, _, Backbone, Common) {
    'use strict';

    var GroupAdminView = Backbone.View.extend({
        tagName: 'div',
        className: 'group-admin-popover',

        template: _.template($('#group-admin-tmpl').html()),

        initialize: function(options) {
            this.render();

            this.groupView = options.groupView;
            this.group_id = this.groupView.group_id;
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        },

        events: {
            'click .close-admin': 'closeAdmin'
        },

        closeAdmin: function() {
            this.$el.remove();
        }

    });

    return GroupAdminView;
});
