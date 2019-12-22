/* eslint-disable class-methods-use-this */
const moment = require('moment');
const path = require('path');
const PdfPrinter = require('pdfmake');
const amountTypeEnum = require('../enums/amountType.enum');

const fonts = {
  Arial: {
    normal: path.join(__dirname, '../fonts/arial.ttf'),
    bold: path.resolve(__dirname, '../fonts/arialbd.ttf'),
    italics: path.resolve(__dirname, '../fonts/ariali.ttf'),
    bolditalics: path.resolve(__dirname, '../fonts/arialbi.ttf'),
  },
  Roboto: {
    normal: path.join(__dirname, '../fonts/Roboto-Regular.ttf'),
    bold: path.join(__dirname, '../fonts/Roboto-Medium.ttf'),
    italics: path.join(__dirname, '../fonts/Roboto-Italic.ttf'),
    bolditalics: path.join(__dirname, '../fonts/Roboto-MediumItalic.ttf'),
  },
};
const pdfMake = new PdfPrinter(fonts);
class PdfUtils {
  /**
  * Возвращает отчет о доходах/расходах в формате PdfMake
  * @param {object} data - данные для PDF
  */
  generateTemplate(data) {
    moment.locale('ru');
    const handledData = data.map((item) => [
      {
        text: item.name,
        alignment: 'center',
      },
      {
        text: item.amount,
        alignment: 'center',
      },
      {
        text: moment(item.created_at).format('DD.MM.YYYY'),
        alignment: 'center',
      },
    ]);
    return {
      pageMargins: [40, 15, 30, 20],
      content: [{
        table: {
          widths: [160, 160, 160],
          body: [
            [{ alignment: 'center', text: 'Name' },
              { alignment: 'center', text: 'Amount' },
              { alignment: 'center', text: 'Date' }],
            ...handledData,
          ],
        },
      },
      ],
    };
  }

  /**
   * Возвращает pdf
   * @param {object} data - данные для PDF
   */
  generatePdf(data) {
    return pdfMake.createPdfKitDocument(this.generateTemplate(data));
  }
}

module.exports = new PdfUtils();
