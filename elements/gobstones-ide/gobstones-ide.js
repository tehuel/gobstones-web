"use strict";

Polymer({
  is: 'gobstones-ide',
  behaviors: [Polymer.LocalizationBehavior, Polymer.LoaderBehavior],
  properties: {
    projectType: String,
    showIsLoading: {
      type: Boolean,
      computed: "_computeShowIsLoading(isLoading, isLoadingProjects)"
    },
    isLoading: {
      type: Boolean,
      value: false
    },
    isLoadingProjects: {
      type: Boolean,
      value: false
    },
    description: {
      type: String,
      value: ""
    },
    currentCode: {
      type: String,
      value: ""
    }
  },
  listeners: {
    "open-blocks-project-selector": "_onOpenBlocksProjectSelector"
  },

  ready: function ready() {
    var _this = this;

    window.extendJQuery();
    window.GBS_PROJECT_TYPE = this.projectType;
    this._setTheRightUrl();
    this._setUpKeys();
    this._setUpLoaders();
    this._setUpMouseWheel();

    setTimeout(function () {
      var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
      if (!isChrome && !window.GBS_DESKTOP) alert(_this.localize("chrome-warning"));
    });

    if (!window.GBS_DESKTOP) {
      GitHubLoader.getDesktopRelease().then(function (release) {
        _this.DESKTOP_RELEASE = release.name;
      });
    }
  },

  setDescription: function setDescription(markdown) {
    this.description = markdown;
    window.BUS.fire("has-description", markdown !== "");
  },

  showDescriptionModal: function showDescriptionModal() {
    document.querySelector("#descriptionModal").open();
    $("paper-drawer-panel")[0].closeDrawer();

    setTimeout(function () {
      window.GobstonesBoard.updateAllBoards();
    }, 500); // TODO: Deshacer hack
  },

  hideProjectSelectorModal: function hideProjectSelectorModal() {
    document.querySelector("#projectSelectorModal").close();
  },

  showProjectSelectorModal: function showProjectSelectorModal() {
    document.querySelector("#projectSelectorModal").open();
    this._closeDrawer();
  },

  hideCourseSelectorModal: function hideCourseSelectorModal() {
    document.querySelector("#courseSelectorModal").close();
  },

  showCourseSelectorModal: function showCourseSelectorModal() {
    document.querySelector("#courseSelectorModal").open();
    this._closeDrawer();
  },

  isProjectSelectorModalOpened: function isProjectSelectorModalOpened() {
    return document.querySelector("#projectSelectorModal").opened;
  },

  setCurrentCode: function setCurrentCode(newCode) {
    this.currentCode = newCode;
  },

  showCodeViewModal: function showCodeViewModal(newCode) {
    document.querySelector("#codeViewModal").open();
  },

  showReportIssueModal: function showReportIssueModal() {
    document.querySelector("#reportIssueModal").open();
  },

  showCodeChanged: function showCodeChanged(_ref) {
    var detail = _ref.detail;

    this.resizeLeftPanel(detail, 0);
  },

  showBoardsChanged: function showBoardsChanged(_ref2) {
    var detail = _ref2.detail;

    this.resizeLeftPanel(detail, $(document).width());
  },

  resizeLeftPanel: function resizeLeftPanel(show, hiddenSize) {
    var percentage = +window.STORAGE.getItem("code-panel-percentage") || 0.6;

    $(".panel-left").width(show ? $(document).width() * percentage : hiddenSize);
    $(window).trigger("resize");
  },

  isCodeProject: function isCodeProject(projectType) {
    return projectType === 'code';
  },
  isBlocksProject: function isBlocksProject(projectType) {
    return projectType === 'blocks';
  },
  isTeacherProject: function isTeacherProject(projectType) {
    return projectType === 'teacher';
  },

  compileMd: function compileMd(markdown) {
    return this._renderMarkdown(this._renderEmojis(markdown));
  },

  buttonCssClass: function buttonCssClass(show) {
    return !show ? "button-disabled" : "";
  },

  _closeDrawer: function _closeDrawer() {
    $("paper-drawer-panel")[0].closeDrawer();
  },

  _onOpenBlocksProjectSelector: function _onOpenBlocksProjectSelector() {
    if (this.projectType === "teacher") return;
    this.showProjectSelectorModal();
  },

  _renderMarkdown: function _renderMarkdown(markdown) {
    if (!window.showdown && window.GBS_DESKTOP) {
      window.showdown = window.GBS_REQUIRE("showdown");
    }

    return new window.showdown.Converter({ tables: true }).makeHtml(markdown);
  },

  _renderEmojis: function _renderEmojis(markdown) {
    var emoji = new EmojiConvertor();
    emoji.img_sets.apple.path = this._makeAppUrl('images/emojis/img-apple-64/');
    emoji.img_sets.apple.sheet = this._makeAppUrl('images/emojis/sheet_apple_64.png');

    return emoji.replace_colons(markdown);
  },

  _onCloseDescriptionModal: function _onCloseDescriptionModal() {
    this._showTour();
  },

  _makeAppUrl: function _makeAppUrl(partialUrl) {
    return location.pathname + partialUrl;
  },

  _setUpLoaders: function _setUpLoaders() {
    var getContext = this._context.bind(this);

    var projectUrl = getParameterByName("url");
    if (projectUrl) return this._setUpLoader(UrlLoader, projectUrl, getContext);

    var gitHubSlug = getParameterByName("github");
    var gitHubPath = getParameterByName("path");
    if (gitHubSlug) return this._setUpLoader(GitHubLoader, gitHubSlug, getContext, gitHubPath);

    var fsPath = getParameterByName("fs");
    if (fsPath) return this._setUpLoader(FsLoader, fsPath, getContext);
  },

  _setUpLoader: function _setUpLoader(Loader, resource, getContext, subresource) {
    var _this2 = this;

    window.LOAD_PENDING_PROJECT = function () {
      _this2.startLoading();
      var finish = function finish() {
        _this2.stopLoading();
      };

      new Loader(_this2.projectType, resource, subresource).load(getContext, finish).catch(function (e) {
        console.error(e);
        alert(_this2.localize("error-loading-project"));
        finish();
      });
    };
  },

  _setUpMouseWheel: function _setUpMouseWheel() {
    this.addEventListener("wheel", function (event) {
      var parent = event.target;
      var isBlocklyChild = false;
      var isBlocklyToolboxChild = false;

      while (parent) {
        if (parent.id === "blocklyDiv") isBlocklyChild = true;
        if (parent.classList.contains("blocklyToolboxDiv")) isBlocklyToolboxChild = true;

        parent = parent.parentElement;
      }

      if (!isBlocklyChild && event.ctrlKey || isBlocklyToolboxChild) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);
  },
  startLoading: function startLoading() {
    var property = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "isLoading";

    this[property] = true;
  },
  stopLoading: function stopLoading() {
    var property = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "isLoading";

    this[property] = false;
  },


  ideCss: function ideCss(showIsLoading) {
    return showIsLoading ? "gray" : "";
  },

  _computeShowIsLoading: function _computeShowIsLoading(isLoading, isLoadingProjects) {
    return isLoading || isLoadingProjects;
  },

  _setTheRightUrl: function _setTheRightUrl() {
    if (window.GBS_DESKTOP) return;

    var url = window.location.href;
    url = url.replace(/#\/?(blocks|code|teacher)/g, "");
    if (this.projectType === "code") url = url.replace(/gobstones-web/g, "gobstones-sr");
    if (this.projectType === "blocks") url = url.replace(/gobstones-web/g, "gobstones-jr");
    if (this.projectType === "teacher") url = url.replace(/gobstones-web/g, "gobstones-teacher");

    history.replaceState({}, '', url);
  },


  _setUpKeys: function _setUpKeys() {
    var _this3 = this;

    $(document).keydown(function (e) {
      if (e.keyCode == 27) {
        // ESC
        if (window.GBS_TOUR_ON) {
          window.MATERIAL_WALKER_CLOSE();
          window.GBS_TOUR_ON = false;
          window.GBS_TOUR_ENDED = true;

          setTimeout(function () {
            if (confirm(_this3.localize("do-you-want-to-disable-tutorial"))) {
              window.STORAGE.setItem("show-tutorial", false);
              document.querySelector("#menu").showTutorial = false;
            }
          }, 150);

          return;
        }
      }
    });
  },

  _showTour: function _showTour() {
    if (!this.$.boards.showCode || this.projectType === "teacher") return;

    var shouldNotShow = window.STORAGE.getItem("show-tutorial") === "false";
    if (window.GBS_TOUR_ENDED || shouldNotShow) return;
    window.GBS_TOUR_ON = true;

    $.walk([{
      target: "#code-placeholder",
      content: '<span style="font-size: small; color: #dbdbdb;">' + this.localize("tutorial-0") + '</span><br>' + this.localize("tutorial-1"),
      color: '#2e3aa1',
      acceptText: 'OK'
    }, {
      target: ".panel-right",
      content: this.localize("tutorial-2"),
      color: '#2e3aa1',
      acceptText: 'OK'
    }, {
      target: "#theBoardsTab",
      content: this.localize("tutorial-2.5"),
      color: '#2e3aa1',
      acceptText: 'OK'
    }, {
      target: "#playButton",
      content: this.localize("tutorial-3"),
      color: '#0b465d',
      acceptText: 'OK'
    }, {
      target: "#speedSlider",
      content: this.localize("tutorial-3.5"),
      color: '#0b465d',
      acceptText: 'OK'
    }, {
      target: "#project-buttons-placeholder",
      content: this.localize("tutorial-4"),
      color: '#2e3aa1',
      acceptText: 'OK'
    }, {
      target: "#open-description-button",
      content: this.localize("tutorial-4.5"),
      color: '#2e3aa1',
      acceptText: 'OK'
    }, {
      target: "#options-button",
      content: this.localize("tutorial-5"),
      color: '#2e3aa1',
      acceptText: 'OK'
    }]);
  }
});