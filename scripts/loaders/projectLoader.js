"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ProjectLoader = function (_Loader) {
  _inherits(ProjectLoader, _Loader);

  function ProjectLoader() {
    _classCallCheck(this, ProjectLoader);

    var _this = _possibleConstructorReturn(this, (ProjectLoader.__proto__ || Object.getPrototypeOf(ProjectLoader)).call(this));

    _this.EXTENSION = ".gbp";
    _this.loaders = [new TeacherLoader(), new LibraryLoader(), new CodeLoader(), new InitialBoardLoader()];

    // Loaders must understand:
    // shouldHandle(path);
    // readProjectContent(context, content);

    _this.attireLoader = new ProjectAttireLoader("assets/attires/");
    _this.metadataLoader = new MetadataLoader();
    _this.descriptionLoader = new DescriptionLoader();
    return _this;
  }

  _createClass(ProjectLoader, [{
    key: "save",
    value: function save(context) {
      var _this2 = this;

      if (context.editor.preSave) context.editor.preSave();

      var loaders = this._loadersForSaving();
      var files = _.flatMap(loaders, function (loader) {
        return loader.getFiles(context);
      });

      var zip = new JSZip();
      files.forEach(function (file) {
        zip.file(file.name, file.content);
      });

      this.attireLoader.writeToZip(context, zip);

      zip.generateAsync({ type: "blob" }).then(function (content) {
        _this2._saveBlob(content, "" + context.getProjectName() + _this2.EXTENSION);
      });
    }
  }, {
    key: "read",
    value: function read(context, event, callback) {
      var _readLocalFile = this._readLocalFile(event),
          file = _readLocalFile.file;

      this.readRawZip(context, file, callback);
    }
  }, {
    key: "readRawZip",
    value: function readRawZip(context, file, callback) {
      var _this3 = this;

      JSZip.loadAsync(file).then(function (zip) {
        _this3.readRaw(context, zip, callback);
      }).catch(function (e) {
        console.error(e);
        alert("The project is corrupted or has errors.");
        callback();
      });
    }
  }, {
    key: "readRaw",
    value: function readRaw(context, zip, callback) {
      var _this4 = this;

      context.reset();

      this._loadFilesWithLoaders(context, zip, this.loaders, function () {
        context.boards.removeFirstBoard();

        console.log("Reading attires...");
        _this4.attireLoader.readFromZip(context, zip, function (err) {
          if (err) _this4._reportError(err);
          _this4._loadFilesWithLoaders(context, zip, [_this4.metadataLoader, _this4.descriptionLoader], callback);
        });
      });
    }
  }, {
    key: "_loadersForSaving",
    value: function _loadersForSaving() {
      return this.loaders.concat(this.metadataLoader);
    }
  }, {
    key: "_loadFilesWithLoaders",
    value: function _loadFilesWithLoaders(context, zip, loaders, callback) {
      var _this5 = this;

      var actions = ZipUtils.readAlphabetically(zip).map(function (aFile) {
        return _this5._loadComponent.bind(_this5, context, loaders, aFile);
      });

      async.series(actions, callback);
    }
  }, {
    key: "_loadComponent",
    value: function _loadComponent(context, loaders, _ref, callback) {
      var _this6 = this;

      var relativePath = _ref.relativePath,
          zipEntry = _ref.zipEntry;

      var handled = false;
      loaders.forEach(function (loader) {
        var getContent = function getContent() {
          return zipEntry.async(_this6._getContentType(relativePath));
        };
        if (!loader.shouldHandle(relativePath)) return;

        console.log("Reading '" + relativePath + "'...");
        handled = true;
        getContent().then(function (content) {
          try {
            console.log("Using " + loader.constructor.name + "...");
            content = _this6._removeUtf8Bom(content);
            loader.readProjectContent(context, content, relativePath);
          } catch (e) {
            console.error(loader, e);
            _this6._reportError("Error loading file " + relativePath);
          }
          callback();
        });
      });

      if (!handled) callback();
    }
  }, {
    key: "_reportError",
    value: function _reportError(message) {
      alert(message);
    }
  }, {
    key: "_getContentType",
    value: function _getContentType(relativePath) {
      var extension = _.last(relativePath.split("."));
      return extension === 'png' ? 'binarystring' : 'string';
    }
  }, {
    key: "_removeUtf8Bom",
    value: function _removeUtf8Bom(content) {
      return content.charCodeAt && content.charCodeAt(0) === 0xfeff ? content.substr(1) : content;
    }
  }]);

  return ProjectLoader;
}(Loader);

;