import PdfPrinter from "pdfmake";
// import ImageDataURI from "image-data-uri";

// const turnToBase64Format = async (url) => {
//   const urlBase64 = await ImageDataURI.encodeFromURL(url);
//   return urlBase64;
// };

const fonts = {
  Roboto: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};

export const getMediaPDFReadableStream = async (media, reviews) => {
  const printer = new PdfPrinter(fonts);
  // const base64Poster = await turnToBase64Format(media.Poster);

  const docDefinition = {
    content: [
      {
        text: `${media.Title} (${media.Year}) - ${media.Type}`,
        style: "header",
      },
      "\n\n",
      // { image: base64Poster, width: 250, style: "centerMe" },
      "\n\n\n",
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        alignment: "center",
      },
      subHeader: {
        fontSize: 16,
        bold: true,
      },
      centerMe: {
        alignment: "center",
      },
    },
  };

  reviews.forEach((r) =>
    docDefinition.content.push([
      { text: "Comment", style: "subHeader" },
      r.comment,
      r.createdAt,
      { text: "Rate", style: "subHeader" },
      r.rate,
    ])
  );

  const pdfReadableStream = printer.createPdfKitDocument(docDefinition);

  pdfReadableStream.end();
  return pdfReadableStream;
};
