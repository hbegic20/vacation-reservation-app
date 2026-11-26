const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

export const sampleFiles = {
  pdf: Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n"),
  png: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]),
  jpeg: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]),
  webp: Buffer.concat([
    Buffer.from("RIFF"),
    Buffer.from([0x10, 0x00, 0x00, 0x00]),
    Buffer.from("WEBPVP8 "),
  ]),
  docx: Buffer.concat([zipSignature, Buffer.from("....word/document.xml")]),
  xlsx: Buffer.concat([zipSignature, Buffer.from("....xl/workbook.xml")]),
  text: Buffer.from("just some text pretending to be a pdf"),
  zip: Buffer.concat([zipSignature, Buffer.from("....notes.txt")]),
};
