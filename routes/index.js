var express = require('express');
var router = express.Router();
var mailManager=require('./bin/mailManager.js');

/* GET home page. */


router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});



/*router.post('/uploadData', function(req, response) {
    mailManager.uploadData(req, function (error, result) {
        processResponse(response, error, result)
    });

})*/

router.post('/uploadMailArchive', function(req, response) {
    mailManager.upload(req,"archive",function (error, result) {
        processResponse(response, error, result)
    });

})

router.post('/processEML', function(req, response) {
    mailManager.processEML(req.body.eml,req.body.fileName,req.body.fullPath,req.body.sender,function (error, result) {
        processResponse(response, error, result)
    });

})

router.post('/findMails', function(req, response, next) {
    mailManager.findMails(req.body,req.body.format,function (error, result) {
        processResponse(response, error, result)
    },response);
});



function processResponse(response,error,result){
    if (response && !response.finished) {

        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
        response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,contenttype'); // If needed
        response.setHeader('Access-Control-Allow-Credentials', true); // If needed


        if (error) {
            console.log("ERROR !!" + error);
            response.status(404).send({ERROR: error});

        }
        else if (!result) {
            response.status(404).send("no result");
        } else {

            if (typeof result == "string") {
                resultObj = {result: result};
                response.send(JSON.stringify(resultObj));
            }
            else {
                if (result.contentType && result.data) {
                    response.setHeader('Content-type', result.contentType);
                    if(result.contentType=="application/octet-stream")
                        response.setHeader("Content-Disposition", "attachment;filename=archive.zip");
                    else
                    response.setHeader("Content-Disposition", "attachment;filename=archive.csv");
                    if (typeof result.data == "object")
                        response.send(JSON.stringify(result.data));
                    else
                        response.send(result.data);
                }
                else {
                    var resultObj = result;
                  //  response.send("done");
                   response.send(JSON.stringify(resultObj));
                }
            }
        }


    }



}


module.exports = router;


