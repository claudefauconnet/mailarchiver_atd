var fs = require('fs')
var PDFDocument = require('pdfkit');
var pdfDir = "./public/pdfArchives";
var path = require('path');
var common = require("./common.js")


mailPdfGenerator = {

    createMailPdf: function (mail, fileName, fullPath, sender, senderDirDate, callback) {
        try {
            // h.substring(0,fullPath.lastI)
            //   fullPath = (path.dirname(fullPath));
            fileName = common.toAscii(common.truncate(fileName, common.maxDirLength));
            var dirs = fullPath.split("/");
            dirs.splice(0, 1) // on enleve le repertoire de lk'archive lui meme (enveloppe)
            dirs.splice(dirs.length - 1, 1, fileName)//on enleve le nom du repertoire et on ajoute le nom du fichier qui contient les mails du sous répertoire à un niveau donné
            dirs.splice(0, 0, sender, senderDirDate)
            var parentDirPath = pdfDir;
            var relativeFolderPath = "";//pdfDir;//+"/"+sender+"/"+senderDirDate;
            for (var i = 0; i < dirs.length; i++) {
                parentDirPath += "/" + dirs[i].replace(".sbd", "");

                relativeFolderPath += "/" + dirs[i].replace(".sbd", "")
                var dir = path.resolve(parentDirPath)
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                }
            }


            var pdfFileName = mail.date.toString('yyyy-MM-dd');
            var index = Math.round(Math.random() * 10000)
            var subject = "mail_sans_sujet";
            if (mail.subject) {
                subject = common.toAscii(common.truncate(mail.subject, common.maxPdfSubjectLength));
                subject = subject.replace(/ /g, "_");
            }

            var pdfFileName = common.dateToString(mail.date) + "-" +subject + ".pdf"
            //  var pdfFileName = index + ".pdf"


            var doc = new PDFDocument
            doc.pipe(fs.createWriteStream(path.resolve(parentDirPath + "/" + pdfFileName)));


            var fontSize = {
                title: 12,
                text: 10,
                small: 8
            }
            var textWidth = 500


            doc.fontSize(fontSize.title)
            doc.text('From : ', {width: textWidth, align: 'left'})
            doc.fontSize(fontSize.text)
            if (mail.from)
                doc.text(mail.from.text, {width: textWidth, align: 'left'})

            doc.moveDown(0.5)
            doc.fontSize(fontSize.title)
            doc.text('To : ', {width: textWidth, align: 'left'})
            doc.fontSize(fontSize.text)
            if (mail.to)
                doc.text(mail.to.text, {width: textWidth, align: 'left'})


            doc.moveDown(0.5)
            doc.fontSize(fontSize.title)
            doc.text('replyTo : ', {width: textWidth, align: 'left'})
            doc.fontSize(fontSize.text)
            if (mail.replyTo)
                doc.text(mail.replyTo.text, {width: textWidth, align: 'left'})


            doc.moveDown(0.5)
            doc.fontSize(fontSize.title)
            doc.text('Date : ', {width: textWidth, align: 'left'})
            doc.fontSize(fontSize.text)
            doc.text(mail.date, {width: textWidth, align: 'left'})

            doc.moveDown(0.5)
            doc.fontSize(fontSize.title)
            doc.text('Subject : ', {width: textWidth, align: 'left'})
            doc.fontSize(fontSize.text)
            doc.text(mail.subject, {width: textWidth, align: 'left'})

            doc.moveDown(0.5)
            doc.fontSize(fontSize.title)
            doc.text('text : ', {width: textWidth, align: 'left'})
            doc.fontSize(fontSize.small)
            doc.text(mail.text, {width: textWidth, align: 'left'})

            doc.end();

            callback(null, {path: relativeFolderPath, file: pdfFileName});
        }
        catch (e) {
            callback(e)
        }


    }
}

module.exports = mailPdfGenerator;