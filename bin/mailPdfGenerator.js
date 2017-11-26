/*******************************************************************************
 * mailArchiver_ATD LICENSE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Claude Fauconnet claude.fauconnet@neuf.fr
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 ******************************************************************************/




var fs = require('fs')
var PDFDocument = require('pdfkit');
var pdfDir = "./public/pdfArchives";
var path = require('path');
var common = require("./common.js")
var mailManager = require("./mailManager.js")

mailPdfGenerator = {

    createMailPdf: function (mail, fileName, fullPath, sender, senderDirDate, callback) {
        try {

            sender = mailPdfGenerator.formatStringForArchive(sender, 30);
            var mailTitle = "mail_sans_sujet_" + Math.round(Math.random() * 1000000);
            if (mail.subject) {
                mailTitle = mailPdfGenerator.removeMaultipleReAndFwd(mail.subject);
                mailTitle = mailPdfGenerator.formatStringForArchive(mailTitle, common.maxPdfSubjectLength);
            }
            if (mail.html)
                mail.html = mailPdfGenerator.removeHtmlTags(mail.html);


            var todayArchivedir = pdfDir + "/" + sender + "/" + senderDirDate;
            /*  if (fs.existsSync(todayArchivedir)) {
             common.deleteFolderRecursive(todayArchivedir);
             }*/
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


            if (mailTitle == "Re_outil_de_recuperation_des_arborescence_courrie")
                var xxx = mail;
            var pdfFileName = common.dateToString(mail.date) + "-" + mailTitle + ".pdf"
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
            if (mail.text)
                doc.text(mail.text, {width: textWidth, align: 'left'})
            if (mail.html)
                doc.text(mail.html, {width: textWidth, align: 'left'})

            doc.end();

            callback(null, {path: relativeFolderPath, file: pdfFileName});
        }
        catch (e) {
            callback(e)
        }
    },
    formatStringForArchive: function (str, maxLength) {
        str = common.toAscii(common.truncate(str, maxLength));
        str = str.replace(/ /g, "_");
        str = common.replaceNonLetterOrNumberChars(str, "")
        return str;
    },
    removeMaultipleReAndFwd: function (str) {
        var re = /Re[_:]/gi
        var fwd = /Fwd[_:]/gi

        var reArray = str.match(re);
        if (reArray && reArray.length > 1)
            str = "Re-" + reArray.length + "_" + str.replace(re, "");
        var fwdArray = str.match(fwd);
        if (fwdArray && fwdArray.length > 1)
            str = "Fwd-" + fwdArray.length + "_" + str.replace(fwd, "");
        return str;
    },
    removeHtmlTags: function (str) {
        str = str.replace(/<\/p>/gi, "\n");
        str = str.replace(/<BR>/gi, "\n");
        str = str.replace(/<[^>]*>/gi, "");
    },


}


module.exports = mailPdfGenerator;