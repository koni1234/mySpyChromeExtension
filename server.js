var http = require('http');
var dispatcher = require('httpdispatcher');
var mime = require('mime');
var chalk = require('chalk');
//var jsdom = require("node-jsdom");
var fs = require('fs');
const util = require('util');

var path = 'gsExtReports/reports/analized';
const PORT=1337; 

//We need a function which handles requests and send response
function handleRequest(request, response){
    try {
        //log the request on console
        console.log(chalk.yellow(request.url));
        //Disptach
        dispatcher.dispatch(request, response);
    }
    catch(err) {
        console.log(chalk.red(err));
    }
}

function getFilesList() {
    
    fileIndex = 0;
    folderIndex = 0;
    folders = fs.readdirSync(path);
    files = [];
    list = {};
    loopFolders(path); 
    
}


function timeConverter(timestamp){
    var a = new Date(timestamp * 1000);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    return time;
}

var files = "";
var folders = "";
var list = "";
var fileIndex = 0;
var folderIndex = 0;
var loopFiles = function(id, file) {
    
    fs.readFile(file.pt, {encoding: 'utf-8'}, function(err,data){
        //TEST PASSED
        console.log('open file '+ file.pt);
        var matchFile = data.match(/<span class=\"success label\">TEST PASSED/g);
        if( matchFile !== undefined && matchFile !== null && matchFile[0] ) {
            var result = 'passed';
        }
        else {
            var result = 'failed';
        }
        files[id] = { 
            pt: file.pt,
            vp: file.vp,
            ts: file.ts,
            folder: file.folder,
            result: result,
            seq: file.seq,
            test: file.test,
            file: file.file,
            screenshots: file.screenshots
        };
        
        if(file.seq) {
            if(typeof list[file.seq] == "undefined") list[file.seq] = {};
            if(typeof list[file.seq][file.ts] == "undefined") list[file.seq][file.ts] = [];
            list[file.seq][file.ts].push(files[id]);
        }
        else {
            if(typeof list[file.test] == "undefined") list[file.test] = [];
            list[file.test].push(files[id]);
        }
          
        for(var i in file.screenshots) {
            
            dispatcher.onGet('/'+encodeURI(file.screenshots[i].pt), function(req, res) {
                console.log(req.url);
               // console.log(util.inspect(req.headers, false, null));
                fs.readFile(req.url.substring(1), function(err,data){ 
                    res.writeHead(200, {'Content-Type': 'image/png'}); 
                    res.end(data , 'binary');
                }); 
            }); 
        }
          
        dispatcher.onGet('/'+encodeURI(file.pt), function(req, res) {
            fs.readFile(file.pt, {encoding: 'utf-8'}, function(err,data){
                
                var str = '<a href="/">Go to index</a>'; 

                var res2 = data.toString();
                res2 = res2.replace(/<div class=\"callout\">/g, "<div class=\"callout\">"+ str);
                
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(res2);  
                res.end();
            });
        });       
    });
};
var loopFolders = function(pt) {
    //analizzo cartelle dentro /analized/
    tmpFolder = folders[folderIndex];
    tmpPathTest = pt + '/' + tmpFolder;
    tmpType = "";
    console.log('chek analized test in folder ' +tmpPathTest );
                        
    if(fs.lstatSync(tmpPathTest).isDirectory() && ( tmpFolder.charAt(0) == "T" || tmpFolder.charAt(0) == "S")) {
        //test .. /vp/ts/...html
        //sequense .. /vp/ts/testN/...html
        if(tmpFolder.charAt(0) == "T") tmpType = "test";
        else tmpType ="sequence";
        
        vpFolders = fs.readdirSync(tmpPathTest);
   
        for(var i in vpFolders) { 
            //test .. /ts/...html
            vpFolder = vpFolders[i];
            tmpPathTest = pt + '/'+ tmpFolder + '/' + vpFolder;
            
            if(fs.lstatSync(tmpPathTest).isDirectory() && tmpFolder.charAt(0) != "l") {
                tsFolders = fs.readdirSync(tmpPathTest);
      
                for(var y in tsFolders) { 
                    //test .. .html
                    tsFolder = tsFolders[y];
                    tmpPathTest = pt + '/'+ tmpFolder + '/' + vpFolder + '/' + tsFolder;
            
                    if(fs.lstatSync(tmpPathTest).isDirectory()) {
                        testFolders = fs.readdirSync(tmpPathTest);

                        for(var z in testFolders) { 
                            //test .. .html
                            
                            if(tmpType == "sequence") {
                                sequenceTestFolder = testFolders[z];
                                tmpPathTest = pt + '/'+ tmpFolder + '/' + vpFolder + '/' + tsFolder + '/' + sequenceTestFolder;

                                if(fs.lstatSync(tmpPathTest).isDirectory()) {
                                    sequenceTestFiles = fs.readdirSync(tmpPathTest);
                                    for(var w in sequenceTestFiles) { 
                                        testFile = sequenceTestFiles[w];
                                        tmpPathTest = pt + '/'+ tmpFolder + '/' + vpFolder + '/' + tsFolder + '/' + sequenceTestFolder + '/' + testFile;
                                        mimeFile = mime.lookup(tmpPathTest);

                                        if (mimeFile == "text/html") {
                                            tempImg = [];
                                            for(var jj in sequenceTestFiles) { 
                                                //test .. .png
                                                testFile2 = sequenceTestFiles[jj];
                                                tmpPathTest2 = pt + '/'+ tmpFolder + '/' + vpFolder + '/' + tsFolder + '/' + sequenceTestFolder + '/' + testFile2;
                                                mimeFile = mime.lookup(tmpPathTest2);

                                                if (mimeFile == "image/png") {
                                                    tempImg.push({
                                                        image: testFile2,
                                                        pt: tmpPathTest2
                                                    });
                                                }
                                            }

                                            loopFiles(fileIndex, { 
                                                pt: tmpPathTest,
                                                folder: pt + '/'+ tmpFolder + '/' + vpFolder + '/' + tsFolder + '/' + sequenceTestFolder,
                                                vp: vpFolder,
                                                ts: tsFolder,
                                                seq: tmpFolder,
                                                test: sequenceTestFolder,
                                                file: testFile,
                                                screenshots: tempImg
                                            });

                                            fileIndex++;
                                            break;
                                        }
                                    }
                                }
                            }
                            else if(tmpType == "test") {
                                
                                testFile = testFolders[z];
                                tmpPathTest = pt + '/'+ tmpFolder + '/' + vpFolder + '/' + tsFolder + '/' + testFile;
                                mimeFile = mime.lookup(tmpPathTest);

                                if (mimeFile == "text/html") {
                                    tempImg = [];
                                    for(var j in testFolders) { 
                                        //test .. .png
                                        testFile2 = testFolders[j];
                                        tmpPathTest2 = pt + '/'+ tmpFolder + '/' + vpFolder + '/' + tsFolder + '/' + testFile2;
                                        mimeFile = mime.lookup(tmpPathTest2);

                                        if (mimeFile == "image/png") {
                                            tempImg.push({
                                                image: testFile2,
                                                pt: tmpPathTest2
                                            });
                                        }
                                    }

                                    loopFiles(fileIndex, { 
                                        pt: tmpPathTest,
                                        folder: pt + '/'+ tmpFolder + '/' + vpFolder + '/' + tsFolder,
                                        vp: vpFolder,
                                        ts: tsFolder,
                                        seq: null,
                                        test: tmpFolder,
                                        file: testFile,
                                        screenshots: tempImg
                                    });

                                    fileIndex++;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    //verifico se devo procedere con test(folder) successivo o passare a tutti i files
    folderIndex++;
    if (folders[folderIndex]) {
        loopFolders(pt);
    }
};

//For all your static (js/css/images/etc.) set the directory name (relative path).
//dispatcher.setStatic('/gsExtReports/reports/analized/T0/maximized/1467669609');
//dispatcher.setStaticDirname('static');

//A sample GET request    
dispatcher.onGet("/page1", function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Page One');
});       
dispatcher.onGet("/", function(req, res) {
    
    
    fs.readFile('index.html', function (err, html) { 
        //if (err) {
        //    throw err; 
        //}       
        var str = '<div class="callout"><ul class="accordion" data-accordion data-multi-expand="true">';
        for(var y in list) {
            
            file = list[y]; 
            if(y.charAt(0) == "S") {
                //fs.readFile(req.url.substring(1), function(err,data){ 
                //    res.writeHead(200, {'Content-Type': 'image/png'}); 
                //    res.end(data , 'binary');
                //}); 
                str += '<li class="accordion-item" data-accordion-item>';
                str += '<a href="#" class="accordion-title"><span class="primary label">SEQUENCE</span> '+ /*file[0][0].file +*/'</a>';     
                str += '<div class="accordion-content" data-tab-content>';
                str += '<ul class="accordion" data-accordion data-multi-expand="true">';
                for(x in file) {
                    str += '<li class="accordion-item" data-accordion-item>';
                    str += '<a href="#" class="accordion-title">'+ timeConverter(file[x][0].ts)+'</a>';     
                    str += '<div class="accordion-content" data-tab-content>';
                    for(y in file[x]) {
                        str += '<div class="callout ';
                        if (file[x][y].result == 'passed') str += 'success'; 
                        else str += 'alert';

                        str +='">';


                        str += '<p>'+file[x][y].file;
                        str +=' - <a href="/'+file[x][y].pt+'">Visualizza report</a>'+'</p>';
                        str +='</div>';
                    }
                    str +='</div></li>'; 
                }
                str +='</ul>';
                str +='</div></li>'; 
            }
            else {
                str += '<li class="accordion-item" data-accordion-item>';
                str += '<a href="#" class="accordion-title"><span class="secondary label">TEST</span> '+ file[0].file+'</a>';     
                str += '<div class="accordion-content" data-tab-content>';
                for(x in file) {
                    str += '<div class="callout ';
                    if (file[x].result == 'passed') str += 'success'; 
                    else str += 'alert';

                    str +='">';


                    str += '<p>'+timeConverter(file[x].ts)+' - ';
                    str +='<a href="/'+file[x].pt+'">Visualizza report</a>'+'</p>';
                    str +='</div>';
                }
                str +='</div></li>'; 
            }
            
                
            
        }
        str +='</ul></div>';
            
        var res2 = html.toString();
        res2 = res2.replace(/<body>/g, "<body>"+ str);
       // jsdom.env(
         // html,
         // ["http://code.jquery.com/jquery.js"],
        //  function (errors, window) {
        //      window.$('body').append(str);
              res.writeHead(200, {'Content-Type': 'text/html'});
              res.write(res2);  
              res.end();
        //  }
        //);
        
    });
    
});    

//A sample POST request
//dispatcher.onPost("/post1", function(req, res) {
//    res.writeHead(200, {'Content-Type': 'text/plain'});
//    res.end('Got Post Data');
//});

//Create a server
var server = http.createServer(handleRequest);

//get files and url
getFilesList();

//Lets start our server
server.listen(PORT, function(){
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", chalk.yellow(PORT));
});