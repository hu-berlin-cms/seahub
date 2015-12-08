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
        renameTemplate: _.template($('#group-rename-tmpl').html()),

        initialize: function(options) {
            this.groupView = options.groupView;
            this.group_id = this.groupView.group_id;
            this.sideNavView = options.sideNavView;

            this.render();
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        },

        events: {
            'click .rename-group': 'renameGroup',
            'click .close-admin': 'closeAdmin'
        },

        renameGroup: function() {
            var form = $(this.renameTemplate({}));
            form.modal({appendTo:'#main', autoResize:true, focus:false});
            $('#simplemodal-container').css({'width':'auto', 'height':'auto'});
            var _this = this;
            form.submit(function() {
                var new_name = $.trim($('[name="new_name"]', $(this)).val());
                if (!new_name) {
                    return false;
                }
                var submit_btn = $('[type="submit"]', form);
                Common.disableButton(submit_btn);
                $.ajax({
                    url: Common.getUrl({
                        'name': 'group_admin',
                        'group_id': _this.group_id
                    }),
                    beforeSend: Common.prepareCSRFToken,
                    type: 'PUT',
                    cache: false,
                    data: {
                        'operation': 'rename',
                        'new_group_name': new_name
                    },
                    success: function() {
                        _this.sideNavView.render();
                        _this.groupView.renderGroupTop(_this.group_id);
                        $.modal.close();
                    },
                    error: function(xhr) {
                        var error = $('.error', form);
                        var err_msg;
                        if (xhr.responseText) {
                            err_msg = $.parseJSON(xhr.responseText).error_msg;
                        } else {
                            err_msg = gettext("Please check the network.");
                        }
                        error.html(err_msg).show();
                        Common.enableButton(submit_btn);
                    }
                });
                return false;
            });
            return false;
        },

        closeAdmin: function() {
            this.$el.remove();
        }

    });

    return GroupAdminView;
});
