define([
    'jquery',
    'underscore',
    'backbone',
    'common',
    'app/views/group-manage-members'
], function($, _, Backbone, Common, ManageMembersView) {
    'use strict';

    var View = Backbone.View.extend({
        el: '#group-settings',

        template: _.template($('#group-settings-tmpl').html()),
        renameTemplate: _.template($('#group-rename-form-tmpl').html()),
        transferTemplate: _.template($('#group-transfer-form-tmpl').html()),
        importMembersTemplate: _.template($('#group-import-members-form-tmpl').html()),

        initialize: function(options) {
            this.groupView = options.groupView;

            // group basic info
            this.group = {};

            this.$listContainer = $('#group-setting-con');

            var _this = this;
            $(window).resize(function() {
                _this.setConMaxHeight();
            });
            $(document).click(function(e) {
                var target = e.target || event.srcElement;
                var $popup = _this.$el,
                    $popup_switch = $('#group-settings-icon');

                if ($('#group-settings:visible').length &&
                    !$popup.is(target) &&
                    !$popup.find('*').is(target) &&
                    !$popup_switch.is(target)) {
                    _this.hide();
                }
            });
        },

        events: {
            'click .close': 'hide',
            'mouseenter .group-setting-item': 'highlightItem',
            'mouseleave .group-setting-item': 'rmHighlightItem',
            'click .group-setting-item': 'manageGroup'
        },

        render: function() {
            this.$listContainer.hide();

            // the user's role in this group
            this.is_owner = false;
            this.is_admin = false;

            if (app.pageOptions.username == this.group.owner) {
                this.is_owner = true;
            } else if ($.inArray(app.pageOptions.username, this.group.admins) != -1) {
                this.is_admin = true;
            }
            this.$listContainer.html(this.template({
                'is_owner': this.is_owner,
                'is_admin': this.is_admin,
                'wiki_enabled': this.group.wiki_enabled
            })).show();
        },

        // set max-height for '.popover-con'
        setConMaxHeight: function() {
            this.$('.popover-con').css({'max-height': $(window).height() - this.$el.offset().top - this.$('.popover-hd').outerHeight(true) - 2}); // 2: top, bottom border width of $el
        },

        show: function(options) {
            this.group = options.group;
            this.$el.show();
            this.render();
            this.setConMaxHeight();
        },

        hide: function() {
            this.$el.hide();
        },

        highlightItem: function(e) {
            $(e.currentTarget).addClass('hl');
        },

        rmHighlightItem: function(e) {
            $(e.currentTarget).removeClass('hl');
        },

        manageGroup: function(e) {
            switch($(e.currentTarget).data('op')) {
                case 'rename':
                    this.rename();
                    break;
                case 'transfer':
                    this.transfer();
                    break;
                case 'add-wiki':
                    this.toggleWiki('on');
                    break;
                case 'remove-wiki':
                    this.toggleWiki('off');
                    break;
                case 'import-members':
                    this.importMembers();
                    break;
                case 'manage-members':
                    this.manageMembers();
                    break;
                case 'dismiss':
                    this.dismiss();
                    break;
                case 'leave':
                    this.leave();
                    break;
            }
        },

        rename: function() {
            var _this = this;

            var $form = $(this.renameTemplate());
            $form.modal({focus:false});
            $('#simplemodal-container').css({'width':'auto', 'height':'auto'});

            $form.submit(function() {
                var new_name = $.trim($('[name="new_name"]', $(this)).val());
                if (!new_name || new_name == _this.group.name) {
                    return false;
                }
                var $submitBtn = $('[type="submit"]', $(this));
                Common.disableButton($submitBtn);
                $.ajax({
                    url: Common.getUrl({
                        'name': 'group',
                        'group_id': _this.group.id
                    }),
                    type: 'put',
                    dataType: 'json',
                    beforeSend: Common.prepareCSRFToken,
                    data: {
                        'name': new_name
                    },
                    success: function() {
                        $.modal.close();
                        app.ui.sideNavView.updateGroups();
                        _this.groupView.renderGroupTop();
                    },
                    error: function(xhr) {
                        var error_msg;
                        if (xhr.responseText) {
                            error_msg = $.parseJSON(xhr.responseText).error_msg;
                        } else {
                            error_msg = gettext("Failed. Please check the network.");
                        }
                        $('.error', $form).html(error_msg).show();
                        Common.enableButton($submitBtn);
                    }
                });
                return false;
            });
        },

        transfer: function() {
            var _this = this;

            var $form = $(this.transferTemplate());
            $form.modal({focus:false});
            $('#simplemodal-container').css({'width':'auto', 'height':'auto'});

            $('[name="email"]', $form).select2($.extend(
                Common.contactInputOptionsForSelect2(), {
                width: '268px',
                maximumSelectionSize: 1,
                placeholder: gettext("Search user or enter email and press Enter"), // to override 'placeholder' returned by `Common.conta...`
                formatSelectionTooBig: gettext("You cannot select any more choices")
            }));

            $form.submit(function() {
                var email = $.trim($('[name="email"]', $(this)).val());
                if (!email) {
                    return false;
                }
                if (email == _this.group.owner) {
                    return false;
                }

                var $submitBtn = $('[type="submit"]', $(this));
                Common.disableButton($submitBtn);
                $.ajax({
                    url: Common.getUrl({
                        'name': 'group',
                        'group_id': _this.group.id
                    }),
                    type: 'put',
                    dataType: 'json',
                    beforeSend: Common.prepareCSRFToken,
                    data: {
                        'owner': email
                    },
                    success: function() {
                        // after the transfer, the former owner becomes a common admin of the group.
                        $.modal.close();
                    },
                    error: function(xhr) {
                        var error_msg;
                        if (xhr.responseText) {
                            error_msg = $.parseJSON(xhr.responseText).error_msg;
                        } else {
                            error_msg = gettext("Failed. Please check the network.");
                        }
                        $('.error', $form).html(error_msg).show();
                        Common.enableButton($submitBtn);
                    }
                });
                return false;
            });
        },

        toggleWiki: function(status) {
            var _this = this;
            var wiki_enabled;

            if (status == 'on') {
                wiki_enabled = 'true';
            } else {
                wiki_enabled = 'false';
            }

            $.ajax({
                url: Common.getUrl({
                    'name': 'group',
                    'group_id': _this.group.id
                }),
                type: 'put',
                dataType: 'json',
                beforeSend: Common.prepareCSRFToken,
                data: {
                    'wiki_enabled': wiki_enabled
                },
                success: function() {
                    _this.hide();
                    _this.groupView.renderGroupTop();
                },
                error: function(xhr) {
                    var error_msg;
                    if (xhr.responseText) {
                        error_msg = $.parseJSON(xhr.responseText).error_msg;
                    } else {
                        error_msg = gettext("Failed. Please check the network.");
                    }
                    Common.feedback(error_msg, 'error');
                    _this.hide();
                }
            });
        },

        importMembers: function() {
            var _this = this;
            var $form = $(this.importMembersTemplate());
            $form.modal({focus:false});
            $('#simplemodal-container').css({'width':'auto', 'height':'auto'});

            $form.submit(function() {
                var $fileInput = $('[name=file]', $form)[0];
                var $error = $('.error', $form);
                if (!$fileInput.files.length) {
                    $error.html(gettext("Please choose a CSV file")).removeClass('hide');
                    return false;
                }

                var $submitBtn = $('[type="submit"]', $(this));
                Common.disableButton($submitBtn);

                var file = $fileInput.files[0];
                var formData = new FormData();
                formData.append('file', file);
                $.ajax({
                    url: Common.getUrl({
                        'name': 'group_import_members',
                        'group_id': _this.group.id
                    }),
                    type: 'post',
                    dataType: 'json',
                    data: formData,
                    processData: false,  // tell jQuery not to process the data
                    contentType: false, // tell jQuery not to set contentType
                    beforeSend: Common.prepareCSRFToken,
                    success: function(data) {
                        if (data.failed.length > 0) {
                            var err_msg = '';
                            $(data.failed).each(function(index, item) {
                                err_msg += item.email + ': ' + item.error_msg + '<br />';
                            });
                            $error.html(err_msg).removeClass('hide');
                            Common.enableButton($submitBtn);
                        } else {
                            $.modal.close();
                            Common.feedback(gettext("Successfully imported."), 'success');
                        }
                    },
                    error: function(xhr) {
                        var error_msg;
                        if (xhr.responseText) {
                            error_msg = $.parseJSON(xhr.responseText).error;
                        } else {
                            error_msg = gettext("Failed. Please check the network.");
                        }
                        $error.html(error_msg).removeClass('hide');
                        Common.enableButton($submitBtn);
                    }
                });
                return false;
            });
        },

        manageMembers: function() {
            new ManageMembersView({
                'group_id': this.group.id,
                'group_name': this.group.name,
                'is_owner': this.is_owner
            });
        },

        dismiss: function() {
            var _this = this;
            var title = gettext('Dismiss Group');
            var content = gettext('Really want to dismiss this group?');
            var yesCallback = function () {
                $.ajax({
                    url: Common.getUrl({
                        'name': 'group',
                        'group_id': _this.group.id
                    }),
                    type: 'delete',
                    dataType: 'json',
                    beforeSend: Common.prepareCSRFToken,
                    success: function() {
                        app.ui.sideNavView.updateGroups();
                        app.router.navigate('groups/', {trigger: true});
                    },
                    error: function(xhr) {
                        var error_msg;
                        if (xhr.responseText) {
                            error_msg = $.parseJSON(xhr.responseText).error_msg;
                        } else {
                            error_msg = gettext("Failed. Please check the network.");
                        }
                        Common.feedback(error_msg, 'error');
                    },
                    complete: function() {
                        $.modal.close();
                    }
                });
            };
            Common.showConfirm(title, content, yesCallback);
        },

        leave: function() {
            var _this = this;
            var title = gettext('Quit Group');
            var content = gettext('Are you sure you want to quit this group?');
            var yesCallback = function () {
                $.ajax({
                    url: Common.getUrl({
                        'name': 'group_member',
                        'group_id': _this.group.id,
                        'email': encodeURIComponent(app.pageOptions.username),
                    }),
                    type: 'delete',
                    dataType: 'json',
                    beforeSend: Common.prepareCSRFToken,
                    success: function() {
                        app.ui.sideNavView.updateGroups();
                        app.router.navigate('groups/', {trigger: true});
                    },
                    error: function(xhr) {
                        var err_msg;
                        if (xhr.responseText) {
                            err_msg = $.parseJSON(xhr.responseText).error_msg;
                        } else {
                            err_msg = gettext("Failed. Please check the network.");
                        }
                        Common.feedback(error_msg, 'error');
                    },
                    complete: function() {
                        $.modal.close();
                    }
                });
            };
            Common.showConfirm(title, content, yesCallback);
        }

    });

    return View;
});
