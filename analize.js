var resemble = require('node-resemble-js');
var mime = require('mime');
var fs = require('fs');
var nodemailer = require('nodemailer');
//var MongoClient = require('mongodb').MongoClient;
//var assert = require('assert');
//Connection URL 
//var urlDb = 'mongodb://localhost:27017/myproject';
    
var transporter = nodemailer.createTransport('smtps://email@gmail.com:password@smtp.gmail.com');
var mailData = {
    from: 'email@gmail.com',
    to: 'email@gmail.com',
    subject: '',
    text: '',
    html: '',
    attachments: []
};

var files = "";
var folders = "";
var ts = Math.floor(Date.now() / 1000);


var args = process.argv.slice(2);
var mimeFile = "";
var image = "";
var imagePath = "";
var fileIndex = 0;
var folderIndex = 0;
var matchFile = "";
var contentFile = "";
var endLoopCallback = "";

var analizeImage = function (f, t, tv, td, callback) {
    //FromPath ToPath ToValidPath ToDiffPath

    if (fs.existsSync(tv)) {
        //esiste img x fare comparazione   
        resemble(f).compareTo(tv).onComplete(function (data) {
            console.log(data);

            mailData.text += "Image analisis\n\nPath: " + t + "\n\n" + JSON.stringify(data) + "\n\n";
            mailData.html += "Image analisis<br><br>Path: " + t + "<br><br>" + JSON.stringify(data) + "<br><br>";

            data.getDiffImage().pack().pipe(fs.createWriteStream(td));

            //ora sostituisco image in path last runned
            fs.createReadStream(f).pipe(fs.createWriteStream(tv));
            //sposto in cartella analized
            console.log('Move in ' + t);
            mailData.attachments.push({
                path: t
            });
            mailData.attachments.push({
                path: td
            });
            fs.rename(f, t, function (err) {
                if (err) {
                    console.log(err);
                }
                if (typeof callback == "function") {
                    callback();
                }
            });
        });
    } else {
        //ora sostituisco image in path last runned
        fs.createReadStream(f).pipe(fs.createWriteStream(tv));
        //sposto in cartella analized
        console.log('Move in ' + t);
        mailData.attachments.push({
            path: t
        });
        fs.rename(f, t, function (err) {
            if (err) {
                console.log(err);
            }
            if (typeof callback == "function") {
                callback();
            }
        });
    }
};
var analizeHtml = function (f, t, callback) {
    //fromPath ToPath callback
    //è report html .. lo sposto e basta
    console.log('Move in ' + t);
    mailData.attachments.push({
        path: t
    });
    fs.rename(f, t, function (err) {
        if (err) {
            console.log(err);
        }
        if (typeof callback == "function") {
            callback();
        }
    });
};
var loopFolders = function(pt, pa, pl, callback) {
    setTimeout(function () {
        //analizzo cartella
        
        tmpFolder = folders[folderIndex];
        tmpPathTest = pt + tmpFolder;
        console.log('chek test ' +tmpPathTest +' images' );
                        
        if(fs.lstatSync(tmpPathTest).isDirectory()) {
            tmpPathTest = tmpPathTest + "/";
                            
            //verifico se è presente cartella test - la creo se manca
            tmpPathTestAnalized = pa + tmpFolder ;
            if (!fs.existsSync(tmpPathTestAnalized)) {
                fs.mkdirSync(tmpPathTestAnalized);
            }
            tmpPathTestAnalized = tmpPathTestAnalized +"/";
                                
            tmpPathTestLastRunned = pl + tmpFolder ;
            if (!fs.existsSync(tmpPathTestLastRunned)) {
                fs.mkdirSync(tmpPathTestLastRunned);
            }
            tmpPathTestLastRunned = tmpPathTestLastRunned + "/";
                                
                                
            mailData.text += "\n\nTest: "+contentFile.test[tmpFolder].title + "\n\nResult:  "+contentFile.test[tmpFolder].result+"\n\n";
            mailData.html += "Test: "+contentFile.test[tmpFolder].title+"<br><br>Result: "+contentFile.test[tmpFolder].result+"<br> <br>";
            if(contentFile.test[tmpFolder].result == "failed") {
                mailData.text +="Error messagge: "+contentFile.test[tmpFolder].errorText+"\n\n";
                mailData.text +="Error action id: "+contentFile.test[tmpFolder].errorActionId+"\n\n";
                mailData.text +="Error action info: "+JSON.stringify(contentFile.test[tmpFolder].errorAction)+"\n\n";
                mailData.html +="Error messagge: "+contentFile.test[tmpFolder].errorText+"<br><br>";
                mailData.html +="Error action id: "+contentFile.test[tmpFolder].errorActionId+"<br><br>";
                mailData.html +="Error action info: "+JSON.stringify(contentFile.test[tmpFolder].errorAction)+"<br><br>";
            }  
            
            tmpFiles = fs.readdirSync(tmpPathTest);
            for(var y in tmpFiles) { 
                //eseguo check files di ogni test della sequence a fine ciclo folders...quindi creo oggetto files a mano
                files[fileIndex] = { 
                    pt: tmpPathTest,
                    pa: tmpPathTestAnalized,
                    pl: tmpPathTestLastRunned,
                    file: tmpFiles[y]
                };
                fileIndex++;
            }
        }
        //verifico se devo procedere con test(folder) successivo o passare a tutti i files
        folderIndex++;
        if (folders[folderIndex]) {
            loopFolders(pt, pa, pl, callback);
        } else {
            fileIndex = 0;
            loopFiles(pt, pa, pl, callback);
        }

    }, 500 );
};
var loopFiles = function (pt, pa, pl, callback) {
    //PathTest PathtestAnalized PathtestLastrunned
    setTimeout(function () {

        //analizzo file
        if (typeof(files[fileIndex]) == "object") {
            analizeFile(files[fileIndex].pt, files[fileIndex].pa, files[fileIndex].pl); 
        }
        else {
            analizeFile(pt, pa, pl); 
        }
        //verifico se devo procedere con img succesiva
        fileIndex++;
        if (files[fileIndex]) { 
            loopFiles(pt, pa, pl, callback);
        } else {
            if (typeof callback == "function") {
                callback();
            }
        }

    }, 2000);
};
var analizeFile = function(pt, pa, pl) {
    if (files.length > 0 && files[fileIndex]) {
        //analizzo file
        var tmpFile = typeof(files[fileIndex]) == "object" ? files[fileIndex].file : files[fileIndex];
        var mimeFile = mime.lookup(tmpFile);
        var from = pt + tmpFile;
        var to = pa + tmpFile;
        var toValid = pl + tmpFile;
        var toDiff = pa + "DIFF_" + tmpFile;
            
        console.log(tmpFile + ' - ' + mimeFile);
        
        if (mimeFile == "text/html") {
            analizeHtml(from, to);
        } else if (mimeFile == "image/png") {
            //analizzo immagine e genero diff poi sposto in cartella analized
            analizeImage(from, to, toValid, toDiff);
        }
    }
};

