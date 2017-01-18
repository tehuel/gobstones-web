class IndividualAttireLoader extends BlobLoader {
  constructor() {
    super();
    this.reader = new AttireReader();
  }

  save(context) {
    const attire = context.boards.attire;
    if (!attire) return;

    const zip = new JSZip();
    this.reader.writeToZip(attire, zip);

    zip.generateAsync({ type: "blob" }).then(content => {
      this._saveBlob(content, `${attire.name}.gbat`);
    });
  }

  read(context, event, callback) {
    const { file, fileName } = this._readLocalFile(event);

    JSZip.loadAsync(file).then(zip => {
      this.reader.readFromZip(context, zip, callback);
      // TODO: Pasarle como pathPrefix un "/" y probar que efectivamente eso sea así en JSZip
    });
  }
}
