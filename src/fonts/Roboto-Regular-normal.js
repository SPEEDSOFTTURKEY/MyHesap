/* eslint-disable */
var font = 'Roboto-Regular-normal';
var callAddFont = function () {
  this.addFileToVFS('Roboto-Regular-normal.ttf', 
    'AAEAAAASAQAABAAgR0RFRrRCsIIAAjWsAAACYkdQT1OZX9...'); // kısaltıldı
  this.addFont('Roboto-Regular-normal.ttf', 'Roboto-Regular', 'normal');
};
jsPDF.API.events.push(['addFonts', callAddFont]);
