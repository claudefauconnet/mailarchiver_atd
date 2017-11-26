/**
 * Created by claud on 24/11/2017.
 */
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
var archiveProcessor = (function () {
    var self = {}

    self.totalCountMails = 0;
    self.dirCountMails = 0;
    self.messageText = "";
    self.sender;
    self.currentNumberOfLevels = 0;
    self.maxLevels = 3;
    self.mailMaxSize = 500;
    self.currentDirName = "";
    self.stopAsync = null;
    self.currentLang = "FR;"
self.totalCountUploadedMails=0;
    self.totalCountMailsWithAttachements=0;
    self.currentAction;
    self.dirStatus = {};


    self.readData = function (data, action, callback) {
        self.stopAsync = null;
        self.currentNumberOfLevels = 0;
        self.totalCountMails = 0;
        self.totalCountUploadedMails=0;
        self.totalCountMailsWithAttachements=0;
        async.eachSeries(data, function (item, callbackInner) {
            item = item.webkitGetAsEntry();
            if (item) {
                self.dirStatus[item.fullPath] = {status: "processing", infos: []};
                //  console.log(item.fullPath)
                self.traverseFileTree(item, action, function (err, result) {
                    if (err) {

                        return callbackInner(err);
                    }

                    callbackInner(null);

                });
            }
        }, function (err) {
            if (err) {
              return   callback(err);
            }
           // console.log(JSON.stringify(self.dirStatus, null, 2))
            var recursiveJobDone = true;
            for (var key in self.dirStatus) {
                if (self.dirStatus[key].status != "done")
                    recursiveJobDone = false;
            }

            if (recursiveJobDone == true)
                callback(null, self.dirStatus);

        });
    }


    self.traverseFileTree = function (item, _action, traverseFileCallback) {
        archiveProcessor.currentAction = _action
        if (self.stopAsync != null)
            return traverseFileCallback(self.stopAsync);

        if (item.isFile) {
            self.dirStatus[item.name] = {status: "processing", infos: [],type:"eml",status:"processing"};
            item.file(function (file) {
                var reader = new FileReader();
                reader.onload = function (event) {
                    /* if (archiveProcessor.currentAction == "checkRules")
                     self.checkRules(event, item, traverseFileCallback);// not used yet
                     else if (archiveProcessor.currentAction == "uploadArchive")*/
                    self.uploadArchiveFileToServer(event, item.name, item.fullPath, function (err, result) {
                        if (err)
                            return traverseFileCallback(err);
                        return traverseFileCallback(null, result);

                    });
                }
                reader.readAsDataURL(file);


            })
        } else if (item.isDirectory) {// check rules and apply recursive exploration of dirs
            var dirReader = item.createReader();
            dirReader.readEntries(function (entries) {

                self.dirStatus[item.fullPath] = {status: "processing", infos: [],type:"dir",status:"done"};


                if (self.currentAction = "checkRules") {
                    self.checkRuleFileAnDirAtSameLevel(entries, function (err) {
                        if (err) {
                            self.stopAsync = err;
                            traverseFileCallback(err);
                        }
                    });
                    self.checkRuleMaxDirLevels(entries, function (err) {
                        if (err) {
                            self.stopAsync = err;
                            traverseFileCallback(err);
                        }
                    });

                }
                // for each dir of a level
                for (var i = 0; i < entries.length; i++) {

                    self.traverseFileTree(entries[i], _action, traverseFileCallback);
                }

            });

        }
    }

    self.checkRules = function (event, item, callback) {
        callback(null);
    };


    self.uploadArchiveFileToServer = function (event, emlFileName, emlFileFullPath, callback) {
        var emlContent64 = event.target.result;
        self.dirCountMails = 0
        self.extractMailsFromEmx(emlContent64, emlFileName, function (err, mails) {
            // for each email in eml
            var mailsToUpload = []
            for (var i = 0; i < mails.length; i++) {
                var mail = mails[i];

                if (self.stopAsync != null)
                    return callback("stop");
                var subject=self.extractMailSubject(mail)
                self.totalCountMails += 1;
                self.dirCountMails += 1;
                mail=self.checkIfMailIsWithoutAttachements(mail,subject, emlFileName);


                    mailsToUpload.push(mail);

            }
            async.eachSeries(mailsToUpload, function (mail, eachCallBack) {
                    var message = emlFileName + " " + subject + " : "
                    var payload = {
                        eml: mail,
                        fileName: emlFileName,
                        fullPath: emlFileFullPath,
                        sender: self.sender
                    }

                    $.ajax({
                        type: "POST",
                        url: "/processEML",
                        data: payload,
                        dataType: "json",
                        success: function (data, textStatus, jqXHR) {
                            message += resources.Message_mailUploaded[self.currentLang];
                            self.dirStatus[emlFileName].infos.push(message);
                            self.totalCountUploadedMails += 1;
                            eachCallBack(null)
                        }
                        , error: function (xhr, err, msg) {
                            message += resources.Exception_uploadFailed[self.currentLang]
                            self.dirStatus[emlFileName].infos.push(message)
                            eachCallBack(message)
                        }

                    });


                    //  console.log("File:", path + file.name +"  "+ mail.length +"  "+mail.substring(0,50));


                },
                function (err) {
                    if (err) {
                        self.stopAsync = true;
                        return callback(err);
                    }
                    self.messageText += "dossier " + emlFileFullPath + " terminé nombre de mails importés : " + self.dirCountMails + "<br>";
                    setMessage(self.messageText, "green")
                    $("body").css("cursor", "default");


                    var xx = self.dirStatus[emlFileName];
                    self.dirStatus[emlFileName].status = "done";

                    callback(null, "done")
                })
        })

    }


    self.extractMailsFromEmx = function (emlContent64, fileName, callback) {

        var mails = [];
        var emlContent;
        var p = emlContent64.indexOf("base64,");
        if (p < 0) {
            callback(resources.Exception_emlFileNotInBase64[self.currentLang] + " : " + fileName)
        }

        emlContent64 = emlContent64.substring(p + 7)
        try {
          //  emlContent = util.decode64(emlContent64);
           // emlContent = util.decode64ToUTF8(emlContent64);
            emlContent=Base64.decode(emlContent64);

        }
        catch (e) {
            console.log(e);
            try{
                emlContent = util.decode64(emlContent64);
            }
            catch(e2){
                callback(resources.Exception_emlFileNotInBase64[self.currentLang] + " : " + fileName)
            }

        }



        var mails = []
        var start = 0, end = 0;
        var start = emlContent.indexOf("X-Mozilla-Status:");
        while ((end = emlContent.indexOf("X-Mozilla-Status:", start + 1)) > -1) {
            var mail = emlContent.substring(start, end);
            start = end;
            mails.push(mail);


        }
        if (end < 0)//last
            mails.push(emlContent.substring(start));

        return callback(null, mails)
    }

    self.extractMailSubject = function (mail) {
        var subject = mail.match(/[\n]Subject:(.*)/);

        if (Array.isArray(subject))
            subject = subject[0];
        if (!subject)
            subject = "no subject";
        if (subject.length > 50)
            subject = subject.substring(0, 50) + "...";
        return subject;
    }
    self.checkIfMailIsWithoutAttachements = function (mail, subject, emlFileName) {

     //   if (mail.length > (self.mailMaxSize * 1000)) {
        var p=mail.indexOf("Content-Transfer-Encoding: base64")
        if(p>-1){
            self.totalCountMailsWithAttachements+=1;
          //  console.log("\n----------------"+mail.substring(p,p+100)+"\n******************")
            var message = emlFileName + "/" + subject + " : " + resources.Warning_mailWithAttachment[self.currentLang];

            self.dirStatus[emlFileName].infos.push(message)
            return mail.substring(0,p);
        }
        return mail;
    }


//************************************rules*******************************************
    self.checkRuleFileAnDirAtSameLevel = function (entries, callback) {
        var hasDir = false;
        var hasMails = false;

        for (var i = 0; i < entries.length; i++) {
            if (entries[i].name.indexOf(".sbd") > -1)//dir
                hasDir = true;
            else
                hasMails = true;

            if (hasDir && hasMails)
                return callback(resources.Exception_fileAnDirAtSameLevel[self.currentLang] + " : " + entries[i].name)
        }

        return callback(null);


    }

    self.checkRuleMaxDirLevels = function (entries, callback) {
        var p = -1
        for (var i = 0; i < entries.length; i++) {
            p = i;
            if (entries[i].name.indexOf(".sbd") > -1)//dir
                self.currentNumberOfLevels += 1
            break;
        }

        if (self.currentNumberOfLevels >= self.maxLevels)
            return callback(resources.Exception_maxLevelsExceeded[self.currentLang] + " : " + entries[p].name)
        return callback(null);


    }

    self.addMessage = function (message, type) {
        if (!type)
            type = "";
        else
            type += " : "
        $("#message").append("<br>" + type + message);
    }


    return self;

})
()