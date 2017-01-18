class LibraryLoader extends TextLoader {
  constructor() {
    super();
    this.SUFFIX = ".library.gbs";
  }

  _buildFile(context) {
    return context.editor.code.library;
  }

  _readContent(context, content) {
    this._setCode(context, content, "library");
  }
}