resemble.outputSettings({
    errorColor: {
        red: 155,
        green: 100,
        blue: 155
    },
    errorType: 'movement',
    transparency: 0.6,
    largeImageThreshold: 0
});


console.log('Analize file: ' + process.argv[2]);

if(args[0]) { 
    //se ho file ( argument ) faccio check su validità file
    mimeFile = mime.lookup(args[0]);  
    console.log('Mime file: '+ mimeFile); 
    matchFile = args[0].match(/(testReportAnalize.json)$/g);
    
    // Use connect method to connect to the Server 
    //MongoClient.connect(urlDb, function(err, db) {
    //  assert.equal(null, err);
    //  console.log("Connected correctly to server");

    //  db.close();
    //});
}
if(mimeFile == "application/json" && matchFile !== undefined && matchFile !== null && matchFile[0]) {
    //file ok. leggo contenuto ( equivalente a path del test da verificare )
    console.log('Start test analisis');
    
    fs.readFile(args[0], {encoding: 'utf-8'}, function(err,data){
        if (!err) {
            contentFile = data.replace(/^\uFEFF/, ''); 
            if( contentFile.charAt(0) == "?" ) {
                contentFile = JSON.parse(contentFile.substring(1,contentFile.length));
            } 
            else {
                contentFile = JSON.parse(contentFile);
            }
            console.log(contentFile);
            //cancello testReportAnalize (arg)
            fs.unlink(args[0]);
            
            if(contentFile.type == "sequence") {
                contentFile.path = "S" + contentFile.id;
            }
            else {
                contentFile.path = "T" + contentFile.id;
            }
            
            //ricavo percorsi da usare x analisi
            var pathTest = "gsExtReports/reports/" +contentFile.path + "/"; 
            var pathTestAnalized = "gsExtReports/reports/analized";
            var pathTestLastRunned = "gsExtReports/reports/analized/" +contentFile.path +"/" + contentFile.selectedViewport +"/lastValid";
            
            //leggo directory e creo dir dove spostare test analizzato
            if (!fs.existsSync(pathTestAnalized)) {
                fs.mkdirSync(pathTestAnalized);
            }
            
            pathTestAnalized = "gsExtReports/reports/analized/" +contentFile.path  ;
            if (!fs.existsSync(pathTestAnalized)) {
                fs.mkdirSync(pathTestAnalized);
            }
            
            pathTestAnalized = "gsExtReports/reports/analized/" +contentFile.path + "/" + contentFile.selectedViewport ;
            if (!fs.existsSync(pathTestAnalized)) {
                fs.mkdirSync(pathTestAnalized);
            }
                  
            if (!fs.existsSync(pathTestLastRunned)) {
                fs.mkdirSync(pathTestLastRunned);
            }
            pathTestLastRunned = pathTestLastRunned + "/";
            
            pathTestAnalized = "gsExtReports/reports/analized/" +contentFile.path + "/" + contentFile.selectedViewport + "/" + ts;
            fs.mkdirSync(pathTestAnalized);
            
            pathTestAnalized = pathTestAnalized + "/";
            
            //leggo directory e creo dir dove spostare test analizzato
            console.log('Analize test images in reports/' + contentFile.path + "/" + contentFile.selectedViewport);
            setTimeout(function () {
                
                if(contentFile.type == "sequence") {
                    
                    mailData.subject = "Avalaible sequence report: " + contentFile.title;
                    mailData.text += "Sequence: "+contentFile.title + "\n\n";
                    mailData.html += "Sequence: "+contentFile.title+"<br><br>";
                    mailData.text += "Viewport: "+contentFile.selectedViewport + "\n\n";
                    mailData.html += "Viewport: "+contentFile.selectedViewport+"<br><br>";
                    //sequenza di test
                    endLoopCallback = function () {
                        console.log('End analisis - send mail');
                        transporter.sendMail(mailData);
                    };
                    folders = fs.readdirSync(pathTest);
                    files = [];
                    loopFolders(pathTest, pathTestAnalized , pathTestLastRunned , endLoopCallback);
                }
                else {
                    //test singolo
                    
                    mailData.subject = "Avalaible test report: " + contentFile.title;
                    mailData.text += "\n\nTest: "+contentFile.title + "\n\nViewport: "+contentFile.selectedViewport + "\n\nResult: "+contentFile.result+"\n\n";
                    mailData.html += "Test: "+contentFile.title+"<br><br>Viewport: "+contentFile.selectedViewport+"<br><br>Result: "+contentFile.result+"<br><br>"; 
                    if(contentFile.result == "failed") {
                        mailData.text +="Error messagge: "+contentFile.errorText+"\n\n";
                        mailData.text +="Error action id: "+contentFile.errorActionId+"\n\n";
                        mailData.text +="Error action info: "+JSON.stringify(contentFile.errorAction)+"\n\n";
                        mailData.html +="Error messagge: "+contentFile.errorText+"<br><br>";
                        mailData.html +="Error action id: "+contentFile.errorActionId+"<br><br>";
                        mailData.html +="Error action info: "+JSON.stringify(contentFile.errorAction)+"<br><br>";
                    }  
        
                    files = fs.readdirSync(pathTest);
                    fileIndex = 0;
                    endLoopCallback = function () {
                        console.log('End analisis - send mail');
                        transporter.sendMail(mailData);
                    };
                    
                    loopFiles( pathTest , pathTestAnalized , pathTestLastRunned , endLoopCallback );
                }
                 
            }, 1000 );
        }
        else {
            //errore lettura file (non trovato ?)
            console.log(err);
        }

    });
}