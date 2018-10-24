"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MetadataLoader = function (_TextLoader) {
  _inherits(MetadataLoader, _TextLoader);

  function MetadataLoader() {
    _classCallCheck(this, MetadataLoader);

    var _this = _possibleConstructorReturn(this, (MetadataLoader.__proto__ || Object.getPrototypeOf(MetadataLoader)).call(this));

    _.defaults(_this, SingleFileComponent);

    _this.FILENAME = "meta.yml";

    _this.SPEED_NAMES = ["low", "medium", "high", "superhigh", "instantaneous"];
    _this.RANDOM_SOURCE = "random";
    _this.SELECTED_SOURCE = "selected";
    return _this;
  }

  _createClass(MetadataLoader, [{
    key: "buildFullOptions",
    value: function buildFullOptions(context, partialMetadata) {
      return this._buildYaml(_.merge(partialMetadata, {
        name: context.getProjectName(),
        source: {
          percentage: +window.STORAGE.getItem("code-panel-percentage")
        },
        board: {
          active: context.boards.selectedInitialState + 1,
          initial_board_source: context.editor.runner.useRandomBoard ? this.RANDOM_SOURCE : this.SELECTED_SOURCE
        },
        execution_speed: {
          active: this.SPEED_NAMES[context.editor.runner.speed - 1]
        },
        attire: {
          active: context.boards.attire != null ? context.boards.attire.name : null
        }
      }));
    }
  }, {
    key: "buildContent",
    value: function buildContent(context) {
      return this.buildFullOptions(context, {
        library: {
          visible: context.toolbar.permissions.can_use_library
        },
        source: {
          visible: context.boards.showCode
        },
        board: {
          visible_edition: context.boards.permissions.can_view_edition_panel,
          collapse_toolbox: !context.boards.isToolboxVisible,
          user_permissions: {
            can_change_initial_board: context.boards.permissions.can_change_initial_board,
            can_change_initial_board_source: context.editor.runner.permissions.can_change_source,
            can_edit_board: context.boards.permissions.can_edit_board,
            can_view_size_section: context.boards.permissions.can_view_size_section,
            can_view_attire_section: context.boards.permissions.can_view_attire_section
          }
        },
        execution_speed: {
          user_permissions: {
            can_change_speed: context.editor.runner.permissions.can_change_speed
          }
        },
        attire: {
          visible: context.boards.showAttire,
          user_permissions: {
            can_toggle_visibility: context.boards.permissions.can_toggle_attire_visibility
          }
        },
        blocks: context.editor.toolbox,
        customErrors: context.editor.customErrors
      });
    }
  }, {
    key: "readCoreOptions",
    value: function readCoreOptions(context, content) {
      context.boards.initializeBoards();

      var metadata = jsyaml.safeLoad(content);

      // defaults
      if (!metadata.source) metadata.source = { visible: true, percentage: context.boards.stylist.DEFAULT_PERCENTAGE };

      // name
      context.setProjectName(metadata.name);

      // board
      context.boards.selectedInitialState = metadata.board.active - 1;
      context.editor.runner.useRandomBoard = metadata.board.initial_board_source === this.RANDOM_SOURCE;
      window.STORAGE.setItem("code-panel-percentage", metadata.source.percentage);
      context.ide.resizeLeftPanel(true);

      // execution_speed
      var speed = this.SPEED_NAMES.indexOf(metadata.execution_speed.active) + 1;
      context.editor.runner.speed = speed === 0 ? 4 : speed;

      // attire
      setTimeout(function () {
        // wait for gs-board to fire "board-changed" and update the model
        context.boards.setAttire(metadata.attire.active);
        context.boards.showAttire = metadata.attire.visible;
      }, 0);

      return metadata;
    }
  }, {
    key: "readSecondaryOptions",
    value: function readSecondaryOptions(context, metadata) {
      // board
      context.boards.setShowCode(metadata.source.visible);

      // permissions
      context.toolbar.set("permissions.can_use_library", metadata.library.visible);
      context.menu.set("permissions.can_use_library", metadata.library.visible);
      context.boards.set("permissions.can_view_edition_panel", metadata.board.visible_edition);
      context.boards.toggleToolbox(!metadata.board.collapse_toolbox);
      context.editor.runner.set("permissions.can_change_source", metadata.board.user_permissions.can_change_initial_board_source);
      context.boards.set("permissions.can_change_initial_board", metadata.board.user_permissions.can_change_initial_board);
      context.boards.set("permissions.can_edit_board", metadata.board.user_permissions.can_edit_board);
      context.boards.set("permissions.can_view_size_section", metadata.board.user_permissions.can_view_size_section !== false);
      context.boards.set("permissions.can_view_attire_section", metadata.board.user_permissions.can_view_attire_section !== false);
      context.editor.runner.set("permissions.can_change_speed", metadata.execution_speed.user_permissions.can_change_speed);
      context.boards.set("permissions.can_toggle_attire_visibility", metadata.attire.user_permissions.can_toggle_visibility);

      if (metadata.blocks) context.editor.toolbox = metadata.blocks;
      if (metadata.customErrors) context.editor.customErrors = metadata.customErrors;
    }
  }, {
    key: "resetSecondaryOptions",
    value: function resetSecondaryOptions(context) {
      context.boards.setShowCode(true);
      context.toolbar.set("permissions.can_use_library", true);
      context.menu.set("permissions.can_use_library", true);
      context.boards.set("permissions.can_view_edition_panel", true);
      context.boards.toggleToolbox(true);
      context.editor.runner.set("permissions.can_change_source", true);
      context.boards.set("permissions.can_change_initial_board", true);
      context.boards.set("permissions.can_edit_board", true);
      context.boards.set("permissions.can_view_size_section", true);
      context.boards.set("permissions.can_view_attire_section", true);
      context.editor.runner.set("permissions.can_change_speed", true);
      context.boards.set("permissions.can_toggle_attire_visibility", true);
      context.editor.toolbox = null;
      context.editor.customErrors = null;
    }
  }, {
    key: "readContent",
    value: function readContent(context, content, fileName) {
      var metadata = this.readCoreOptions(context, content);
      this.readSecondaryOptions(context, metadata);
    }
  }, {
    key: "_buildYaml",
    value: function _buildYaml(metadata) {
      return jsyaml.safeDump(metadata, { skipInvalid: true });
    }
  }]);

  return MetadataLoader;
}(TextLoader);

;