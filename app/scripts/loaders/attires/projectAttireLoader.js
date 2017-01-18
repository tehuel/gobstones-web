class ProjectAttireLoader {
  constructor(pathPrefix) {
    super();
    this.reader = new AttireReader();
    this.pathPrefix = pathPrefix;
  }

  writeToZip(context, zip) {
    zip.file(this.pathPrefix + "coming_soon", "coming");
    zip.file(this.pathPrefix + "in", "coming");
    zip.file(this.pathPrefix + "the_best_cinemas", "coming");
    // TODO: Obtener vestimentas y llamar a attireReader por cada una
  }

  readFromZip(context, zip) {
    this.reader.readFromZip(context, zip, _.noop);
    // TODO: Leer zip y por cada carpeta dentro de attires, llamar a readFromZip por cada una con el path
  }
}
