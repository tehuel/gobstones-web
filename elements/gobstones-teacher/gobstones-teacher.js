"use strict";

var ID_BLOCKS = 0;
var ID_CODE = 1;
var ID_TEACHER_LIBRARY = 2;
var ID_LIBRARY = 3;
var ID_DESCRIPTION = 4;
var ID_ATTIRE = 5;
var ID_METADATA = 6;

Polymer({
  is: "gobstones-teacher",
  behaviors: [Polymer.BusListenerBehavior, Polymer.LocalizationBehavior],
  properties: {
    selectedTab: {
      type: Number,
      value: 0,
      observer: "_onTabChange"
    },
    solution: {
      type: Object,
      computed: "_computeSolution(selectedSolution, availableSolutions)",
      observer: "_onSolutionSelected"
    },
    selectedSolution: {
      type: Number,
      value: 0
    },
    availableSolutions: {
      type: Array,
      value: []
    },

    tooltipAnimation: Object
  },
  listeners: {
    "content-change": "_onContentChange"
  },

  attached: function attached() {
    this.tooltipAnimation = {
      "entry": [{ "name": "fade-in-animation", "timing": { "delay": 0 } }],
      "exit": [{ "name": "fade-out-animation", "timing": { "delay": 0 } }]
    };
  },

  ready: function ready() {
    var _this = this;

    this.BLOCKS_SYNC_ON_COLOR = "#03a9f4";
    this.BLOCKS_SYNC_OFF_COLOR = "#666666";
    this._setBlocksSyncOff();

    setTimeout(function () {
      _this.set("availableSolutions", [{
        code: {
          main: "",
          library: "",
          teacher: ""
        },
        workspace: {
          main: "",
          library: ""
        }
      }]);
    });

    Object.defineProperty(this, "code", {
      get: function get() {
        return this.getCode();
      }
    });

    Object.defineProperty(this, "workspace", {
      get: function get() {
        return this.solution.workspace;
      }
    });

    Object.defineProperty(this, "toolbox", {
      get: function get() {
        return this._editors()[ID_BLOCKS].toolbox;
      },
      set: function set(value) {
        this._editors()[ID_BLOCKS].toolbox = value;
      }
    });

    Object.defineProperty(this, "cover", {
      get: function get() {
        return this._editors()[ID_METADATA].cover;
      },
      set: function set(value) {
        this._editors()[ID_METADATA].cover = value;
      }
    });

    var boardsPanel = document.getElementById("boards");
    if (boardsPanel) {
      this.runner = boardsPanel.$.runner;
      this._editors()[ID_BLOCKS].runner = this.runner;
      this._editors()[ID_CODE].runner = this.runner;
      this._editors()[ID_TEACHER_LIBRARY].runner = this.runner;
      this._editors()[ID_LIBRARY].runner = this.runner;

      this.runner.addEventListener("run", function (_ref) {
        var detail = _ref.detail;

        if (!_this.isBlocksOrCodeTabSelected(_this.selectedTab)) {
          _this.runner.showToast(_this.localize("go-to-first-tabs"));
          _this.runner.stop();
          return;
        };

        _this._currentEditor()._onRunRequest(detail);
        _this._editors()[ID_CODE].readonly = true;
      });
      this.runner.addEventListener("cancel", function () {
        window.BUS.fire("cancel-request");
        _this._editors()[ID_CODE].readonly = false;
      });
      this.runner.addEventListener("end", function () {
        _this._editors()[ID_CODE].readonly = false;
        setTimeout(function () {
          return _this._editors()[ID_BLOCKS].highlight();
        }, 1000);
      });

      this._editors()[ID_CODE].reportError = function (error, type) {
        if (error.location.mode === "library") {
          setTimeout(function () {
            _this.selectedTab = ID_LIBRARY;

            _this._editors()[ID_LIBRARY]._setAnnotation(error, type);
          });
        } else {
          _this._editors()[ID_CODE]._setAnnotation(error, type);
        }
      };
      this._editors()[ID_CODE]._setMode = _.noop;
    }

    this.subscribeTo("initial-state", function (event) {
      _this._currentEditor()._runCode(event, _this.getCode(), true);
    }).subscribeTo("execution-full-error", function (error) {
      var teacherBoom = _this._getTeacherBoomLocation(error);
      if (!teacherBoom || _this.selectedTab !== ID_CODE) return;

      error.location.line = teacherBoom.line;

      _this.selectedTab = ID_TEACHER_LIBRARY;
      _this._editors()[ID_TEACHER_LIBRARY].reportError(error);
    });
  },

  preSave: function preSave() {
    this.selectedSolution = 0;
  },

  getCode: function getCode() {
    return _.merge({}, this.solution.code, {
      library: this._getSolutionLibrary(),
      teacher: this._getSolutionTeacher()
    });
  },

  setCode: function setCode(code, mode, isBlocklyCode) {
    var shouldUseBlocks = isBlocklyCode !== undefined ? isBlocklyCode : code.startsWith("<");

    var editors = this._editors();

    if (mode === "library") {
      editors[ID_LIBRARY].setCode(code);
      editors[ID_BLOCKS].setCode(code, mode);
      editors[ID_CODE].setCode(code, mode);
    } else if (mode === "teacher") {
      editors[ID_TEACHER_LIBRARY].setCode(code);
      editors[ID_BLOCKS].setCode(code, mode);
      editors[ID_CODE].setCode(code, mode);
    } else {
      editors[shouldUseBlocks ? ID_BLOCKS : ID_CODE].setCode(code);
    }
  },

  getDescription: function getDescription() {
    return this._editors()[ID_DESCRIPTION].getDescription();
  },

  setDescription: function setDescription(content) {
    this._editors()[ID_DESCRIPTION].setDescription(content);
  },

  getMetadata: function getMetadata() {
    return this._editors()[ID_METADATA].getMetadata();
  },

  setMetadata: function setMetadata(content) {
    this._editors()[ID_METADATA].setMetadata(content);
  },

  generateCode: function generateCode(withRegions, blockly) {
    return this._editors()[ID_BLOCKS].generateCode(withRegions, blockly);
  },

  addCode: function addCode(xml) {
    return this._editors()[ID_BLOCKS].addCode(xml);
  },

  reset: function reset() {
    var solutionsCount = this.availableSolutions.length;
    for (var i = 0; i < solutionsCount - 1; i++) {
      this.removeCurrentSolution();
    }return this._editors().forEach(function (editor) {
      return editor.reset && editor.reset();
    });
  },

  getSolutionName: function getSolutionName(index, localize) {
    //return "asd";
    return index === 0 ? localize("solutions-student") : localize("solutions-solution") + " " + index;
  },

  addSolution: function addSolution() {
    this.push("availableSolutions", {
      code: { main: "", library: "", teacher: "" },
      workspace: { main: "", library: "" }
    });
    this.selectedSolution = this.availableSolutions.length - 1;
  },

  removeCurrentSolution: function removeCurrentSolution() {
    var _this2 = this;

    this._removeSolution(function (index) {
      _this2.splice("availableSolutions", index, 1);
    });
  },

  isBlocksOrCodeTabSelected: function isBlocksOrCodeTabSelected(selectedTab) {
    return selectedTab === ID_BLOCKS || selectedTab === ID_CODE;
  },

  _setSolutionCode: function _setSolutionCode(code) {
    this.availableSolutions[this.selectedSolution].code.main = code;
  },

  _setSolutionWorkspace: function _setSolutionWorkspace(workspace) {
    this.availableSolutions[this.selectedSolution].workspace.main = workspace;
  },

  _getSolutionLibrary: function _getSolutionLibrary() {
    return this.availableSolutions[0].code.library;
  },

  _setSolutionLibrary: function _setSolutionLibrary(library) {
    this.availableSolutions[0].code.library = library;
  },

  _getSolutionTeacher: function _getSolutionTeacher() {
    return this.availableSolutions[0].code.teacher;
  },

  _setSolutionTeacher: function _setSolutionTeacher(teacher) {
    this.availableSolutions[0].code.teacher = teacher;
  },

  _removeSolution: function _removeSolution(action) {
    if (this.availableSolutions.length < 2) return;

    var index = this.selectedSolution;
    if (index === 0) index++;
    action(index);

    this.selectedSolution = Math.max(0, this.availableSolutions.length - 1);
  },

  _computeSolution: function _computeSolution(selectedSolution, availableSolutions) {
    return availableSolutions[selectedSolution];
  },

  _onSolutionSelected: function _onSolutionSelected() {
    var _this3 = this;

    setTimeout(function () {
      _this3.setCode(_this3.solution.code.main, "main", false);
      _this3.setCode(_this3.solution.workspace.main, "main", true);
    });
  },

  _onContentChange: function _onContentChange(event) {
    var _this4 = this;

    var editors = this._editors();

    var editor = event.target;
    if (editor.id === "code-editor") {
      this._setSolutionCode(editor.code.main);
      if (!this.isSyncingBlocks) this._setBlocksSyncOff();
    }
    if (editor.id === "blocks-editor") {
      this._setSolutionWorkspace(editor.workspace.main);
      if (this.blocksSyncEnabled) this._copyBlocksToCode();
    }
    if (editor.id === "library-editor") {
      var code = editor.code.main;
      this._setSolutionLibrary(code);
      editors[ID_BLOCKS].setCode(code, "library");
      editors[ID_CODE].setCode(code, "library");
    }
    if (editor.id === "teacher-library-editor") {
      var _code = editor.code.main;
      this._setSolutionTeacher(_code);
      editors[ID_BLOCKS].setCode(_code, "teacher", false);
      editors[ID_CODE].setCode(_code, "teacher", false);

      editor.checkCompilationErrors();
    }

    this.async(function () {
      _this4.isSyncingBlocks = false;
    });
  },

  _getTeacherBoomLocation: function _getTeacherBoomLocation(error) {
    var errorLine = error.on.range.start.row;
    var mainLines = this.solution.code.main.split("\n").length;
    var libraryLines = this.solution.code.library.split("\n").length;

    return errorLine > mainLines + libraryLines ? { line: errorLine - mainLines - libraryLines } : null;
  },

  _setBlocksSyncOff: function _setBlocksSyncOff() {
    this.customStyle["--fab-sync-background"] = this.BLOCKS_SYNC_OFF_COLOR;
    this.updateStyles();
    this.blocksSyncEnabled = false;
  },

  _setBlocksSyncOn: function _setBlocksSyncOn() {
    var generatedCode = this.generateCode(false);
    var currentCode = this.solution.code.main;

    if (currentCode !== "" && currentCode !== generatedCode) {
      var userAccepts = confirm(this.localize("blocks-sync-confirm-overwrite"));
      if (!userAccepts) return;
    }

    this.blocksSyncEnabled = true;
    this.customStyle["--fab-sync-background"] = this.BLOCKS_SYNC_ON_COLOR;
    this.updateStyles();

    this._copyBlocksToCode();
  },

  _copyBlocksToCode: function _copyBlocksToCode() {
    var generatedCode = this.generateCode(false);
    this.isSyncingBlocks = true;
    this._setSolutionCode(generatedCode);
    this.setCode(generatedCode);
  },


  _onBlocksSyncClick: function _onBlocksSyncClick() {
    if (this.blocksSyncEnabled) this._setBlocksSyncOff();else this._setBlocksSyncOn();
  },

  _blocksClass: function _blocksClass(selectedTab) {
    return selectedTab === ID_BLOCKS ? "visible" : "unvisible";
  },
  _codeClass: function _codeClass(selectedTab) {
    return selectedTab === ID_CODE ? "visible" : "unvisible";
  },
  _teacherLibraryClass: function _teacherLibraryClass(selectedTab) {
    return selectedTab === ID_TEACHER_LIBRARY ? "visible" : "unvisible";
  },
  _libraryClass: function _libraryClass(selectedTab) {
    return selectedTab === ID_LIBRARY ? "visible" : "unvisible";
  },
  _descriptionClass: function _descriptionClass(selectedTab) {
    return selectedTab === ID_DESCRIPTION ? "visible" : "unvisible";
  },
  _attireClass: function _attireClass(selectedTab) {
    return selectedTab === ID_ATTIRE ? "visible" : "unvisible";
  },
  _metadataClass: function _metadataClass(selectedTab) {
    return selectedTab === ID_METADATA ? "visible" : "unvisible";
  },

  _editors: function _editors() {
    var _this5 = this;

    return ["blocks-editor", "code-editor", "teacher-library-editor", "library-editor", "description-editor", "attire-editor", "metadata-editor"].map(function (it) {
      return _this5.$[it];
    });
  },

  _currentEditor: function _currentEditor() {
    var selectedTab = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.selectedTab;

    return this._editors()[selectedTab];
  },

  _onTabChange: function _onTabChange() {
    window.BUS.fire("editor-dirty");
  }
});