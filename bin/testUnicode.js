var fs=require('fs');
//var utf8=require('utf8');
//var windows1252=require('windows-1252')
var iconv = require('iconv-lite');
//var  detectCharacterEncoding = require('detect-character-encoding');



//const fileBuffer = fs.readFileSync('file.txt');
//const charsetMatch = detectCharacterEncoding(fileBuffer);
//console.log(charsetMatch.encoding+"------------------")
var sb=fs.readFileSync("./testW1252.txt");


var isLatin=false
for(var i=0;i<sb.length;i++){
    if(sb[i]==233){
        isLatin=true;
        break;

    }
}

//charsetMatch.encoding );
var encoding="UTF8";
if(isLatin)
    encoding='ISO-8859-1'
str = iconv.decode(sb,encoding);
console.log(""+str);

